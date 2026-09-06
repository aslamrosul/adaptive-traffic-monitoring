#!/bin/bash
# status-all.sh — status Server 1 + Server 2 (idempoten, read-only)
echo "===== SERVER 1 ====="
systemctl is-active mosquitto traffic-aws-subscriber adaptive-traffic nginx
echo "===== SERVER 2 (via astraea-yolo) ====="
ssh astraea-yolo "systemctl is-active yolov8-ws yolov8-http yolov8-bridge" 2>&1
