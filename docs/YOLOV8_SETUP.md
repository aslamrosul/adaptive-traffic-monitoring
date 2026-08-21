# YOLOv8 Vehicle Detection - Setup Guide (EC2 Terpisah)

Panduan lengkap setup server YOLOv8 inference di EC2 terpisah untuk halaman Vision Lab (`/vision-lab-7x9k-alpha`).

## Arsitektur

```
[Browser/Camera] --WebSocket--> [EC2 YOLOv8 Server] --Inference--> [YOLOv8 Model]
                                      |
                                      v
                              [Detection JSON] --WS--> [Browser Canvas Overlay]
```

Server YOLOv8 berjalan di EC2 terpisah, menerima frame video via WebSocket, menjalankan inference, lalu mengirim hasil deteksi (bounding box + label + confidence) kembali ke browser.

---

## 1. Spesifikasi EC2

| Item | Minimum | Rekomendasi |
|------|---------|-------------|
| Instance | t3.medium | g4dn.xlarge (GPU) atau t3.large |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| RAM | 4GB | 8GB+ |
| Storage | 20GB | 30GB+ |
| GPU | Tidak wajib (CPU mode) | NVIDIA T4 (g4dn) |
| Security Group | Buka port 8080 (TCP) | Buka 8080 + 22 (SSH) |

> Catatan: Tanpa GPU, inference YOLOv8n akan berjalan ~5-15 FPS di CPU. Dengan GPU, bisa 30+ FPS.

---

## 2. Setup EC2 (Step-by-Step)

### 2.1 Launch Instance

```bash
# Login ke AWS Console -> EC2 -> Launch Instance
# Pilih: Ubuntu Server 22.04 LTS (ami-xxx)
# Instance type: t3.medium (cpu) atau g4dn.xlarge (gpu)
# Security Group: tambahkan rule:
#   - Type: Custom TCP, Port: 8080, Source: 0.0.0.0/0 (atau IP spesifik)
#   - Type: SSH, Port: 22, Source: your-ip/32
# Key pair: pilih atau buat key pair
# Launch
```

### 2.2 Connect & Update

```bash
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv ffmpeg git curl
```

### 2.3 (Opsional) Setup NVIDIA GPU

```bash
# Cek GPU
nvidia-smi

# Jika GPU terdeteksi, install CUDA toolkit
sudo apt install -y nvidia-cuda-toolkit

# Verifikasi
nvcc --version
```

---

## 3. Install YOLOv8 Server

### 3.1 Clone & Virtual Env

```bash
cd ~
git clone https://github.com/aslamrosul/yolov8-vision-server.git
# ATAU buat manual (lihat langkah 3.2)
cd yolov8-vision-server

python3 -m venv venv
source venv/bin/activate
```

### 3.2 Install Dependencies

```bash
pip install --upgrade pip
pip install ultralytics websocket-server opencv-python numpy pillow

# Jika pakai GPU:
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

### 3.3 Buat Server Script

Buat file `server.py`:

```python
#!/usr/bin/env python3
"""
YOLOv8 Vehicle Detection WebSocket Server
Menerima frame dari browser, kirim hasil deteksi via WebSocket
"""

import asyncio
import json
import base64
import io
import time
import logging
from websocket_server import WebsocketServer
from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Config
MODEL_NAME = "yolov8n.pt"          # yolov8n (nano) untuk speed, yolov8s untuk akurasi
CONFIDENCE = 0.5
PORT = 8080
HOST = "0.0.0.0"

# COCO class IDs untuk vehicle
VEHICLE_CLASSES = {2: "car", 5: "bus", 7: "truck", 3: "motorcycle", 1: "bicycle"}

# Load model
logger.info(f"Loading model {MODEL_NAME}...")
model = YOLO(MODEL_NAME)
logger.info("Model loaded.")

# Stats
frame_count = 0
last_fps_time = time.time()
fps = 0.0


def detect_vehicles(frame_b64: str, client_id: str, server: WebsocketServer):
    """Run YOLOv8 inference on a frame, send detections back."""
    global frame_count, last_fps_time, fps

    try:
        # Decode base64 -> image
        img_data = base64.b64decode(frame_b64.split(",")[1] if "," in frame_b64 else frame_b64)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return

        h, w = frame.shape[:2]

        # Inference
        t0 = time.time()
        results = model(frame, conf=CONFIDENCE, verbose=False)
        inference_ms = (time.time() - t0) * 1000

        # Parse detections
        detections = []
        stats = {
            "car": 0, "truck": 0, "bus": 0,
            "motorcycle": 0, "bicycle": 0,
            "totalVehicles": 0, "fps": 0, "inferenceMs": round(inference_ms, 1),
        }

        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])

                if cls_id not in VEHICLE_CLASSES:
                    continue

                label = VEHICLE_CLASSES[cls_id]

                # Bounding box (normalized to 0-100%)
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                nx = (x1 / w) * 100
                ny = (y1 / h) * 100
                nw = ((x2 - x1) / w) * 100
                nh = ((y2 - y1) / h) * 100

                detections.append({
                    "label": label,
                    "confidence": round(conf, 3),
                    "x": round(nx, 1),
                    "y": round(ny, 1),
                    "w": round(nw, 1),
                    "h": round(nh, 1),
                })

                stats[label] = stats.get(label, 0) + 1
                stats["totalVehicles"] += 1

        # FPS calculation
        frame_count += 1
        now = time.time()
        if now - last_fps_time >= 1.0:
            fps = frame_count / (now - last_fps_time)
            frame_count = 0
            last_fps_time = now
        stats["fps"] = round(fps, 1)

        # Send response
        response = {
            "type": "detections",
            "detections": detections,
            "stats": stats,
        }
        server.send_message(client_id, json.dumps(response))

    except Exception as e:
        logger.error(f"Detection error for client {client_id}: {e}")


def on_new_client(client, server):
    logger.info(f"Client connected: {client['id']} ({client['address']})")


def on_client_left(client, server):
    logger.info(f"Client left: {client['id']}")


def on_message(client, server, message):
    """Receive frame from browser, run detection."""
    try:
        data = json.loads(message)
        if data.get("type") == "frame" and "data" in data:
            detect_vehicles(data["data"], client["id"], server)
        elif data.get("type") == "config":
            global CONFIDENCE
            if "confidence" in data:
                CONFIDENCE = max(0.1, min(0.9, float(data["confidence"])))
                logger.info(f"Confidence updated to {CONFIDENCE}")
    except json.JSONDecodeError:
        # Maybe raw base64 frame
        detect_vehicles(message, client["id"], server)
    except Exception as e:
        logger.error(f"Message error: {e}")


if __name__ == "__main__":
    server = WebsocketServer(host=HOST, port=PORT)
    server.set_fn_new_client(on_new_client)
    server.set_fn_client_left(on_client_left)
    server.set_fn_message_received(on_message)

    logger.info(f"YOLOv8 Vision Server running on ws://{HOST}:{PORT}")
    server.run_forever()
```

### 3.4 Test Server

```bash
python server.py
# Output: "YOLOv8 Vision Server running on ws://0.0.0.0:8080"
# "Loading model yolov8n.pt..."
# "Model loaded."
```

---

## 4. Jalankan sebagai Service (systemd)

```bash
sudo tee /etc/systemd/system/yolov8-vision.service > /dev/null << 'EOF'
[Unit]
Description=YOLOv8 Vision Detection Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/yolov8-vision-server
ExecStart=/home/ubuntu/yolov8-vision-server/venv/bin/python server.py
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable yolov8-vision
sudo systemctl start yolov8-vision
sudo systemctl status yolov8-vision
```

---

## 5. Setup MediaMTX (RTSP → HLS/WebRTC Transcoder)

Jika kamera CCTV menggunakan RTSP, browser tidak bisa memutarnya langsung. Gunakan MediaMTX:

```bash
cd ~
wget https://github.com/bluenviron/mediamtx/releases/download/v1.9.0/mediamtx_v1.9.0_linux_amd64.tar.gz
tar xzf mediamtx_v1.9.0_linux_amd64.tar.gz
./mediamtx &
# Default: RTSP port 8554, HLS port 8888, WebRTC port 8889
```

Publish stream dari kamera RTSP:

```bash
ffmpeg -i "rtsp://user:pass@camera-ip:554/stream" -c copy -f rtsp rtsp://localhost:8554/camera1
```

Akses di browser:
- HLS: `http://<EC2-IP>:8888/camera1/index.m3u8`
- WebRTC: `http://<EC2-IP>:8889/camera1`

Masukkan URL HLS tersebut di halaman Vision Lab (pilih "RTSP/HLS").

---

## 6. Konfigurasi di Halaman Vision Lab

1. Buka: `https://astraea.my.id/vision-lab-7x9k-alpha`
2. Pilih sumber video: Webcam, RTSP/HLS, atau Upload
3. Di panel "YOLOv8 Detection Server", masukkan:
   ```
   ws://<EC2-PUBLIC-IP>:8080
   ```
   (atau `wss://` jika sudah setup SSL/reverse proxy)
4. Klik "Connect WS"
5. Deteksi akan muncul sebagai bounding box overlay di atas video

---

## 7. (Opsional) Reverse Proxy dengan SSL

Untuk menggunakan `wss://` (secure WebSocket):

```bash
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/yolov8-vision > /dev/null << 'EOF'
server {
    listen 443 ssl;
    server_name vision.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /ws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/yolov8-vision /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Gunakan Let's Encrypt untuk SSL gratis:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d vision.yourdomain.com
```

---

## 8. Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Model lambat (CPU) | Ganti ke `yolov8n.pt` (nano), turunkan resolusi frame |
| WebSocket tidak connect | Cek Security Group EC2 (port 8080), cek firewall |
| `ModuleNotFoundError: ultralytics` | `pip install ultralytics` di venv |
| GPU tidak terdeteksi | `nvidia-smi`, install CUDA, reinstall PyTorch dengan `--index-url https://download.pytorch.org/whl/cu121` |
| RTSP tidak tampil di browser | Gunakan MediaMTX untuk transcoding ke HLS/WebRTC |
| OOM (Out of Memory) | Upgrade instance, atau tambah swap: `sudo fallocate -l 4G /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |

---

## 9. Optimasi

- **Model**: `yolov8n.pt` (fastest) → `yolov8s.pt` (balanced) → `yolov8m.pt` (accurate)
- **Resolution**: Kirim frame dalam resolusi 640x480 untuk speed, 1280x720 untuk akurasi
- **Frame rate**: Batasi pengiriman frame ke 10-15 FPS dari browser untuk mengurangi beban server
- **Batch inference**: Jika multiple cameras, batch frame untuk efisiensi GPU
- **TensorRT**: Convert model YOLOv8 ke TensorRT engine untuk 2-3x speedup di GPU NVIDIA

```bash
# Export ke TensorRT
yolo export model=yolov8n.pt format=engine device=0
```

---

## 10. Integrasi dengan ASTRAEA

Setelah server YOLOv8 berjalan, hasil deteksi dapat diintegrasikan ke sistem ASTRAEA:

1. **Queue level detection**: Hitung jumlah kendaraan per lane → tentukan level antrean (0/1/2)
2. **MQTT publish**: Kirim data count ke MQTT topic yang sama dengan ESP32
3. **Dashboard**: Vision Lab mengirim deteksi real-time ke dashboard ASTRAEA

Contoh kode publish MQTT dari server YOLOv8:

```python
import paho.mqtt.client as mqtt

mqtt_client = mqtt.Client()
mqtt_client.connect("mqtt.astraea.my.id", 1883, 60)

# Publish vehicle count
mqtt_client.publish("traffic/camera1/count", json.dumps({
    "car": stats["car"],
    "truck": stats["truck"],
    "bus": stats["bus"],
    "motorcycle": stats["motorcycle"],
    "total": stats["totalVehicles"],
    "timestamp": time.time()
}))
```
