#!/bin/bash

# Test API Connection
echo -e "\033[36mTesting API Connection...\033[0m"

# Test 1: Insert data
echo -e "\n\033[33m1. Inserting test data...\033[0m"
response=$(curl -s -X POST http://localhost:3000/api/traffic/realtime \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "lane-north",
    "lane": "north",
    "vehicleCount": 25,
    "speed": 45.5,
    "density": 0.7
  }')

if [ $? -eq 0 ]; then
  echo -e "\033[32m✅ Data inserted successfully!\033[0m"
  echo -e "\033[90mResponse: $response\033[0m"
else
  echo -e "\033[31m❌ Error inserting data\033[0m"
fi

# Test 2: Get data
echo -e "\n\033[33m2. Fetching data...\033[0m"
response=$(curl -s http://localhost:3000/api/traffic/realtime)

if [ $? -eq 0 ]; then
  echo -e "\033[32m✅ Data fetched successfully!\033[0m"
  echo -e "\033[90mResponse: $response\033[0m"
else
  echo -e "\033[31m❌ Error fetching data\033[0m"
fi

echo -e "\n\033[32m✅ Test complete!\033[0m"
