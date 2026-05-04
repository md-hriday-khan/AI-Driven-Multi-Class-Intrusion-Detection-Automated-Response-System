#!/bin/bash

# CyberAuton SOC Backend Services Startup
# Created by Md.Hriday Khan

echo ""
echo "==============================================================================="
echo "                CYBERAUTON SOC - BACKEND SERVICES STARTUP"
echo "                       Created by Md.Hriday Khan"
echo "==============================================================================="
echo ""

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON=python3
elif command -v python &> /dev/null; then
    PYTHON=python
else
    echo "[ERROR] Python not found!"
    echo ""
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo "[OK] Python found: $($PYTHON --version)"
echo ""
echo "Starting backend services..."
echo ""

# Start Backend API
echo "[1/2] Starting Backend API on port 5000..."
$PYTHON backend_api_server.py &
BACKEND_PID=$!
sleep 3

# Start Vehicle Safety API
echo "[2/2] Starting Vehicle Safety API on port 5001..."
$PYTHON vehicle_safety_api.py &
VEHICLE_PID=$!
sleep 3

echo ""
echo "==============================================================================="
echo "                       SERVICES STARTED SUCCESSFULLY!"
echo "==============================================================================="
echo ""
echo "   Backend API:      http://localhost:5000/api/health"
echo "   Vehicle Safety:   http://localhost:5001/api/health"
echo ""
echo "   Frontend:         http://localhost:3000"
echo ""
echo "   Backend API PID:    $BACKEND_PID"
echo "   Vehicle Safety PID: $VEHICLE_PID"
echo ""
echo "   Note: WebSocket servers (optional) can be started manually:"
echo "   - node websocket-server/server.js"
echo "   - python enhanced_ids_dataset_integration.py"
echo ""
echo "==============================================================================="
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for interrupt
trap "kill $BACKEND_PID $VEHICLE_PID 2>/dev/null; echo ''; echo 'Services stopped'; exit" INT TERM

# Keep script running
wait