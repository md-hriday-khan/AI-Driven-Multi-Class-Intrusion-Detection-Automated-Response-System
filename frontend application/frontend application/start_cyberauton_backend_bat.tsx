@echo off
title CyberAuton SOC - Backend Services
color 0A
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    CYBERAUTON SOC - BACKEND STARTUP                         ║
echo ║                           Created by Md.Hriday Khan                         ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo 🔧 Starting CyberAuton SOC Backend Services...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

REM Run the complete backend fix
echo 🚀 Running complete backend fix and startup...
python COMPLETE_BACKEND_FIX.py

if errorlevel 1 (
    echo.
    echo ❌ Backend startup failed. Check the logs above.
    echo.
    echo 💡 Common solutions:
    echo    • Ensure no other services are using ports 5000, 5001, 8080, 8081
    echo    • Install required dependencies: pip install flask flask-cors pandas numpy
    echo    • For WebSocket server: Install Node.js from nodejs.org
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Backend services are running!
echo 🌐 Access the frontend at: http://localhost:3000
echo.
pause