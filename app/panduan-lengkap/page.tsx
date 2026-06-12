"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";

export default function PanduanLengkapPage() {
  return (
    <DashboardLayout title="Panduan Lengkap">
      <div className="p-3 lg:p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 lg:p-8 text-white shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-4xl">article</span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl lg:text-4xl font-black mb-2">
                  Panduan Lengkap Sistem
                </h1>
                <p className="text-blue-100 text-sm lg:text-base">
                  Dokumentasi lengkap dalam satu halaman - tidak perlu download file terpisah
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6"
        >
          <h3 className="font-bold text-slate-900 mb-3 text-sm">Daftar Isi - Klik untuk scroll:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[
              { id: "overview", label: "Ringkasan", icon: "visibility" },
              { id: "requirements", label: "Kebutuhan", icon: "checklist" },
              { id: "installation", label: "Instalasi", icon: "download" },
              { id: "dashboard", label: "Dashboard", icon: "dashboard" },
              { id: "persimpangan", label: "Persimpangan", icon: "location_on" },
              { id: "analytics", label: "Analitik", icon: "analytics" },
              { id: "iot-config", label: "IoT Config", icon: "settings_remote" },
              { id: "users", label: "Pengguna", icon: "people" },
              { id: "notifications", label: "Notifikasi", icon: "notifications" },
              { id: "esp32", label: "ESP32", icon: "memory" },
              { id: "mqtt", label: "MQTT", icon: "cloud" },
              { id: "troubleshooting", label: "Troubleshoot", icon: "build" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  const element = document.getElementById(item.id);
                  element?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all border border-slate-200 hover:border-blue-300"
              >
                <span className="material-symbols-outlined text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-6">
          <OverviewSection />
          <RequirementsSection />
          <InstallationSection />
          <DashboardSection />
          <PersimpanganSection />
          <AnalyticsSection />
          <IoTConfigSection />
          <UsersSection />
          <NotificationsSection />
          <ESP32Section />
          <MQTTSection />
          <TroubleshootingSection />
        </div>

        {/* Back to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center z-50"
        >
          <span className="material-symbols-outlined">arrow_upward</span>
        </button>
      </div>
    </DashboardLayout>
  );
}

// ============ SECTIONS ============

function OverviewSection() {
  return (
    <section id="overview" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-blue-600 text-2xl">visibility</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">1. Ringkasan Sistem</h2>
          <p className="text-sm text-slate-500">Pengenalan Adaptive Traffic Monitoring System</p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none space-y-4">
        <p className="text-slate-700 leading-relaxed">
          <strong>Adaptive Traffic Monitoring System</strong> adalah solusi IoT terintegrasi yang dirancang untuk memantau dan mengelola lalu lintas secara real-time menggunakan sensor ESP32, MQTT broker, AWS DynamoDB, dan dashboard web modern.
        </p>

        <div className="grid md:grid-cols-2 gap-4 my-4">
          {[
            { icon: "sensors", title: "Monitoring Real-time", desc: "Pantau arus lalu lintas via MQTT WebSocket" },
            { icon: "analytics", title: "Analitik Lanjutan", desc: "Chart interaktif dan statistik mendalam" },
            { icon: "settings_remote", title: "Remote Config", desc: "Atur durasi lampu dari dashboard" },
            { icon: "notifications", title: "Notifikasi", desc: "Alert Telegram & Email otomatis" },
          ].map((item, idx) => (
            <div key={idx} className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="material-symbols-outlined text-blue-600 text-xl">{item.icon}</span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-3">Arsitektur Sistem:</h3>
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold">1</span>
              <span className="text-slate-700"><strong>ESP32 + Sensors</strong> → Deteksi kendaraan & antrean</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded flex items-center justify-center text-xs font-bold">2</span>
              <span className="text-slate-700"><strong>MQTT Broker</strong> → Komunikasi real-time</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-600 text-white rounded flex items-center justify-center text-xs font-bold">3</span>
              <span className="text-slate-700"><strong>Python Subscriber</strong> → Processing data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-pink-600 text-white rounded flex items-center justify-center text-xs font-bold">4</span>
              <span className="text-slate-700"><strong>AWS DynamoDB</strong> → Penyimpanan data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-teal-600 text-white rounded flex items-center justify-center text-xs font-bold">5</span>
              <span className="text-slate-700"><strong>Next.js Dashboard</strong> → Web interface</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RequirementsSection() {
  return (
    <section id="requirements" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-green-600 text-2xl">checklist</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">2. Kebutuhan Sistem</h2>
          <p className="text-sm text-slate-500">Hardware & Software Requirements</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-blue-600">computer</span>
            Dashboard (Frontend)
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700">
            <li>• <strong>Node.js</strong> 20+</li>
            <li>• <strong>npm</strong> atau yarn</li>
            <li>• <strong>RAM</strong> Min. 4 GB</li>
            <li>• <strong>Browser</strong> Chrome/Firefox/Edge</li>
          </ul>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-purple-600">code</span>
            Backend (Python)
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700">
            <li>• <strong>Python</strong> 3.10+</li>
            <li>• <strong>boto3</strong> (AWS SDK)</li>
            <li>• <strong>paho-mqtt</strong> (MQTT)</li>
            <li>• <strong>AWS Account</strong> + DynamoDB</li>
          </ul>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-orange-600">memory</span>
            Hardware (ESP32)
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700">
            <li>• <strong>ESP32 DevKit</strong></li>
            <li>• <strong>Sensor IR</strong> (3 unit)</li>
            <li>• <strong>HC-SR04</strong> (3 unit)</li>
            <li>• <strong>LED RGB</strong> (9 pcs)</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function InstallationSection() {
  return (
    <section id="installation" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-indigo-600 text-2xl">download</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">3. Instalasi & Setup</h2>
          <p className="text-sm text-slate-500">Step-by-step installation guide</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-lg">
          <h3 className="font-bold text-slate-900 mb-2">A. Setup Dashboard (Next.js)</h3>
          <pre className="bg-slate-900 text-green-400 p-3 rounded text-xs overflow-x-auto mt-2">
git clone &lt;repository-url&gt;<br/>
cd adaptive-traffic-monitoring<br/>
npm install<br/>
cp .env.local.example .env.local<br/>
# Edit .env.local dengan kredensial Anda<br/>
npm run dev<br/>
# Akses: http://localhost:3000
          </pre>
        </div>

        <div className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 rounded-r-lg">
          <h3 className="font-bold text-slate-900 mb-2">B. Setup Python Subscriber</h3>
          <pre className="bg-slate-900 text-green-400 p-3 rounded text-xs overflow-x-auto mt-2">
pip install boto3 paho-mqtt python-dotenv<br/>
# Buat file .env dan isi dengan kredensial<br/>
python aws_subscriber.py
          </pre>
        </div>

        <div className="border-l-4 border-orange-500 pl-4 py-2 bg-orange-50 rounded-r-lg">
          <h3 className="font-bold text-slate-900 mb-2">C. Setup ESP32 Device</h3>
          <ol className="text-sm space-y-1 text-slate-700">
            <li>1. Install Arduino IDE atau PlatformIO</li>
            <li>2. Upload <code className="bg-slate-200 px-1 rounded text-xs">iot/esp32/traffic_mqtt.ino</code></li>
            <li>3. Edit WiFi SSID & password di code</li>
            <li>4. Upload ke ESP32</li>
          </ol>
        </div>
      </div>
    </section>
  );
}

function DashboardSection() {
  return (
    <section id="dashboard" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-teal-600 text-2xl">dashboard</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">4. Penggunaan Dashboard</h2>
          <p className="text-sm text-slate-500">Navigasi dan fitur utama</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {[
          { title: "Status MQTT", desc: "Banner menampilkan status koneksi (Connected/Disconnected), Device ID, dan timestamp update" },
          { title: "Filter Waktu", desc: "Pilih Today, Yesterday, 7 Days, 30 Days, atau Custom untuk filter data" },
          { title: "Traffic Simulation", desc: "Visualisasi 3 jalur dengan warna lampu, vehicle count, dan queue level real-time" },
          { title: "Control Panel", desc: "Atur Auto Mode, Adaptive Mode, Green/Yellow Time, dan manual control lampu" },
        ].map((item, idx) => (
          <div key={idx} className="p-3 border border-slate-200 rounded-lg">
            <h4 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h4>
            <p className="text-xs text-slate-600">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="font-bold text-slate-900 text-sm mb-2">💡 Manual Control:</h4>
        <ol className="text-xs space-y-1 text-slate-700">
          <li>1. Matikan <strong>Auto Mode</strong></li>
          <li>2. Pilih jalur (North/South/East)</li>
          <li>3. Pilih warna (Red/Yellow/Green)</li>
          <li>4. Klik <strong>"Terapkan"</strong></li>
        </ol>
      </div>
    </section>
  );
}

function PersimpanganSection() {
  return (
    <section id="persimpangan" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-emerald-600 text-2xl">location_on</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">5. Manajemen Persimpangan</h2>
          <p className="text-sm text-slate-500">CRUD operations</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-slate-900 text-sm mb-2">➕ Tambah: </h4>
          <p className="text-xs text-slate-700">Menu Persimpangan → Klik "Tambah" → Isi form (Nama, Alamat, Device ID, Status) → Simpan</p>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-slate-900 text-sm mb-2">✏️ Edit: </h4>
          <p className="text-xs text-slate-700">Klik ikon Edit → Ubah data → Simpan Perubahan</p>
        </div>
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-semibold text-slate-900 text-sm mb-2">🗑️ Hapus: </h4>
          <p className="text-xs text-slate-700">Klik ikon Hapus → Konfirmasi ⚠️ <strong>Permanent!</strong></p>
        </div>
      </div>
    </section>
  );
}

function AnalyticsSection() {
  return (
    <section id="analytics" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-pink-600 text-2xl">analytics</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">6. Analitik Lalu Lintas</h2>
          <p className="text-sm text-slate-500">Data visualization & insights</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {[
          { emoji: "📊", title: "Vehicle Volume Chart", desc: "Line chart per jam/hari" },
          { emoji: "🥧", title: "Queue Distribution", desc: "Pie chart Level 0/1/2" },
          { emoji: "🔥", title: "Queue Heatmap", desc: "Intensitas per jam" },
          { emoji: "📈", title: "Queue by Hour", desc: "Stacked bar chart" },
          { emoji: "⏱️", title: "Green Duration", desc: "Efektivitas lampu" },
          { emoji: "📋", title: "Effectiveness Table", desc: "Skor 0-100" },
        ].map((item, idx) => (
          <div key={idx} className="p-2 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded text-center">
            <div className="text-2xl mb-1">{item.emoji}</div>
            <div className="font-bold text-xs text-slate-900">{item.title}</div>
            <div className="text-[10px] text-slate-600">{item.desc}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <div className="flex-1 bg-green-100 border border-green-300 rounded p-2 text-center">
          <div className="text-lg font-bold text-green-700">80+</div>
          <div className="text-[10px] text-green-600">Sangat Efektif</div>
        </div>
        <div className="flex-1 bg-yellow-100 border border-yellow-300 rounded p-2 text-center">
          <div className="text-lg font-bold text-yellow-700">60-80</div>
          <div className="text-[10px] text-yellow-600">Cukup Efektif</div>
        </div>
        <div className="flex-1 bg-red-100 border border-red-300 rounded p-2 text-center">
          <div className="text-lg font-bold text-red-700">&lt;60</div>
          <div className="text-[10px] text-red-600">Kurang Efektif</div>
        </div>
      </div>
    </section>
  );
}

function IoTConfigSection() {
  return (
    <section id="iot-config" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-cyan-600 text-2xl">settings_remote</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">7. Konfigurasi IoT Device</h2>
          <p className="text-sm text-slate-500">Remote configuration ESP32</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-3">
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <div className="font-bold text-green-700 text-sm mb-1">Level 0 Green</div>
          <div className="text-xs text-slate-600">Durasi saat LANCAR</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">Rekomendasi: 10s</div>
        </div>
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="font-bold text-yellow-700 text-sm mb-1">Level 1 Green</div>
          <div className="text-xs text-slate-600">Durasi saat SEDANG</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">Rekomendasi: 20s</div>
        </div>
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <div className="font-bold text-red-700 text-sm mb-1">Level 2 Green</div>
          <div className="text-xs text-slate-600">Durasi saat PADAT</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">Rekomendasi: 30-40s</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded">
          <div className="font-semibold text-slate-900 text-sm mb-1">Auto Mode</div>
          <ul className="text-xs text-slate-600 space-y-0.5">
            <li>• <strong>ON:</strong> Lampu bergantian otomatis</li>
            <li>• <strong>OFF:</strong> Control manual dari dashboard</li>
          </ul>
        </div>
        <div className="p-3 bg-purple-50 border border-purple-200 rounded">
          <div className="font-semibold text-slate-900 text-sm mb-1">Adaptive Mode</div>
          <ul className="text-xs text-slate-600 space-y-0.5">
            <li>• <strong>ON:</strong> Durasi mengikuti density</li>
            <li>• <strong>OFF:</strong> Durasi fixed Green Time</li>
          </ul>
        </div>
      </div>

      <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3">
        <p className="text-xs text-slate-700">
          <strong>Cara Simpan:</strong> Atur nilai → Klik "Simpan Konfigurasi" → Sistem kirim via MQTT ke ESP32
        </p>
      </div>
    </section>
  );
}

function UsersSection() {
  return (
    <section id="users" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-violet-600 text-2xl">people</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">8. Manajemen Pengguna</h2>
          <p className="text-sm text-slate-500">Role-based access control</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 border-2 border-blue-300 rounded">
          <h4 className="font-bold text-slate-900 text-sm mb-2">👔 Admin Pusat</h4>
          <ul className="text-xs space-y-0.5 text-slate-600">
            <li>✓ Full access semua fitur</li>
            <li>✓ CRUD pengguna</li>
            <li>✓ Konfigurasi IoT</li>
            <li>✓ Ekspor data</li>
          </ul>
        </div>
        <div className="p-3 bg-green-50 border-2 border-green-300 rounded">
          <h4 className="font-bold text-slate-900 text-sm mb-2">👷 Operator Lapangan</h4>
          <ul className="text-xs space-y-0.5 text-slate-600">
            <li>✓ View dashboard</li>
            <li>✓ View analitik</li>
            <li>✗ Tidak bisa config</li>
            <li>✗ Tidak bisa CRUD user</li>
          </ul>
        </div>
      </div>

      <div className="mt-3 bg-green-50 border border-green-200 rounded p-3">
        <p className="text-xs text-slate-700">
          <strong>Tambah User:</strong> Menu Pengguna → "Tambah Pengguna" → Isi Nama, Email, Password, Role → Simpan
        </p>
      </div>
    </section>
  );
}

function NotificationsSection() {
  return (
    <section id="notifications" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-amber-600 text-2xl">notifications</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">9. Notifikasi & Alert</h2>
          <p className="text-sm text-slate-500">Setup Telegram & Email</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 bg-red-50 border border-red-200 rounded text-center">
          <div className="font-bold text-red-700 text-xs">🚨 Critical</div>
          <div className="text-[10px] text-slate-600 mt-1">Queue Level 2</div>
        </div>
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
          <div className="font-bold text-yellow-700 text-xs">⚠️ Warning</div>
          <div className="text-[10px] text-slate-600 mt-1">Weak WiFi</div>
        </div>
        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-center">
          <div className="font-bold text-blue-700 text-xs">ℹ️ Info</div>
          <div className="text-[10px] text-slate-600 mt-1">Device Online</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <h4 className="font-bold text-slate-900 text-sm mb-2">📱 Setup Telegram</h4>
          <ol className="text-xs space-y-1 text-slate-700">
            <li>1. Cari @BotFather di Telegram</li>
            <li>2. Kirim /newbot, ikuti instruksi</li>
            <li>3. Simpan Bot Token</li>
            <li>4. Start bot, akses: api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</li>
            <li>5. Dapatkan Chat ID dari JSON</li>
            <li>6. Masukkan di Profile → Settings</li>
          </ol>
        </div>

        <div className="bg-green-50 border border-green-200 rounded p-3">
          <h4 className="font-bold text-slate-900 text-sm mb-2">📧 Setup Email (Gmail)</h4>
          <ol className="text-xs space-y-1 text-slate-700">
            <li>1. Google Account → Security</li>
            <li>2. Enable 2-Step Verification</li>
            <li>3. App passwords → Generate</li>
            <li>4. Masukkan di Profile → Settings</li>
          </ol>
        </div>
      </div>
    </section>
  );
}

function ESP32Section() {
  return (
    <section id="esp32" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-orange-600 text-2xl">memory</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">10. Setup ESP32 Hardware</h2>
          <p className="text-sm text-slate-500">Wiring & upload code</p>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-3">
        <h4 className="font-bold text-slate-900 text-sm mb-2">🔌 Pin Configuration</h4>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <div className="font-semibold mb-1">🚥 LED (North)</div>
            <div>Red: GPIO 16</div>
            <div>Yellow: GPIO 17</div>
            <div>Green: GPIO 5</div>
          </div>
          <div>
            <div className="font-semibold mb-1">👁️ IR Sensors</div>
            <div>North: GPIO 36</div>
            <div>South: GPIO 34</div>
            <div>East: GPIO 39</div>
          </div>
          <div>
            <div className="font-semibold mb-1">📏 Ultrasonic</div>
            <div>N TRIG: GPIO 27</div>
            <div>N ECHO: GPIO 14</div>
            <div>...</div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <h4 className="font-bold text-slate-900 text-sm mb-2">📝 Upload Code</h4>
        <ol className="text-xs space-y-1 text-slate-700">
          <li>1. Install Arduino IDE/PlatformIO</li>
          <li>2. Install library: WiFi, PubSubClient, ArduinoJson</li>
          <li>3. Buka iot/esp32/traffic_mqtt.ino</li>
          <li>4. Edit WiFi SSID & password</li>
          <li>5. Pilih board: ESP32 Dev Module</li>
          <li>6. Upload → Serial Monitor (115200 baud)</li>
        </ol>
      </div>
    </section>
  );
}

function MQTTSection() {
  return (
    <section id="mqtt" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-purple-600 text-2xl">cloud</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">11. Konfigurasi MQTT & Database</h2>
          <p className="text-sm text-slate-500">MQTT Broker & DynamoDB</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-purple-50 border border-purple-200 rounded p-3">
          <h4 className="font-bold text-slate-900 text-sm mb-2">🌐 MQTT Broker</h4>
          <table className="w-full text-xs">
            <tr><td className="font-semibold">Host:</td><td>3.25.72.124</td></tr>
            <tr><td className="font-semibold">Port:</td><td>1883</td></tr>
            <tr><td className="font-semibold">User:</td><td>jti</td></tr>
            <tr><td className="font-semibold">Pass:</td><td>Azure-password123</td></tr>
          </table>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded p-3">
          <h4 className="font-bold text-slate-900 text-sm mb-2">🗄️ DynamoDB Tables</h4>
          <ul className="text-xs space-y-1 text-slate-700">
            <li>• TrafficTelemetry</li>
            <li>• DeviceStatus</li>
            <li>• Notifications</li>
            <li>• Users</li>
          </ul>
        </div>
      </div>

      <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3">
        <h4 className="font-bold text-slate-900 text-sm mb-2">📡 MQTT Topics</h4>
        <ul className="text-xs space-y-1 text-slate-700">
          <li>• <code className="bg-slate-200 px-1 rounded">traffic/+/data</code> - Semua telemetry</li>
          <li>• <code className="bg-slate-200 px-1 rounded">traffic/&lt;id&gt;/config/set</code> - Send config</li>
          <li>• <code className="bg-slate-200 px-1 rounded">traffic/&lt;id&gt;/light/&lt;lane&gt;/set</code> - Manual control</li>
        </ul>
      </div>
    </section>
  );
}

function TroubleshootingSection() {
  return (
    <section id="troubleshooting" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 scroll-mt-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-red-600 text-2xl">build</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">12. Troubleshooting</h2>
          <p className="text-sm text-slate-500">Solusi masalah umum</p>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { 
            color: "red", 
            problem: "MQTT Disconnected", 
            solutions: ["Cek EC2 di AWS Console", "Pastikan MQTT_BROKER_URL benar", "Klik 'Hubungkan Ulang'"] 
          },
          { 
            color: "orange", 
            problem: "ESP32 WiFi Gagal", 
            solutions: ["Cek SSID & password", "ESP32 hanya support 2.4 GHz", "Jarak < 10m ke router"] 
          },
          { 
            color: "yellow", 
            problem: "AWS Error", 
            solutions: ["Cek AWS credentials", "Pastikan IAM permissions", "Test: aws dynamodb list-tables"] 
          },
          { 
            color: "blue", 
            problem: "Data Tidak Muncul", 
            solutions: ["ESP32 connected?", "Python subscriber running?", "Data masuk DynamoDB?"] 
          },
        ].map((item, idx) => (
          <div key={idx} className={`border-l-4 border-${item.color}-500 bg-${item.color}-50 p-3 rounded-r-lg`}>
            <h4 className="font-bold text-slate-900 text-sm mb-1">{item.problem}</h4>
            <ul className="text-xs space-y-0.5 text-slate-700">
              {item.solutions.map((sol, i) => (
                <li key={i}>• {sol}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
        <h4 className="font-bold text-slate-900 text-sm mb-2">📞 Butuh Bantuan?</h4>
        <div className="flex gap-4 text-xs text-slate-700">
          <div>📧 support@example.com</div>
          <div>📱 +62 812-3456-7890</div>
        </div>
      </div>
    </section>
  );
}
