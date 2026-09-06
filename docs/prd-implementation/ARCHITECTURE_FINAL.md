# ARCHITECTURE_FINAL.md (PRD §5/80)

## Aliran produksi

```
ESP32-CAM (3/pendekatan) --WSS--> astraea-vision (Server 2)
  ingest:8082 /v1/camera/ingest --YOLO+ByteTrack--> metrik -> fuzzy 1 Hz
  --> MQTT astraea/v1/... (+ legacy traffic/ 5 dtk) --> Mosquitto (Server 1)
ESP32 controller --MQTT--> subscriber --> DynamoDB + S3 + notif
Next.js <--DynamoDB/S3, perintah MQTT--> ESP32 / kamera (registry)
```

## Keputusan final

- Camera = otoritas count; IR+US = level hunian sustained + fallback (§12-14).
- Fuzzy hanya rekomendasi durasi, di-clamp min/max; controller pemilik safety (§17/23).
- Fase: GREEN -> YELLOW -> ALL_RED -> next; plan berbasis data + conflict matrix (§19-23).
- Topik kanonis `astraea/v1/...`, legacy `traffic/` dipertahankan + dinormalisasi (§25-26).
- State vision per intersection (MI-04); rekomendasi per intersection (MI-05).
- Model: `yolov8s_indotraffic_best.pt` 22 MB, 6 kelas IndoTraffic (deviasi §31 didokumentasikan).
- Secret: repo PRIVATE, env ikut commit (override owner atas §55).
- Server 2 SSH hanya dari Server 1 (SG), alias `astraea-yolo`; IAM role minimal DynamoDB Cameras/Intersections.
