# ASTRAEA-CAM — Flash & Provision 3x ESP32-CAM

Firmware kanonis:

```text
iot/astraea-cam/
├── platformio.ini
├── README.md
└── src/
    └── main.cpp
```

> `src/main.cpp` adalah source of truth.  
> File lama di `iot/esp32cam/` hanya arsip dan jangan dipakai untuk deployment baru.

---

## Konsep

Semua ESP32-CAM memakai **firmware yang sama**.

Perbedaan antar kamera disimpan di NVS lewat provisioning:

- WiFi SSID
- WiFi password
- Camera ID
- Intersection ID
- Approach ID
- Device token
- Host vision
- Port
- TLS
- FPS
- JPEG quality

Jadi tidak perlu membuat 3 file firmware berbeda.

Target prototype:

| Kamera | Camera ID | Intersection | Approach |
|---|---|---|---|
| North | `CAM_TALUN_NORTH_01` | `SIMPANG_TALUN_01` | `north` |
| South | `CAM_TALUN_SOUTH_01` | `SIMPANG_TALUN_01` | `south` |
| East | `CAM_TALUN_EAST_01` | `SIMPANG_TALUN_01` | `east` |

Cloud endpoint default:

```text
wss://vision.astraea.my.id:443/v1/camera/ingest
```

---

# Kenapa token tidak di-hardcode?

Token **sengaja tidak ditulis langsung di `src/main.cpp`**.

Alasannya:

1. **Satu firmware untuk tiga kamera**  
   Jika token di-hardcode, tiap kamera butuh source/build berbeda.

2. **Token tidak masuk Git**  
   Repository boleh public/private berubah sewaktu-waktu. Token tidak boleh ikut commit.

3. **Token bisa di-rotate tanpa compile ulang**  
   Jika token bocor, cukup provision token baru ke NVS.

4. **Board dapat dipindah role**  
   Kamera North bisa di-reset lalu diprovision menjadi South tanpa edit source.

5. **Lebih aman untuk production/demo**  
   Source code berisi logic, NVS berisi secret/device-specific config.

### Rekomendasi

Gunakan:

```text
firmware sama
+
token unik per device
+
token disimpan di NVS
```

Jangan hardcode plaintext token ke Git.

---

# Token

Setiap kamera harus mempunyai token berbeda.

Contoh konsep:

```text
CAM_TALUN_NORTH_01 -> token North
CAM_TALUN_SOUTH_01 -> token South
CAM_TALUN_EAST_01  -> token East
```

Token plaintext:

- jangan ditulis di README,
- jangan ditulis di source,
- jangan di-commit,
- jangan dicetak di deployment report.

Ambil token baru dari registry/secret Server 2 sesuai mekanisme deployment ASTRAEA.

> Token yang pernah terpaste ke chat/log harus dianggap bocor dan di-rotate sebelum deployment final.

---

# Wiring Flash

Untuk AI Thinker ESP32-CAM menggunakan ESP32-CAM-MB atau USB-TTL.

## USB-TTL / FTDI

| USB-TTL | ESP32-CAM |
|---|---|
| 5V | 5V |
| GND | GND |
| TX | U0R |
| RX | U0T |

Saat flashing:

```text
GPIO0 -> GND
```

Setelah upload selesai:

```text
LEPAS GPIO0 -> GND
```

lalu tekan `RST`.

> Gunakan supply 5V yang stabil. Untuk penggunaan normal setelah provisioning, adaptor 5V 2A per kamera aman untuk memberikan headroom yang cukup.

---

# Build PlatformIO

Buka folder:

```text
iot/astraea-cam
```

di VS Code.

Build:

```bash
platformio run
```

Upload:

```bash
platformio run --target upload
```

Serial Monitor:

```bash
platformio device monitor --baud 115200
```

Jika menggunakan COM tertentu di Windows:

```powershell
& "C:\Users\ThinkPad T14\.platformio\penv\Scripts\platformio.exe" run

& "C:\Users\ThinkPad T14\.platformio\penv\Scripts\platformio.exe" run --target upload --upload-port COM8

& "C:\Users\ThinkPad T14\.platformio\penv\Scripts\platformio.exe" device monitor --port COM8 --baud 115200
```

Sesuaikan `COM8` dengan port board.

---

# Provisioning Pertama Kali

Setelah firmware berhasil di-upload:

1. Lepas jumper `GPIO0-GND`.
2. Tekan `RST`.
3. Buka Serial Monitor `115200`.
4. Karena device belum diprovision, firmware akan membuka SoftAP.

Contoh log:

```text
[BOOT] belum diprovision -> SoftAP

[PORTAL] provisioning aktif
[PORTAL] SSID: ASTRAEA-CAM-A1B2
[PORTAL] Password: ACxxxxxxxx
[PORTAL] URL: http://192.168.4.1
```

Hubungkan HP/laptop ke:

```text
ASTRAEA-CAM-xxxx
```

Gunakan password SoftAP yang ditampilkan di Serial Monitor.

Kemudian buka:

```text
http://192.168.4.1
```

---

# Isi Form Provisioning

## Kamera North

```text
WiFi SSID:
<SSID WiFi lokasi>

WiFi Password:
<password WiFi lokasi>

Vision Host:
vision.astraea.my.id

Port:
443

TLS:
1

Camera ID:
CAM_TALUN_NORTH_01

Intersection ID:
SIMPANG_TALUN_01

Approach ID:
north

Device Token:
<TOKEN NORTH BARU>

FPS:
3

JPEG Quality:
14
```

Klik:

```text
Save & Reboot
```

---

## Kamera South

Gunakan firmware yang sama.

Isi:

```text
Camera ID:
CAM_TALUN_SOUTH_01

Intersection ID:
SIMPANG_TALUN_01

Approach ID:
south

Device Token:
<TOKEN SOUTH BARU>
```

Field lain sama seperti North.

---

## Kamera East

Gunakan firmware yang sama.

Isi:

```text
Camera ID:
CAM_TALUN_EAST_01

Intersection ID:
SIMPANG_TALUN_01

Approach ID:
east

Device Token:
<TOKEN EAST BARU>
```

Field lain sama seperti North.

---

# Setelah Save

Konfigurasi disimpan ke NVS.

Alurnya:

```text
POWER ON
  ↓
load NVS
  ↓
connect WiFi
  ↓
sync NTP
  ↓
WSS TLS
  ↓
vision.astraea.my.id
  ↓
camera authentication
  ↓
send JPEG
  ↓
YOLO / tracking / stream
```

Contoh log normal:

```text
ASTRAEA-CAM v1.1 HARDENED

[CAM] PSRAM OK -> VGA
[CAM] READY 640x480 | ... bytes

[WiFi] CONNECTED
[WiFi] IP: 192.168.x.x
[WiFi] RSSI: -xx

[NTP] sync request

[WS] connect wss://vision.astraea.my.id:443/v1/camera/ingest
[WS] socket opened
[WS] AUTH OK / CLOUD UP

[STATUS] cam=CAM_TALUN_NORTH_01 ... cloud=UP frame=...
```

---

# Plug-and-Run

Setelah provisioning berhasil:

1. Cabut ESP32-CAM dari USB/programmer.
2. Hubungkan ke adaptor 5V.
3. Tidak perlu laptop.
4. Tidak perlu Husarnet.
5. Tidak perlu ngrok.
6. Tidak perlu port-forward router.
7. Kamera otomatis reconnect ke cloud.

Target:

```text
adaptor 5V
   ↓
ESP32-CAM
   ↓
WiFi
   ↓
WSS :443
   ↓
Server 2
   ↓
YOLO + Stream
```

---

# Jika WiFi Mati

Firmware yang sudah diprovision **tidak berhenti di SoftAP secara permanen**.

Expected:

```text
WiFi hilang
  ↓
STA retry terus
  ↓
offline lama
  ↓
maintenance SoftAP boleh muncul
  ↓
STA tetap retry
  ↓
router hidup
  ↓
WiFi reconnect
  ↓
SoftAP maintenance ditutup
  ↓
WSS reconnect
  ↓
stream kembali
```

Kamera harus dapat pulih tanpa USB, tanpa RST, dan tanpa interaksi manusia.

---

# Mengganti WiFi / Token / Identitas

Hubungkan kamera ke USB lalu buka Serial Monitor.

Ketik:

```text
portal
```

SoftAP provisioning akan aktif.

Buka:

```text
http://192.168.4.1
```

## Jika hanya ganti WiFi

Isi SSID/password baru.

Token boleh dikosongkan agar token lama tetap tersimpan.

## Jika hanya ganti token

Isi token baru.

Password WiFi boleh dikosongkan agar password lama tetap tersimpan.

## Jika ganti role kamera

Contoh North menjadi East:

```text
Camera ID:
CAM_TALUN_EAST_01

Approach ID:
east

Device Token:
<TOKEN EAST>
```

Save & Reboot.

---

# Serial Commands

Available commands:

```text
show
portal
reboot
factory-reset CONFIRM
```

## `show`

Menampilkan status dan konfigurasi non-secret.

Password WiFi dan token **tidak ditampilkan**.

## `portal`

Mengaktifkan maintenance provisioning portal.

## `reboot`

Restart device.

## `factory-reset CONFIRM`

Menghapus seluruh NVS config kamera lalu reboot.

Setelah reset, kamera kembali ke first-time provisioning.

---

# Status Kamera

Cek dari dashboard ASTRAEA atau endpoint Server 2.

Target camera states:

```text
ONLINE
STALE
OFFLINE
AUTH_FAILED
DEGRADED
```

Camera dianggap online jika:

- WSS terautentikasi,
- frame masih diterima dalam freshness timeout.

---

# Public / Global Stream

Jangan akses ESP32-CAM menggunakan local stream lama:

```text
http://192.168.x.x:81/stream
```

Firmware baru mengirim frame ke Server 2.

Browser/dashboard mengambil stream dari Server 2, misalnya endpoint:

```text
/v1/cameras/{camera_id}/status
/v1/cameras/{camera_id}/snapshot.jpg
/v1/cameras/{camera_id}/stream.mjpeg
```

Dengan desain ini:

```text
ESP32-CAM upload 1x
        ↓
Server 2
        ↓
fan-out ke banyak viewer
```

---

# Test Wajib Setelah Flash

Untuk setiap kamera:

- [ ] Build PlatformIO SUCCESS.
- [ ] Upload SUCCESS.
- [ ] GPIO0-GND dilepas.
- [ ] Camera init SUCCESS.
- [ ] PSRAM terdeteksi.
- [ ] SoftAP provisioning muncul saat belum configured.
- [ ] Config dapat disimpan.
- [ ] Device reboot.
- [ ] WiFi CONNECTED.
- [ ] NTP valid.
- [ ] WSS socket opened.
- [ ] `AUTH OK / CLOUD UP`.
- [ ] frame counter meningkat.
- [ ] camera status ONLINE di Server 2/dashboard.
- [ ] snapshot dapat dibuka dari Internet.
- [ ] global stream dapat dibuka.
- [ ] YOLO menerima frame.
- [ ] unplug USB -> adaptor only -> kamera kembali online.

---

# Test Outage Wajib

Setelah kamera ONLINE:

1. Matikan router/hotspot selama lebih dari 60 detik.
2. Jangan sentuh ESP32-CAM.
3. Hidupkan router kembali.
4. Pastikan kamera:
   - reconnect WiFi sendiri,
   - reconnect WSS sendiri,
   - kembali `CLOUD UP`,
   - frame kembali bertambah.

Jika membutuhkan RST/manual provisioning untuk outage biasa, test dianggap gagal.

---

# Catatan Security

- Jangan hardcode token produksi di `src/main.cpp`.
- Jangan commit `.env` production.
- Jangan menyimpan token plaintext di README.
- Gunakan token berbeda untuk setiap camera.
- Rotate token bila pernah terekspos.
- Gunakan TLS (`443`, `TLS=1`) untuk production.
- WSS harus tetap memverifikasi CA server.
- Jangan menggunakan `setInsecure()` untuk production.

---

# Source of Truth

Mulai versi baru:

```text
iot/astraea-cam/src/main.cpp
```

adalah firmware kamera kanonis.

Folder lama:

```text
iot/esp32cam/
```

hanya arsip / referensi historis.

Jangan deploy firmware dari folder lama.
