#!/bin/bash
# health-all.sh — health endpoint semua komponen (exit 0 bila semua OK)
fail=0
chk() { if eval "$2" >/dev/null 2>&1; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi }
chk "web-login" "curl -sf -m 10 -o /dev/null https://astraea.my.id/login"
chk "web-api" "curl -sf -m 10 https://astraea.my.id/api/traffic/latest | grep -q success"
chk "mqtt-1883" "mosquitto_pub -h localhost -p 1883 -u jti -P 'Azure-password123' -t 'health/ping' -m ok"
chk "wss-cert" "echo | timeout 5 openssl s_client -connect localhost:8089 -servername astraea.my.id 2>/dev/null | openssl x509 -noout -checkend 0"
chk "dynamodb" "aws dynamodb list-tables --region ap-southeast-2 | grep -q TrafficTelemetry"
chk "yolo-ws" "ssh astraea-yolo 'systemctl is-active yolov8-ws' | grep -q active"
chk "yolo-http" "curl -sf -m 10 -o /dev/null http://172.31.2.242:8081/docs"
exit $fail
