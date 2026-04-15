@echo off
echo Testing API Connection...
echo.

echo 1. Inserting test data...
curl -X POST http://localhost:3000/api/traffic/realtime ^
  -H "Content-Type: application/json" ^
  -d "{\"deviceId\":\"lane-north\",\"lane\":\"north\",\"vehicleCount\":25,\"speed\":45.5,\"density\":0.7}"

echo.
echo.
echo 2. Fetching data...
curl http://localhost:3000/api/traffic/realtime

echo.
echo.
echo Test complete!
pause
