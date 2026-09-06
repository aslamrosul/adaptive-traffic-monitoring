#!/bin/bash
ssh astraea-yolo "sudo journalctl -u yolov8-ws -u yolov8-http -u yolov8-bridge -f --no-pager -n 50"
