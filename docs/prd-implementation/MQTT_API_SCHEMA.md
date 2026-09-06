# MQTT & API Schema (PRD §24/25/27, §10)

## MQTT kanonis (`astraea/v1/intersections/{iid}/...`)

- `controllers/{cid}/telemetry` — §27 (schema_version, mode, vision, approaches{light,
  camera_vehicle_count, camera_queue_count, sensor_level, ir/ultrasonic, green_duration_s},
  wifi_rssi, uptime_s, config_version)
- `controllers/{cid}/status`, `/command` (`set_phase|set_auto|set_config`), `/ack`
- `vision/metrics` — counts per pendekatan (1 Hz, persist sampled §74)
- `control/recommendation` — §24 (valid_for_ms 10000, approaches.recommended_green_s)
- `cameras/{cam}/status` — via HTTP, bukan MQTT

## Legacy (tetap)

`traffic/{device}/data`, `traffic/{device}/config/set`, `traffic/{device}/light/{lane}/set`.
Subscriber menormalisasi kanonis→pipeline lama; vision legacy `traffic/CAM_YOLO_{iid}/data` 5 dtk.

## HTTP Server 2 (:8081)

`GET /health`, `GET /v1/cameras/{id}/status|snapshot.jpg|stream.mjpeg`,
`GET /v1/control/recommendation/{iid}`, `POST /detect` (kompatibel firmware lama).
Viewer butuh `Authorization: Bearer $VISION_VIEWER_TOKEN` bila diset.

## HTTP Server 1 (baru)

`GET/POST /api/cameras` (POST admin; token tampil sekali, simpan hash saja).
PUT `/api/intersections/{id}` menerima `pedestrian_crossings[]` + field bebas lain (merge).
