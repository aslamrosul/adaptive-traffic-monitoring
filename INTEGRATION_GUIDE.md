# 🔌 Panduan Integrasi IoT, Cloud & Big Data

## 📋 OVERVIEW

Project frontend sudah 100% selesai. Sekarang saatnya menghubungkan dengan:
1. **ESP32** (IoT) - Sensor & traffic light control
2. **Azure/GCP** (Cloud) - Storage & processing
3. **Big Data** - Analytics & ML

---

## 🎯 ARSITEKTUR SISTEM

```
┌─────────────┐
│   ESP32     │ ──MQTT──> ┌──────────────┐
│  (Sensor)   │           │  MQTT Broker │
└─────────────┘           │  (HiveMQ)    │
                          └──────────────┘
                                 │
                                 ▼
┌─────────────┐           ┌──────────────┐
│   Next.js   │ <──API──> │   Backend    │
│  Frontend   │           │  (API Routes)│
└─────────────┘           └──────────────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │  PostgreSQL  │
                          │  (Database)  │
                          └──────────────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │ Azure/GCP    │
                          │ (Cloud)      │
                          └──────────────┘
```

---

## 🔧 STEP 1: SETUP DATABASE (Prisma + PostgreSQL)

### Install Prisma

```bash
cd traffic-monitoring
npm install prisma @prisma/client
npx prisma init
```

### Edit `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Intersection {
  id          String   @id @default(cuid())
  name        String
  location    String
  lanes       Int      @default(4)
  volume      Int      @default(0)
  status      String   @default("Lancar")
  density     Int      @default(0)
  avgWaitTime Int      @default(0)
  latitude    Float?
  longitude   Float?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  trafficLogs TrafficLog[]
  events      Event[]
}

model TrafficLog {
  id             String       @id @default(cuid())
  intersectionId String
  intersection   Intersection @relation(fields: [intersectionId], references: [id])
  volume         Int
  density        Int
  avgWaitTime    Int
  timestamp      DateTime     @default(now())
  
  @@index([intersectionId, timestamp])
}

model Event {
  id             String       @id @default(cuid())
  intersectionId String
  intersection   Intersection @relation(fields: [intersectionId], references: [id])
  type           String       // "Anomali IoT", "Penyesuaian Fase", "Kendaraan Prioritas"
  description    String
  priority       String       // "LOW", "INFO", "CRITICAL"
  status         String       // "Auto-resolved", "Sistem", "Selesai"
  timestamp      DateTime     @default(now())
  
  @@index([intersectionId, timestamp])
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      String   // "ADMIN PUSAT", "OPERATOR LAPANGAN"
  status    String   @default("Aktif")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Report {
  id          String   @id @default(cuid())
  location    String
  type        String   // "Kemacetan", "Kecelakaan", "Gangguan Sensor", "Lainnya"
  priority    String   // "Rendah", "Sedang", "Tinggi", "Kritis"
  description String
  status      String   @default("Pending")
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Setup Database

```bash
# Edit .env
DATABASE_URL="postgresql://user:password@localhost:5432/traffic_db"

# Run migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

---

## 🔌 STEP 2: SETUP API ROUTES

### Create `app/api/traffic/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Ambil semua data traffic
export async function GET() {
  try {
    const intersections = await prisma.intersection.findMany({
      include: {
        trafficLogs: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    });
    
    return NextResponse.json(intersections);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST: Terima data dari ESP32
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validasi API key dari ESP32
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.ESP32_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Update intersection data
    const intersection = await prisma.intersection.update({
      where: { id: data.intersectionId },
      data: {
        volume: data.volume,
        density: data.density,
        avgWaitTime: data.avgWaitTime,
        status: data.status
      }
    });
    
    // Log traffic data
    await prisma.trafficLog.create({
      data: {
        intersectionId: data.intersectionId,
        volume: data.volume,
        density: data.density,
        avgWaitTime: data.avgWaitTime
      }
    });
    
    return NextResponse.json({ success: true, data: intersection });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}
```

### Create `app/api/events/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50
    });
    
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const event = await prisma.event.create({
      data: {
        intersectionId: data.intersectionId,
        type: data.type,
        description: data.description,
        priority: data.priority,
        status: data.status
      }
    });
    
    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
```

---

## 📡 STEP 3: SETUP MQTT untuk Real-time

### Install MQTT

```bash
npm install mqtt
```

### Create `lib/mqtt.ts`

```typescript
import mqtt from 'mqtt';
import { useTrafficStore } from './store';

const MQTT_BROKER = process.env.NEXT_PUBLIC_MQTT_BROKER || 'mqtt://broker.hivemq.com:1883';

let client: mqtt.MqttClient | null = null;

export function connectMQTT() {
  if (client) return client;
  
  client = mqtt.connect(MQTT_BROKER, {
    clientId: `traffic-monitor-${Math.random().toString(16).slice(3)}`,
    clean: true,
    reconnectPeriod: 1000
  });
  
  client.on('connect', () => {
    console.log('✅ MQTT Connected');
    
    // Subscribe ke topic traffic updates
    client?.subscribe('traffic/+/update', (err) => {
      if (!err) {
        console.log('📡 Subscribed to traffic updates');
      }
    });
  });
  
  client.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Update Zustand store
      useTrafficStore.getState().updateIntersection(data.id, {
        volume: data.volume,
        status: data.status,
        density: data.density,
        avgWaitTime: data.avgWaitTime
      });
      
      console.log('📊 Traffic data updated:', data);
    } catch (error) {
      console.error('❌ Failed to parse MQTT message:', error);
    }
  });
  
  client.on('error', (error) => {
    console.error('❌ MQTT Error:', error);
  });
  
  return client;
}

export function publishTrafficData(intersectionId: string, data: any) {
  if (!client) {
    console.error('❌ MQTT client not connected');
    return;
  }
  
  const topic = `traffic/${intersectionId}/update`;
  client.publish(topic, JSON.stringify(data), { qos: 1 });
}

export function disconnectMQTT() {
  if (client) {
    client.end();
    client = null;
  }
}
```

### Update `app/layout.tsx` untuk connect MQTT

```typescript
'use client';

import { useEffect } from 'react';
import { connectMQTT, disconnectMQTT } from '@/lib/mqtt';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Connect MQTT saat app load
    const client = connectMQTT();
    
    // Cleanup saat unmount
    return () => {
      disconnectMQTT();
    };
  }, []);
  
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
```

---

## 🤖 STEP 4: ESP32 CODE (Arduino)

### Install Libraries di Arduino IDE:
- PubSubClient (MQTT)
- ArduinoJson
- WiFi

### ESP32 Code Example

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

// Intersection ID
const char* intersectionId = "1";

WiFiClient espClient;
PubSubClient client(espClient);

// Sensor pins
const int sensorPin = 34; // Sensor volume kendaraan
const int redLED = 25;
const int yellowLED = 26;
const int greenLED = 27;

void setup() {
  Serial.begin(115200);
  
  // Setup pins
  pinMode(redLED, OUTPUT);
  pinMode(yellowLED, OUTPUT);
  pinMode(greenLED, OUTPUT);
  pinMode(sensorPin, INPUT);
  
  // Connect WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected");
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Baca sensor setiap 5 detik
  static unsigned long lastRead = 0;
  if (millis() - lastRead > 5000) {
    lastRead = millis();
    
    // Baca sensor (contoh: analog value)
    int sensorValue = analogRead(sensorPin);
    int volume = map(sensorValue, 0, 4095, 0, 5000);
    int density = map(sensorValue, 0, 4095, 0, 100);
    int avgWaitTime = map(sensorValue, 0, 4095, 10, 90);
    
    // Tentukan status
    String status = "Lancar";
    if (density > 70) status = "Macet Parah";
    else if (density > 40) status = "Sedang";
    
    // Kirim data via MQTT
    sendTrafficData(volume, density, avgWaitTime, status);
  }
}

void sendTrafficData(int volume, int density, int avgWaitTime, String status) {
  StaticJsonDocument<256> doc;
  doc["id"] = intersectionId;
  doc["volume"] = volume;
  doc["density"] = density;
  doc["avgWaitTime"] = avgWaitTime;
  doc["status"] = status;
  doc["timestamp"] = millis();
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  String topic = "traffic/" + String(intersectionId) + "/update";
  client.publish(topic.c_str(), buffer);
  
  Serial.println("📡 Data sent: " + String(buffer));
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("📨 Message received [");
  Serial.print(topic);
  Serial.print("]: ");
  
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);
  
  // Parse JSON untuk kontrol lampu
  StaticJsonDocument<256> doc;
  deserializeJson(doc, message);
  
  String lightStatus = doc["lightStatus"];
  if (lightStatus == "red") {
    digitalWrite(redLED, HIGH);
    digitalWrite(yellowLED, LOW);
    digitalWrite(greenLED, LOW);
  } else if (lightStatus == "yellow") {
    digitalWrite(redLED, LOW);
    digitalWrite(yellowLED, HIGH);
    digitalWrite(greenLED, LOW);
  } else if (lightStatus == "green") {
    digitalWrite(redLED, LOW);
    digitalWrite(yellowLED, LOW);
    digitalWrite(greenLED, HIGH);
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("🔄 Connecting to MQTT...");
    
    String clientId = "ESP32-" + String(intersectionId);
    if (client.connect(clientId.c_str())) {
      Serial.println("✅ Connected");
      
      // Subscribe ke topic kontrol
      String topic = "traffic/" + String(intersectionId) + "/control";
      client.subscribe(topic.c_str());
    } else {
      Serial.print("❌ Failed, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}
```

---

## ☁️ STEP 5: CLOUD INTEGRATION (Azure)

### Azure IoT Hub Setup

1. **Create IoT Hub** di Azure Portal
2. **Register ESP32 device**
3. **Get connection string**

### Install Azure SDK

```bash
npm install @azure/iot-hub
npm install @azure/storage-blob
```

### Create `lib/azure.ts`

```typescript
import { IoTHubServiceClient } from '@azure/iot-hub';
import { BlobServiceClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_IOT_HUB_CONNECTION_STRING!;
const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;

// IoT Hub Client
export const iotHubClient = IoTHubServiceClient.createFromConnectionString(connectionString);

// Blob Storage Client (untuk CCTV footage)
export const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);

// Upload CCTV image
export async function uploadCCTVImage(intersectionId: string, imageBuffer: Buffer) {
  const containerClient = blobServiceClient.getContainerClient('cctv-footage');
  const blobName = `${intersectionId}/${Date.now()}.jpg`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  await blockBlobClient.upload(imageBuffer, imageBuffer.length);
  
  return blockBlobClient.url;
}

// Send command to ESP32
export async function sendCommandToDevice(deviceId: string, command: any) {
  const methodParams = {
    methodName: 'setTrafficLight',
    payload: command,
    responseTimeoutInSeconds: 30
  };
  
  const result = await iotHubClient.invokeDeviceMethod(deviceId, methodParams);
  return result;
}
```

---

## 📊 STEP 6: BIG DATA ANALYTICS

### Setup Python Backend untuk ML

```bash
# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install pandas numpy scikit-learn fastapi uvicorn
```

### Create `analytics/predict.py`

```python
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# Load trained model (contoh)
model = RandomForestRegressor()

class TrafficData(BaseModel):
    hour: int
    day_of_week: int
    volume: int
    density: int

@app.post("/predict")
async def predict_traffic(data: TrafficData):
    # Predict future traffic
    features = np.array([[data.hour, data.day_of_week, data.volume, data.density]])
    prediction = model.predict(features)
    
    return {
        "predicted_volume": int(prediction[0]),
        "recommendation": "Increase green light duration" if prediction[0] > 3000 else "Normal operation"
    }

@app.get("/analytics")
async def get_analytics():
    # Calculate analytics dari database
    # Contoh: average volume per hour, peak hours, etc.
    return {
        "peak_hours": [7, 8, 17, 18],
        "average_volume": 2500,
        "congestion_index": 6.4
    }
```

### Run Python API

```bash
uvicorn predict:app --reload --port 8000
```

### Call dari Next.js

```typescript
// lib/analytics.ts
export async function getPrediction(data: any) {
  const response = await fetch('http://localhost:8000/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  return response.json();
}
```

---

## 🔐 STEP 7: AUTHENTICATION (NextAuth.js)

### Install NextAuth

```bash
npm install next-auth
```

### Create `app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        
        if (!user) {
          return null;
        }
        
        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isValid) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  }
});

export { handler as GET, handler as POST };
```

---

## 📝 ENVIRONMENT VARIABLES

Create `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/traffic_db"

# MQTT
NEXT_PUBLIC_MQTT_BROKER="mqtt://broker.hivemq.com:1883"

# ESP32
ESP32_API_KEY="your-secret-key-here"

# Azure
AZURE_IOT_HUB_CONNECTION_STRING="HostName=..."
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=..."

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Python Analytics API
ANALYTICS_API_URL="http://localhost:8000"
```

---

## 🚀 DEPLOYMENT

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod
```

### Azure (Backend + Database)

1. Create Azure App Service
2. Deploy Next.js app
3. Setup PostgreSQL database
4. Configure environment variables

---

## ✅ TESTING CHECKLIST

- [ ] Database connection working
- [ ] API routes responding
- [ ] MQTT connection established
- [ ] ESP32 sending data
- [ ] Real-time updates working
- [ ] Authentication working
- [ ] Cloud storage working
- [ ] Analytics API responding

---

## 📚 RESOURCES

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [MQTT.js Docs](https://github.com/mqttjs/MQTT.js)
- [Azure IoT Hub Docs](https://docs.microsoft.com/azure/iot-hub/)
- [ESP32 Arduino Docs](https://docs.espressif.com/projects/arduino-esp32/)

---

**Good luck dengan integrasi! 🚀**
