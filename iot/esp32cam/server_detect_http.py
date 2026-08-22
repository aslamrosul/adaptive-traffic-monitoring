#!/usr/bin/env python3
"""
ASTRAEA YOLOv8 HTTP Detect Endpoint (JALUR B - headless ESP32-CAM)
Port 8081 — menerima POST multipart field "frame" (JPEG),
balas JSON deteksi. Jalankan berdampingan dengan server.py (WS, port 8080).

Install:
  source venv/bin/activate
  pip install fastapi uvicorn python-multipart

Run:
  uvicorn server_detect_http:app --host 0.0.0.0 --port 8081

Test dari laptop:
  curl -F "frame=@test.jpg" http://<EC2-IP>:8081/detect
"""

import time
import logging
from typing import List

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("astraea-detect")

MODEL_NAME = "yolov8n.pt"
CONFIDENCE = 0.5
VEHICLE_CLASSES = {2: "car", 5: "bus", 7: "truck", 3: "motorcycle", 1: "bicycle"}

model = YOLO(MODEL_NAME)
app = FastAPI(title="ASTRAEA Detect API")


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/detect")
async def detect(frame: UploadFile = File(...)):
    t0 = time.time()

    data = await frame.read()
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return {"error": "bukan JPEG valid"}

    h, w = img.shape[:2]
    results = model(img, conf=CONFIDENCE, verbose=False)

    detections: List[dict] = []
    stats = {
        "car": 0, "truck": 0, "bus": 0,
        "motorcycle": 0, "bicycle": 0,
        "totalVehicles": 0,
        "inferenceMs": round((time.time() - t0) * 1000, 1),
    }

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            if cls_id not in VEHICLE_CLASSES:
                continue
            label = VEHICLE_CLASSES[cls_id]
            conf = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            detections.append({
                "label": label,
                "confidence": round(conf, 3),
                # koordinat dinormalisasi 0-100 agar mudah digambar overlay
                "x": round(x1 / w * 100, 1),
                "y": round(y1 / h * 100, 1),
                "w": round((x2 - x1) / w * 100, 1),
                "h": round((y2 - y1) / h * 100, 1),
            })
            stats[label] += 1
            stats["totalVehicles"] += 1

    return {"detections": detections, "stats": stats}
