#!/bin/bash

# CyberAuton SOC - Complete Backend Startup Script
# Starts all backend services in parallel

echo "================================================================"
echo "🛡️  CyberAuton Security Operations Centre"
echo "================================================================"
echo "Starting all backend services..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip3 install flask flask-cors >/dev/null 2>&1
echo "✅ Dependencies installed"
echo ""

# Function to start a service
start_service() {
    local service_name=$1
    local service_file=$2
    local service_port=$3
    
    if [ -f "$service_file" ]; then
        echo "🚀 Starting $service_name on port $service_port..."
        python3 "$service_file" &
        echo "   PID: $!"
    else
        echo "⚠️  $service_file not found, skipping..."
    fi
}

# Start all backend services
echo "Starting backend services:"
echo ""

start_service "Real-time IDS" "real_time_ids.py" "5001"
start_service "Vehicle Safety API" "vehicle_safety_api.py" "5002"
start_service "Intrusion Prevention System" "intrusion_prevention_api.py" "5003"
start_service "Backend API Server" "backend_api_server.py" "5000"

echo ""
echo "================================================================"
echo "✅ All services started successfully!"
echo "================================================================"
echo ""
echo "Backend Services:"
echo "  • Real-time IDS             : http://localhost:5001"
echo "  • Vehicle Safety API        : http://localhost:5002"
echo "  • Intrusion Prevention      : http://localhost:5003"
echo "  • Main Backend API          : http://localhost:5000"
echo ""
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo "================================================================"

# Wait for Ctrl+C
wait
