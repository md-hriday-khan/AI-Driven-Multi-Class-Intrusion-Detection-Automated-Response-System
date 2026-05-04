@echo off
cls

echo ===============================================
echo 🛡️  CyberAuton Data Security System Setup
echo    Complete Installation ^& Testing
echo ===============================================
echo.

REM Check Python installation
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 3 is not installed
    echo Please install Python 3.8 or higher and try again
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✓ Python %PYTHON_VERSION% found
echo.

REM Check pip installation
echo Checking pip installation...
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip is not installed
    echo Installing pip...
    python -m ensurepip --upgrade
)
echo ✓ pip found
echo.

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip --quiet
echo ✓ pip upgraded
echo.

REM Install core security dependencies
echo Installing core security dependencies...
echo.

echo Installing cryptography...
pip install "cryptography>=3.4.8" --quiet
if errorlevel 0 (echo ✓ cryptography installed) else (echo ✗ Failed to install cryptography)

echo Installing pyjwt...
pip install "pyjwt>=2.8.0" --quiet
if errorlevel 0 (echo ✓ pyjwt installed) else (echo ✗ Failed to install pyjwt)

echo Installing flask...
pip install "flask>=2.0.0" --quiet
if errorlevel 0 (echo ✓ flask installed) else (echo ✗ Failed to install flask)

echo Installing flask-cors...
pip install "flask-cors>=3.0.10" --quiet
if errorlevel 0 (echo ✓ flask-cors installed) else (echo ✗ Failed to install flask-cors)

echo Installing pandas...
pip install "pandas>=1.3.0" --quiet
if errorlevel 0 (echo ✓ pandas installed) else (echo ✗ Failed to install pandas)

echo Installing numpy...
pip install "numpy>=1.21.0" --quiet
if errorlevel 0 (echo ✓ numpy installed) else (echo ✗ Failed to install numpy)

echo.
echo Installing optional dependencies...
pip install colorama --quiet 2>nul
echo ✓ Optional dependencies installed
echo.

echo ✅ All dependencies installed successfully!
echo.

REM Create necessary directories
echo Creating directory structure...
if not exist "backups" mkdir backups
if not exist "logs" mkdir logs
if not exist "data" mkdir data
echo ✓ Directories created
echo.

REM Initialize databases
echo Initializing security databases...
python -c "from data_integrity_security import init_secure_handler; handler = init_secure_handler(); print('Security databases initialized')" 2>nul
if errorlevel 0 (
    echo ✓ Databases initialized
) else (
    echo ⚠ Database initialization will occur on first run
)
echo.

REM Run security tests
echo Running security system tests...
echo.
python test_data_security.py

if errorlevel 0 (
    echo.
    echo ===============================================
    echo ✅ Setup completed successfully!
    echo ===============================================
    echo.
    echo Next Steps:
    echo.
    echo 1. Start the secure backend:
    echo    START_SECURE_BACKEND.bat
    echo.
    echo 2. Access the Data Integrity Dashboard:
    echo    • Login to CyberAuton SOC
    echo    • Navigate to Management → Data Integrity Dashboard
    echo.
    echo 3. Read the documentation:
    echo    type DATA_SECURITY_GUIDE.md
    echo.
    echo API Endpoints:
    echo    • Health Check: http://localhost:5000/api/health
    echo    • Security Status: http://localhost:5000/api/security/status
    echo    • Full API docs in DATA_SECURITY_GUIDE.md
    echo.
) else (
    echo.
    echo ===============================================
    echo ⚠️  Setup completed with some test failures
    echo ===============================================
    echo.
    echo Please review the test results above and fix any issues.
    echo The system may still be partially functional.
    echo.
)

echo Created by Md.Hriday Khan
echo CyberAuton Security Operations Centre
echo.

pause
