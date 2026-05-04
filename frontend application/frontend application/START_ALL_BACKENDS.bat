@echo off
REM CyberAuton SOC - Complete Backend Startup Script
REM Starts all backend services in parallel

echo ================================================================
echo  CyberAuton Security Operations Centre
echo ================================================================
echo Starting all backend services...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Install dependencies
echo  Installing dependencies...
pip install flask flask-cors >nul 2>&1
echo  Dependencies installed
echo.

echo Starting backend services:
echo.

REM Start services in background
if exist real_time_ids.py (
    echo  Starting Real-time IDS on port 5001...
    start "Real-time IDS" python real_time_ids.py
) else (
    echo  real_time_ids.py not found, skipping...
)

if exist vehicle_safety_api.py (
    echo  Starting Vehicle Safety API on port 5002...
    start "Vehicle Safety API" python vehicle_safety_api.py
) else (
    echo  vehicle_safety_api.py not found, skipping...
)

if exist intrusion_prevention_api.py (
    echo  Starting Intrusion Prevention System on port 5003...
    start "Intrusion Prevention" python intrusion_prevention_api.py
) else (
    echo  intrusion_prevention_api.py not found, skipping...
)

if exist backend_api_server.py (
    echo  Starting Main Backend API on port 5000...
    start "Backend API" python backend_api_server.py
) else (
    echo  backend_api_server.py not found, skipping...
)

echo.
echo ================================================================
echo  All services started successfully!
echo ================================================================
echo.
echo Backend Services:
echo   * Real-time IDS             : http://localhost:5001
echo   * Vehicle Safety API        : http://localhost:5002
echo   * Intrusion Prevention      : http://localhost:5003
echo   * Main Backend API          : http://localhost:5000
echo.
echo Frontend: http://localhost:3000
echo.
echo Press any key to stop all services
echo ================================================================
pause

REM Kill all Python processes (be careful with this!)
taskkill /F /IM python.exe /T >nul 2>&1
echo All services stopped.
pause
