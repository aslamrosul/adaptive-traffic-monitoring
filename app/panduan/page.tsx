"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { useState } from "react";
import { useT } from "@/lib/useT";

export default function PanduanPage() {
  const t = useT();
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", icon: "visibility" },
    { id: "requirements", icon: "checklist" },
    { id: "installation", icon: "download" },
    { id: "dashboard", icon: "dashboard" },
    { id: "persimpangan", icon: "location_on" },
    { id: "analytics", icon: "analytics" },
    { id: "iot-config", icon: "settings_remote" },
    { id: "users", icon: "people" },
    { id: "notifications", icon: "notifications" },
    { id: "esp32", icon: "memory" },
    { id: "mqtt", icon: "cloud" },
    { id: "troubleshooting", icon: "build" },
  ];

  return (
    <DashboardLayout title={t('navigation.guide')}>
      <div className="p-3 lg:p-6 max-w-[1920px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 lg:p-8 text-white shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-4xl">menu_book</span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl lg:text-4xl font-black mb-2">
                  {t('help.systemGuide') || 'Panduan Penggunaan Sistem'}
                </h1>
                <p className="text-blue-100 text-sm lg:text-base">
                  {t('help.systemGuideDesc') || 'Petunjuk lengkap penggunaan dan konfigurasi Adaptive Traffic Monitoring System'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sticky top-20">
              <h3 className="font-bold text-slate-900 mb-4 text-sm">{t('guide.tableOfContents') || 'Daftar Isi'}</h3>
              <nav className="space-y-1">
                {sections.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      activeSection === item.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    <span className="text-left flex-1">{t(`guide.sections.${item.id}`) || item.id}</span>
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3"
          >
            <PanduanSections activeSection={activeSection} />
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function PanduanSections({ activeSection }: { activeSection: string }) {
  if (activeSection === "overview") {
    return <OverviewSection />;
  }
  if (activeSection === "requirements") {
    return <RequirementsSection />;
  }
  if (activeSection === "installation") {
    return <InstallationSection />;
  }
  if (activeSection === "dashboard") {
    return <DashboardSection />;
  }
  if (activeSection === "persimpangan") {
    return <PersimpanganSection />;
  }
  if (activeSection === "analytics") {
    return <AnalyticsSection />;
  }
  if (activeSection === "iot-config") {
    return <IoTConfigSection />;
  }
  if (activeSection === "users") {
    return <UsersSection />;
  }
  if (activeSection === "notifications") {
    return <NotificationsSection />;
  }
  if (activeSection === "esp32") {
    return <ESP32Section />;
  }
  if (activeSection === "mqtt") {
    return <MQTTSection />;
  }
  if (activeSection === "troubleshooting") {
    return <TroubleshootingSection />;
  }
  return null;
}

function OverviewSection() {
  const t = useT();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-blue-600 text-2xl">visibility</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('guide.overview.title')}</h2>
          <p className="text-sm text-slate-500">{t('guide.overview.subtitle')}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-3">{t('guide.overview.whatIs')}</h3>
        <p className="text-slate-700 leading-relaxed">
          <strong>Adaptive Traffic Monitoring System</strong> {t('guide.overview.whatIsDesc')}
        </p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-3">{t('guide.overview.mainFeatures')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: "sensors", titleKey: "realtimeMonitoring", descKey: "realtimeDesc" },
            { icon: "analytics", titleKey: "advancedAnalytics", descKey: "advancedDesc" },
            { icon: "settings_remote", titleKey: "remoteConfig", descKey: "remoteDesc" },
            { icon: "notifications", titleKey: "autoNotif", descKey: "autoNotifDesc" },
          ].map((feature, idx) => (
            <div key={idx} className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <span className="material-symbols-outlined text-blue-600 text-2xl">{feature.icon}</span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{t(`guide.overview.features.${feature.titleKey}`)}</h4>
                <p className="text-xs text-slate-600 mt-1">{t(`guide.overview.features.${feature.descKey}`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-3">{t('guide.overview.architecture')}</h3>
        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
          <div className="space-y-4">
            {[
              { num: "1", title: "IoT Layer (ESP32)", desc: "Sensor IR dan Ultrasonic untuk deteksi kendaraan", color: "blue" },
              { num: "2", title: "MQTT Broker (Mosquitto)", desc: "Komunikasi real-time antara device dan server", color: "indigo" },
              { num: "3", title: "Python Subscriber", desc: "Processing data dan simpan ke DynamoDB", color: "purple" },
              { num: "4", title: "AWS DynamoDB", desc: "Penyimpanan telemetry, status device, dan notifikasi", color: "pink" },
              { num: "5", title: "Next.js Dashboard", desc: "Web interface untuk monitoring dan kontrol", color: "teal" },
            ].map((item) => (
              <div key={item.num} className="flex items-center gap-4">
                <div className={`w-10 h-10 bg-${item.color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white font-bold">{item.num}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">{item.title}</h4>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Placeholder sections - akan dibuat detail nanti
function RequirementsSection() {
  const t = useT();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-green-600 text-2xl">checklist</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('guide.requirements.title')}</h2>
          <p className="text-sm text-slate-500">{t('guide.requirements.subtitle')}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">computer</span>
            Dashboard (Frontend)
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>Node.js</strong> 20+</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>RAM</strong> Min. 4 GB</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>Browser</strong> Modern (Chrome/Firefox)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>Internet</strong> Stabil</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-600">code</span>
            Backend (Python)
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span><strong>Python</strong> 3.10+</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span><strong>boto3</strong> AWS SDK</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span><strong>paho-mqtt</strong> Client</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span><strong>AWS Account</strong> + DynamoDB</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-600">memory</span>
            Hardware (ESP32)
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-orange-600 mt-1">•</span>
              <span><strong>ESP32 DevKit</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 mt-1">•</span>
              <span><strong>Sensor IR</strong> (3 unit)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 mt-1">•</span>
              <span><strong>HC-SR04</strong> (3 unit)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 mt-1">•</span>
              <span><strong>LED RGB</strong> atau Traffic Light</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-amber-600 text-xl">info</span>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 text-sm mb-1">{t('guide.requirements.importantNote')}</h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              {t('guide.requirements.importantNoteDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstallationSection() {
  const t = useT();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-indigo-600 text-2xl">download</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('guide.installation.title')}</h2>
          <p className="text-sm text-slate-500">{t('guide.installation.subtitle')}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-l-4 border-blue-500 pl-4 py-2">
          <h3 className="font-bold text-slate-900 mb-2">A. Setup Dashboard (Next.js)</h3>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">1. Clone Repository</h4>
              <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">
                git clone &lt;repository-url&gt;<br/>
                cd adaptive-traffic-monitoring
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">2. Install Dependencies</h4>
              <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-xs">npm install</pre>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">3. Konfigurasi Environment</h4>
              <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">
                cp .env.local.example .env.local<br/>
                # Edit .env.local dengan kredensial Anda
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">4. Jalankan Development</h4>
              <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-xs">
                npm run dev<br/>
                # Buka http://localhost:3000
              </pre>
            </div>
          </div>
        </div>

        <div className="border-l-4 border-purple-500 pl-4 py-2">
          <h3 className="font-bold text-slate-900 mb-2">B. Setup Python Subscriber</h3>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">1. Install Dependencies</h4>
              <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-xs">
                pip install boto3 paho-mqtt python-dotenv
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">2. Konfigurasi .env</h4>
              <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">
                MQTT_HOST=3.25.72.124<br/>
                MQTT_PORT=1883<br/>
                AWS_ACCESS_KEY_ID=your-key<br/>
                AWS_SECRET_ACCESS_KEY=your-secret
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">3. Jalankan Subscriber</h4>
              <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-xs">
                python aws_subscriber.py
              </pre>
            </div>
          </div>
        </div>

        <div className="border-l-4 border-orange-500 pl-4 py-2">
          <h3 className="font-bold text-slate-900 mb-2">C. Setup ESP32 Device</h3>
          <p className="text-sm text-slate-600 mb-2">
            1. Install Arduino IDE atau PlatformIO<br/>
            2. Upload code dari <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">iot/esp32/traffic_mqtt.ino</code><br/>
            3. Edit WiFi SSID dan password<br/>
            4. Upload ke ESP32
          </p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-green-600 text-xl">check_circle</span>
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">{t('guide.installation.totalTime')}</h4>
            <p className="text-xs text-slate-700">{t('guide.installation.totalTimeDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSection() {
  const t = useT();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-teal-600 text-2xl">dashboard</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('guide.dashboardGuide.title')}</h2>
          <p className="text-sm text-slate-500">{t('guide.dashboardGuide.subtitle')}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 border border-slate-200 rounded-lg">
          <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">sensors</span>
            Status Koneksi MQTT
          </h3>
          <p className="text-sm text-slate-700 mb-2">Banner di atas dashboard menampilkan:</p>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>• <strong className="text-green-600">CONNECTED</strong> - Sistem terhubung ke broker</li>
            <li>• <strong className="text-red-600">DISCONNECTED</strong> - Koneksi terputus</li>
            <li>• Device ID dan Persimpangan aktif</li>
            <li>• Timestamp update terakhir</li>
          </ul>
        </div>

        <div className="p-4 border border-slate-200 rounded-lg">
          <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-600">filter_alt</span>
            Filter Waktu
          </h3>
          <p className="text-sm text-slate-700 mb-2">Pilih rentang data:</p>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>• <strong>Today</strong> - Data hari ini</li>
            <li>• <strong>Yesterday</strong> - Data kemarin</li>
            <li>• <strong>7 Days</strong> - 7 hari terakhir</li>
            <li>• <strong>30 Days</strong> - 30 hari terakhir</li>
            <li>• <strong>Custom</strong> - Pilih tanggal manual</li>
          </ul>
        </div>

        <div className="p-4 border border-slate-200 rounded-lg">
          <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-600">swap_horiz</span>
            Traffic Road Simulation
          </h3>
          <p className="text-sm text-slate-700 mb-2">Visualisasi persimpangan real-time:</p>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>• 3 Jalur: Utara, Selatan, Timur</li>
            <li>• Warna lampu update otomatis</li>
            <li>• Vehicle count per jalur</li>
            <li>• Queue Level: 0 (Lancar), 1 (Sedang), 2 (Padat)</li>
          </ul>
        </div>

        <div className="p-4 border border-slate-200 rounded-lg">
          <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">tune</span>
            Traffic Control Panel
          </h3>
          <p className="text-sm text-slate-700 mb-2">Panel kontrol di sidebar kanan:</p>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>• <strong>Auto Mode</strong> ON/OFF</li>
            <li>• <strong>Adaptive Mode</strong> ON/OFF</li>
            <li>• <strong>Green/Yellow Time</strong> konfigurasi</li>
            <li>• <strong>Manual Control</strong> ubah lampu manual</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">help</span>
          Cara Menggunakan Manual Control
        </h3>
        <ol className="space-y-2 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="font-bold text-blue-600">1.</span>
            <span>Matikan <strong>Auto Mode</strong> di Traffic Control Panel</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-600">2.</span>
            <span>Pilih jalur yang ingin diubah (North/South/East)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-600">3.</span>
            <span>Pilih warna lampu (Red/Yellow/Green)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-600">4.</span>
            <span>Klik tombol <strong>"Terapkan"</strong></span>
          </li>
        </ol>
        <p className="mt-3 text-xs text-slate-600 bg-amber-100 border border-amber-300 rounded p-2">
          ⚠️ <strong>Catatan:</strong> Manual control hanya berfungsi jika Auto Mode dalam keadaan OFF!
        </p>
      </div>
    </div>
  );
}

function PersimpanganSection() {
  const t = useT();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-emerald-600 text-2xl">location_on</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('guide.intersectionManagement.title')}</h2>
          <p className="text-sm text-slate-500">{t('guide.intersectionManagement.subtitle')}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600">add_circle</span>
            Menambah Persimpangan Baru
          </h3>
          <ol className="space-y-2 text-sm text-slate-700">
            <li><strong>1.</strong> Buka menu <strong>"Persimpangan"</strong> di sidebar</li>
            <li><strong>2.</strong> Klik tombol <strong>"Tambah Persimpangan"</strong></li>
            <li><strong>3.</strong> Isi form dengan data:
              <ul className="ml-6 mt-1 text-xs space-y-1">
                <li>• Nama Persimpangan (contoh: "Simpang Talun")</li>
                <li>• Alamat lengkap</li>
                <li>• Device ID (contoh: ESP32_TRAFFIC_01)</li>
                <li>• Jumlah Jalur (3 atau 4)</li>
                <li>• Status: Active/Maintenance/Inactive</li>
                <li>• Koordinat (latitude/longitude - optional)</li>
              </ul>
            </li>
            <li><strong>4.</strong> Klik <strong>"Simpan"</strong></li>
          </ol>
        </div>

        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">edit</span>
            Edit Persimpangan
          </h3>
          <p className="text-sm text-slate-700">
            Klik ikon <strong>Edit (pensil)</strong> pada card persimpangan, ubah data yang diperlukan, lalu klik <strong>"Simpan Perubahan"</strong>.
          </p>
        </div>

        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600">delete</span>
            Hapus Persimpangan
          </h3>
          <p className="text-sm text-slate-700 mb-2">
            Klik ikon <strong>Hapus (trash)</strong> pada card persimpangan, lalu konfirmasi penghapusan.
          </p>
          <div className="bg-red-100 border border-red-300 rounded p-2 text-xs text-red-800">
            ⚠️ <strong>Peringatan:</strong> Penghapusan bersifat permanen dan tidak dapat dikembalikan!
          </div>
        </div>

        <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-600">visibility</span>
            Lihat Detail Persimpangan
          </h3>
          <p className="text-sm text-slate-700">
            Klik <strong>"Detail"</strong> atau klik card langsung untuk membuka halaman detail yang menampilkan:
          </p>
          <ul className="text-xs mt-2 space-y-1 text-slate-600 ml-4">
            <li>• Informasi lengkap persimpangan</li>
            <li>• Real-time traffic status</li>
            <li>• Riwayat telemetry</li>
            <li>• Grafik volume kendaraan</li>
            <li>• Device status dan kesehatan sistem</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function AnalyticsSection() {
  const t = useT();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-pink-600 text-2xl">analytics</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('guide.analyticsGuide.title')}</h2>
          <p className="text-sm text-slate-500">{t('guide.analyticsGuide.subtitle')}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-slate-900 mb-2">📊 Vehicle Volume Chart</h3>
          <p className="text-sm text-slate-700">Line chart volume kendaraan per jam atau per hari dengan filter jalur.</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <h3 className="font-bold text-slate-900 mb-2">🥧 Queue Distribution</h3>
          <p className="text-sm text-slate-700">Pie chart distribusi Level 0 (Lancar), Level 1 (Sedang), Level 2 (Padat).</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <h3 className="font-bold text-slate-900 mb-2">🔥 Queue Hourly Heatmap</h3>
          <p className="text-sm text-slate-700">Heatmap intensitas antrean per jam untuk identifikasi jam sibuk.</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
          <h3 className="font-bold text-slate-900 mb-2">📈 Queue Level by Hour</h3>
          <p className="text-sm text-slate-700">Stacked bar chart distribusi queue level per jam.</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg">
          <h3 className="font-bold text-slate-900 mb-2">⏱️ Green Duration Chart</h3>
          <p className="text-sm text-slate-700">Efektivitas durasi lampu hijau vs volume kendaraan.</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg">
          <h3 className="font-bold text-slate-900 mb-2">📋 Effectiveness Table</h3>
          <p className="text-sm text-slate-700">Tabel skor efektivitas lampu per jalur (0-100).</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-3">📌 Cara Membaca Skor Efektivitas</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-100 border border-green-300 rounded p-2 text-center">
            <div className="text-2xl font-bold text-green-700">80+</div>
            <div className="text-xs text-green-600 mt-1">Sangat Efektif</div>
          </div>
          <div className="bg-yellow-100 border border-yellow-300 rounded p-2 text-center">
            <div className="text-2xl font-bold text-yellow-700">60-80</div>
            <div className="text-xs text-yellow-600 mt-1">Cukup Efektif</div>
          </div>
          <div className="bg-red-100 border border-red-300 rounded p-2 text-center">
            <div className="text-2xl font-bold text-red-700">&lt;60</div>
            <div className="text-xs text-red-600 mt-1">Kurang Efektif</div>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-600">download</span>
          Ekspor Data Analitik
        </h3>
        <p className="text-sm text-slate-700">
          Klik tombol <strong>"Ekspor Ringkasan"</strong> di kanan atas untuk download data ke CSV. 
          File dapat dibuka dengan Excel atau Google Sheets.
        </p>
      </div>
    </div>
  );
}

function IoTConfigSection() {
  const t = useT();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-cyan-600 text-2xl">settings_remote</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('guide.iotConfigGuide.title')}</h2>
          <p className="text-sm text-slate-500">{t('guide.iotConfigGuide.subtitle')}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 border-2 border-blue-300 bg-blue-50 rounded-lg">
          <h3 className="font-bold text-slate-900 mb-2">⏱️ Green Time (Detik)</h3>
          <p className="text-sm text-slate-700 mb-2">Durasi default lampu hijau saat tidak adaptive.</p>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>• <strong>Min:</strong> 5 detik</li>
            <li>• <strong>Max:</strong> 120 detik</li>
            <li>• <strong>Rekomendasi:</strong> 10-30 detik</li>
          </ul>
        </div>

        <div className="p-4 border-2 border-yellow-300 bg-yellow-50 rounded-lg">
          <h3 className="font-bold text-slate-900 mb-2">🟡 Yellow Time (Detik)</h3>
          <p className="text-sm text-slate-700 mb-2">Durasi lampu kuning transisi.</p>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>• <strong>Min:</strong> 2 detik</li>
            <li>• <strong>Max:</strong> 10 detik</li>
            <li>• <strong>Rekomendasi:</strong> 3 detik</li>
          </ul>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-3">🎯 Adaptive Mode Configuration</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="bg-white rounded p-3 border border-slate-200">
            <div className="font-bold text-green-600 mb-1">Level 0 Green</div>
            <p className="text-xs text-slate-600">Durasi saat LANCAR (tidak ada kendaraan)</p>
            <div className="text-sm font-semibold text-slate-900 mt-2">Rekomendasi: 10 detik</div>
          </div>
          <div className="bg-white rounded p-3 border border-slate-200">
            <div className="font-bold text-yellow-600 mb-1">Level 1 Green</div>
            <p className="text-xs text-slate-600">Durasi saat SEDANG (ada kendaraan)</p>
            <div className="text-sm font-semibold text-slate-900 mt-2">Rekomendasi: 20 detik</div>
          </div>
          <div className="bg-white rounded p-3 border border-slate-200">
            <div className="font-bold text-red-600 mb-1">Level 2 Green</div>
            <p className="text-xs text-slate-600">Durasi saat PADAT (antrean panjang)</p>
            <div className="text-sm font-semibold text-slate-900 mt-2">Rekomendasi: 30-40 detik</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-slate-900">🔧 Mode Operasi</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="font-semibold text-slate-900 mb-1">Auto Mode</div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• <strong>ON:</strong> Lampu bergantian otomatis</li>
              <li>• <strong>OFF:</strong> Control manual dari dashboard</li>
            </ul>
          </div>
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="font-semibold text-slate-900 mb-1">Adaptive Mode</div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• <strong>ON:</strong> Durasi mengikuti density level</li>
              <li>• <strong>OFF:</strong> Durasi fixed sesuai Green Time</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-3">💡 Tips Konfigurasi Optimal</h3>
        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-semibold text-amber-900 mb-2">Jam Sibuk (Peak Hours)</div>
            <pre className="bg-slate-900 text-green-400 p-2 rounded text-xs">
Green Time: 15 detik<br/>
Level 0: 10 detik<br/>
Level 1: 25 detik<br/>
Level 2: 40 detik<br/>
Adaptive: ON
            </pre>
          </div>
          <div>
            <div className="font-semibold text-amber-900 mb-2">Jam Sepi (Off-Peak)</div>
            <pre className="bg-slate-900 text-green-400 p-2 rounded text-xs">
Green Time: 10 detik<br/>
Level 0: 8 detik<br/>
Level 1: 15 detik<br/>
Level 2: 25 detik<br/>
Adaptive: ON
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-2">💾 Cara Menyimpan Konfigurasi</h3>
        <ol className="text-sm text-slate-700 space-y-1">
          <li>1. Atur nilai-nilai yang diinginkan</li>
          <li>2. Klik tombol <strong>"Simpan Konfigurasi"</strong></li>
          <li>3. Sistem akan menyimpan ke DynamoDB</li>
          <li>4. Command dikirim ke ESP32 via MQTT topic: <code className="bg-slate-200 px-1 rounded text-xs">traffic/&lt;device_id&gt;/config/set</code></li>
          <li>5. ESP32 menerima dan apply konfigurasi baru</li>
        </ol>
      </div>
    </div>
  );
}

function UsersSection() {
  const t = useT();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-violet-600 text-2xl">people</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('guide.userManagement.title')}</h2>
          <p className="text-sm text-slate-500">{t('guide.userManagement.subtitle')}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-blue-600">verified_user</span>
            <h3 className="font-bold text-slate-900">Admin Pusat</h3>
          </div>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>✓ Akses penuh semua fitur</li>
            <li>✓ Manajemen pengguna (CRUD)</li>
            <li>✓ Konfigurasi IoT device</li>
            <li>✓ Manajemen persimpangan</li>
            <li>✓ Ekspor data</li>
          </ul>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-green-600">monitor_heart</span>
            <h3 className="font-bold text-slate-900">Operator Lapangan</h3>
          </div>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>✓ Lihat dashboard monitoring</li>
            <li>✓ Lihat analitik</li>
            <li>✓ Lihat persimpangan</li>
            <li>✗ Tidak bisa ubah konfigurasi</li>
            <li>✗ Tidak bisa CRUD user</li>
          </ul>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-3">➕ Menambah Pengguna Baru</h3>
        <ol className="text-sm space-y-1 text-slate-700">
          <li>1. Buka menu <strong>"Pengguna"</strong></li>
          <li>2. Klik <strong>"Tambah Pengguna"</strong></li>
          <li>3. Isi: Nama, Email, Password, Role, Status</li>
          <li>4. Klik <strong>"Tambah Pengguna"</strong></li>
        </ol>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-semibold text-slate-900 mb-2 text-sm">✏️ Edit Pengguna</h4>
          <p className="text-xs text-slate-600">Klik ikon Edit (pensil), ubah data, lalu Simpan Perubahan.</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h4 className="font-semibold text-slate-900 mb-2 text-sm">🗑️ Hapus Pengguna</h4>
          <p className="text-xs text-slate-600">Klik ikon Hapus (trash), lalu konfirmasi. ⚠️ Tidak bisa hapus akun sendiri!</p>
        </div>
      </div>
    </div>
  );
}

function NotificationsSection() {
  const t = useT();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-amber-600 text-2xl">notifications</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('guide.notificationsGuide.title')}</h2>
          <p className="text-sm text-slate-500">{t('guide.notificationsGuide.subtitle')}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="font-bold text-red-700 mb-2">🚨 Critical</div>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>• Queue Level 2 (Padat)</li>
            <li>• Vehicle count tinggi</li>
          </ul>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="font-bold text-yellow-700 mb-2">⚠️ Warning</div>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>• Weak WiFi Signal</li>
            <li>• Dummy Mode Active</li>
          </ul>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="font-bold text-blue-700 mb-2">ℹ️ Info</div>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>• Device Online</li>
            <li>• Config Updated</li>
          </ul>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-3">📱 Setup Telegram</h3>
        <ol className="text-sm space-y-2 text-slate-700">
          <li><strong>1.</strong> Buka Telegram, cari <code className="bg-slate-200 px-1 rounded text-xs">@BotFather</code></li>
          <li><strong>2.</strong> Kirim <code className="bg-slate-200 px-1 rounded text-xs">/newbot</code> dan ikuti instruksi</li>
          <li><strong>3.</strong> Simpan <strong>Bot Token</strong></li>
          <li><strong>4.</strong> Start bot Anda, lalu akses: <code className="bg-slate-200 px-1 py-0.5 rounded text-xs break-all">https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code></li>
          <li><strong>5.</strong> Cari <strong>Chat ID</strong> dari response JSON</li>
          <li><strong>6.</strong> Masukkan Bot Token dan Chat ID di <strong>Profile → Settings → Notifikasi</strong></li>
          <li><strong>7.</strong> Klik <strong>"Test Telegram"</strong> dan <strong>"Simpan"</strong></li>
        </ol>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-3">📧 Setup Email (Gmail)</h3>
        <ol className="text-sm space-y-2 text-slate-700">
          <li><strong>1.</strong> Login ke Gmail</li>
          <li><strong>2.</strong> Buka <strong>Google Account → Security</strong></li>
          <li><strong>3.</strong> Enable <strong>2-Step Verification</strong></li>
          <li><strong>4.</strong> Klik <strong>App passwords</strong></li>
          <li><strong>5.</strong> Pilih <strong>Mail</strong> dan <strong>Other</strong> (Custom name)</li>
          <li><strong>6.</strong> Google akan generate 16-character password</li>
          <li><strong>7.</strong> Masukkan di <strong>Profile → Settings → Notifikasi</strong></li>
          <li><strong>8.</strong> Klik <strong>"Test Email"</strong> dan <strong>"Simpan"</strong></li>
        </ol>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-2">⏰ Cooldown Period</h3>
        <p className="text-sm text-slate-700">
          Untuk mencegah spam, notifikasi memiliki cooldown <strong>5 menit</strong>. 
          Artinya alert yang sama tidak akan dikirim lagi dalam 5 menit.
        </p>
      </div>
    </div>
  );
}

function ESP32Section() {
  const t = useT();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-orange-600 text-2xl">memory</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('guide.esp32Setup.title')}</h2>
          <p className="text-sm text-slate-500">{t('guide.esp32Setup.subtitle')}</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-3">🔌 Pin Configuration</h3>
        <div className="grid md:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="font-semibold text-orange-900 mb-2">🚥 Traffic Light (LED)</div>
            <table className="w-full text-xs">
              <tr><td className="font-semibold">North Red:</td><td>GPIO 16</td></tr>
              <tr><td className="font-semibold">North Yellow:</td><td>GPIO 17</td></tr>
              <tr><td className="font-semibold">North Green:</td><td>GPIO 5</td></tr>
              <tr><td className="font-semibold">South Red:</td><td>GPIO 15</td></tr>
              <tr><td className="font-semibold">South Yellow:</td><td>GPIO 22</td></tr>
              <tr><td className="font-semibold">South Green:</td><td>GPIO 23</td></tr>
              <tr><td className="font-semibold">East Red:</td><td>GPIO 18</td></tr>
              <tr><td className="font-semibold">East Yellow:</td><td>GPIO 19</td></tr>
              <tr><td className="font-semibold">East Green:</td><td>GPIO 21</td></tr>
            </table>
          </div>
          <div>
            <div className="font-semibold text-orange-900 mb-2">👁️ IR Sensors</div>
            <table className="w-full text-xs">
              <tr><td className="font-semibold">North IR:</td><td>GPIO 36</td></tr>
              <tr><td className="font-semibold">South IR:</td><td>GPIO 34</td></tr>
              <tr><td className="font-semibold">East IR:</td><td>GPIO 39</td></tr>
            </table>
          </div>
          <div>
            <div className="font-semibold text-orange-900 mb-2">📏 Ultrasonic (HC-SR04)</div>
            <table className="w-full text-xs">
              <tr><td className="font-semibold">North TRIG:</td><td>GPIO 27</td></tr>
              <tr><td className="font-semibold">North ECHO:</td><td>GPIO 14</td></tr>
              <tr><td className="font-semibold">South TRIG:</td><td>GPIO 25</td></tr>
              <tr><td className="font-semibold">South ECHO:</td><td>GPIO 26</td></tr>
              <tr><td className="font-semibold">East TRIG:</td><td>GPIO 12</td></tr>
              <tr><td className="font-semibold">East ECHO:</td><td>GPIO 13</td></tr>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-3">📝 Upload Code ke ESP32</h3>
        <ol className="text-sm space-y-2 text-slate-700">
          <li><strong>1.</strong> Install <strong>Arduino IDE</strong> atau <strong>PlatformIO</strong></li>
          <li><strong>2.</strong> Install library:
            <ul className="ml-6 mt-1 text-xs space-y-0.5">
              <li>• WiFi.h (built-in)</li>
              <li>• PubSubClient.h (MQTT)</li>
              <li>• ArduinoJson.h</li>
            </ul>
          </li>
          <li><strong>3.</strong> Buka file <code className="bg-slate-200 px-1 rounded text-xs">iot/esp32/traffic_mqtt.ino</code></li>
          <li><strong>4.</strong> Edit kredensial WiFi dan MQTT:
            <pre className="bg-slate-900 text-green-400 p-2 rounded text-xs mt-2">
const char* ssid = "YOUR_WIFI_SSID";<br/>
const char* wifiPassword = "YOUR_WIFI_PASSWORD";<br/>
#define MQTT_USER "jti"<br/>
#define MQTT_PASS "Azure-password123"
            </pre>
          </li>
          <li><strong>5.</strong> Pilih board: <strong>ESP32 Dev Module</strong></li>
          <li><strong>6.</strong> Pilih port COM yang sesuai</li>
          <li><strong>7.</strong> Klik <strong>Upload</strong></li>
          <li><strong>8.</strong> Buka <strong>Serial Monitor</strong> (115200 baud) untuk melihat log</li>
        </ol>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-2">✅ Verifikasi Koneksi</h3>
        <p className="text-sm text-slate-700 mb-2">Output Serial Monitor yang benar:</p>
        <pre className="bg-slate-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
WiFi Connected!<br/>
IP Address: 192.168.x.x<br/>
Connecting to MQTT Broker...<br/>
Connected!<br/>
Subscribed device-specific MQTT topics.<br/>
Real Sensor System Ready!
        </pre>
      </div>
    </div>
  );
}

function MQTTSection() {
  const t = useT();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-purple-600 text-2xl">cloud</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('guide.mqttConfig.title')}</h2>
          <p className="text-sm text-slate-500">{t('guide.mqttConfig.subtitle')}</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-3">🌐 MQTT Broker (Mosquitto)</h3>
        <table className="w-full text-sm">
          <tr><td className="font-semibold py-1">Host:</td><td><code className="bg-slate-200 px-2 py-1 rounded">3.25.72.124</code></td></tr>
          <tr><td className="font-semibold py-1">Port:</td><td><code className="bg-slate-200 px-2 py-1 rounded">1883</code> (non-SSL)</td></tr>
          <tr><td className="font-semibold py-1">Username:</td><td><code className="bg-slate-200 px-2 py-1 rounded">jti</code></td></tr>
          <tr><td className="font-semibold py-1">Password:</td><td><code className="bg-slate-200 px-2 py-1 rounded">Azure-password123</code></td></tr>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-3">📡 MQTT Topics</h3>
        <table className="w-full text-xs">
          <tr className="border-b border-blue-200">
            <td className="font-semibold py-2">Topic</td>
            <td className="font-semibold py-2">Deskripsi</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2"><code className="bg-slate-200 px-1 rounded">traffic/+/data</code></td>
            <td className="py-2">Telemetry dari semua ESP32</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2"><code className="bg-slate-200 px-1 rounded text-xs">traffic/&lt;device_id&gt;/data</code></td>
            <td className="py-2">Telemetry dari device spesifik</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2"><code className="bg-slate-200 px-1 rounded text-xs">traffic/&lt;device_id&gt;/config/set</code></td>
            <td className="py-2">Send config ke device</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2"><code className="bg-slate-200 px-1 rounded text-xs">traffic/&lt;device_id&gt;/light/&lt;lane&gt;/set</code></td>
            <td className="py-2">Manual control lampu</td>
          </tr>
        </table>
      </div>

      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-3">🗄️ AWS DynamoDB Tables</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-bold text-teal-600">•</span>
            <div>
              <code className="bg-slate-200 px-1 rounded text-xs">TrafficTelemetry</code> - Menyimpan semua data sensor real-time
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-teal-600">•</span>
            <div>
              <code className="bg-slate-200 px-1 rounded text-xs">DeviceStatus</code> - Status online/offline device
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-teal-600">•</span>
            <div>
              <code className="bg-slate-200 px-1 rounded text-xs">Notifications</code> - Notifikasi sistem
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-teal-600">•</span>
            <div>
              <code className="bg-slate-200 px-1 rounded text-xs">Users</code> - Data pengguna dan kredensial
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TroubleshootingSection() {
  const t = useT();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-red-600 text-2xl">build</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('guide.troubleshootingGuide.title')}</h2>
          <p className="text-sm text-slate-500">{t('guide.troubleshootingGuide.subtitle')}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
          <h3 className="font-bold text-slate-900 mb-2">❌ Dashboard: MQTT Disconnected</h3>
          <p className="text-sm text-slate-700 mb-2"><strong>Penyebab:</strong></p>
          <ul className="text-xs space-y-1 text-slate-600 mb-2">
            <li>• MQTT Broker mati (EC2 down)</li>
            <li>• Kredensial salah di .env.local</li>
            <li>• Firewall block port 9001 (WebSocket)</li>
          </ul>
          <p className="text-sm text-slate-700 mb-2"><strong>Solusi:</strong></p>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>• Cek status EC2 di AWS Console</li>
            <li>• Pastikan <code className="bg-slate-200 px-1 rounded">MQTT_BROKER_URL=ws://3.25.72.124:9001</code></li>
            <li>• Klik tombol "Hubungkan Ulang"</li>
          </ul>
        </div>

        <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
          <h3 className="font-bold text-slate-900 mb-2">⚠️ ESP32: WiFi gagal connect</h3>
          <p className="text-sm text-slate-700 mb-2"><strong>Solusi:</strong></p>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>• Pastikan SSID dan password benar</li>
            <li>• ESP32 hanya support WiFi 2.4 GHz (bukan 5 GHz)</li>
            <li>• Jarak ESP32 ke router &lt; 10 meter</li>
            <li>• Reset ESP32: tekan tombol EN</li>
          </ul>
        </div>

        <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
          <h3 className="font-bold text-slate-900 mb-2">⚠️ Python Subscriber: AWS Error</h3>
          <p className="text-sm text-slate-700 mb-2"><strong>Penyebab:</strong> Kredensial AWS salah atau tidak ada permission</p>
          <p className="text-sm text-slate-700 mb-2"><strong>Solusi:</strong></p>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>• Cek <code className="bg-slate-200 px-1 rounded">AWS_ACCESS_KEY_ID</code> dan <code className="bg-slate-200 px-1 rounded">AWS_SECRET_ACCESS_KEY</code></li>
            <li>• Pastikan IAM User punya permission: <code className="bg-slate-200 px-1 rounded">dynamodb:PutItem, Query, Scan</code></li>
            <li>• Test koneksi: <code className="bg-slate-200 px-1 rounded">aws dynamodb list-tables</code></li>
          </ul>
        </div>

        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
          <h3 className="font-bold text-slate-900 mb-2">ℹ️ Data tidak muncul di Dashboard</h3>
          <p className="text-sm text-slate-700 mb-2"><strong>Checklist:</strong></p>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>✓ ESP32 connected ke WiFi? (cek Serial Monitor)</li>
            <li>✓ ESP32 connected ke MQTT? (log: "MQTT connected")</li>
            <li>✓ Python subscriber running? (<code className="bg-slate-200 px-1 rounded">python aws_subscriber.py</code>)</li>
            <li>✓ Data masuk DynamoDB? (cek AWS Console)</li>
            <li>✓ Dashboard connected ke MQTT? (status banner hijau)</li>
          </ul>
        </div>

        <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
          <h3 className="font-bold text-slate-900 mb-2">🔧 Sensor tidak berfungsi</h3>
          <p className="text-sm text-slate-700 mb-2"><strong>IR Sensor:</strong></p>
          <ul className="text-xs space-y-1 text-slate-600 mb-2">
            <li>• Cek wiring: VCC → 5V, GND → GND, OUT → GPIO</li>
            <li>• Test dengan tangan di depan sensor (LED harus menyala)</li>
            <li>• Jarak deteksi 2-30 cm</li>
          </ul>
          <p className="text-sm text-slate-700 mb-2"><strong>Ultrasonic HC-SR04:</strong></p>
          <ul className="text-xs space-y-1 text-slate-600">
            <li>• VCC → 5V, GND → GND, TRIG → GPIO, ECHO → GPIO</li>
            <li>• Jarak min 2cm, max 400cm</li>
            <li>• Pastikan tidak ada obstacle di depan sensor saat test</li>
          </ul>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-2">📞 Butuh Bantuan Lebih Lanjut?</h3>
        <p className="text-sm text-slate-700 mb-3">
          Jika masalah masih berlanjut, hubungi technical support:
        </p>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600">email</span>
            <span>support@example.com</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600">phone</span>
            <span>+62 812-3456-7890</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">description</span>
          Dokumentasi Lengkap
        </h3>
        <p className="text-sm text-slate-700 mb-3">
          Untuk panduan lebih detail, silakan baca file dokumentasi lengkap:
        </p>
        <div className="flex flex-wrap gap-2">
          <a href="/PANDUAN_PENGGUNAAN.md" target="_blank" className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition">
            <span className="material-symbols-outlined text-sm">description</span>
            PANDUAN_PENGGUNAAN.md
          </a>
          <a href="/PANDUAN_SINGKAT_PEMBELI.md" target="_blank" className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition">
            <span className="material-symbols-outlined text-sm">description</span>
            PANDUAN_SINGKAT_PEMBELI.md
          </a>
          <a href="/README.md" target="_blank" className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700 transition">
            <span className="material-symbols-outlined text-sm">description</span>
            README.md
          </a>
        </div>
      </div>
    </div>
  );
}
