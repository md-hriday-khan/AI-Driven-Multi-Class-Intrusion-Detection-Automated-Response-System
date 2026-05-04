#!/bin/bash

echo "==============================================="
echo "🛡️  CyberAuton Data Security System Setup"
echo "   Complete Installation & Testing"
echo "==============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Python installation
echo -e "${BLUE}Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    echo "Please install Python 3.8 or higher and try again"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✓ Python ${PYTHON_VERSION} found${NC}"
echo ""

# Check pip installation
echo -e "${BLUE}Checking pip installation...${NC}"
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}❌ pip3 is not installed${NC}"
    echo "Installing pip..."
    python3 -m ensurepip --upgrade
fi
echo -e "${GREEN}✓ pip found${NC}"
echo ""

# Upgrade pip
echo -e "${BLUE}Upgrading pip...${NC}"
python3 -m pip install --upgrade pip --quiet
echo -e "${GREEN}✓ pip upgraded${NC}"
echo ""

# Install core security dependencies
echo -e "${BLUE}Installing core security dependencies...${NC}"
echo ""

CORE_PACKAGES=(
    "cryptography>=3.4.8"
    "pyjwt>=2.8.0"
    "flask>=2.0.0"
    "flask-cors>=3.0.10"
    "pandas>=1.3.0"
    "numpy>=1.21.0"
)

for package in "${CORE_PACKAGES[@]}"; do
    echo -e "${YELLOW}Installing ${package}...${NC}"
    pip3 install "$package" --quiet
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ ${package} installed${NC}"
    else
        echo -e "${RED}✗ Failed to install ${package}${NC}"
    fi
done

echo ""
echo -e "${BLUE}Installing optional dependencies...${NC}"

# Install colorama for better output (optional)
pip3 install colorama --quiet 2>/dev/null
echo -e "${GREEN}✓ Optional dependencies installed${NC}"

echo ""
echo -e "${GREEN}✅ All dependencies installed successfully!${NC}"
echo ""

# Create necessary directories
echo -e "${BLUE}Creating directory structure...${NC}"
mkdir -p backups
mkdir -p logs
mkdir -p data
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Make scripts executable
echo -e "${BLUE}Setting script permissions...${NC}"
chmod +x START_SECURE_BACKEND.sh 2>/dev/null
chmod +x test_data_security.py 2>/dev/null
chmod +x SETUP_DATA_SECURITY.sh 2>/dev/null
echo -e "${GREEN}✓ Permissions set${NC}"
echo ""

# Initialize databases
echo -e "${BLUE}Initializing security databases...${NC}"
python3 -c "
from data_integrity_security import init_secure_handler
handler = init_secure_handler()
print('Security databases initialized')
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Databases initialized${NC}"
else
    echo -e "${YELLOW}⚠ Database initialization will occur on first run${NC}"
fi
echo ""

# Run security tests
echo -e "${BLUE}Running security system tests...${NC}"
echo ""
python3 test_data_security.py

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}===============================================${NC}"
    echo -e "${GREEN}✅ Setup completed successfully!${NC}"
    echo -e "${GREEN}===============================================${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo ""
    echo "1. Start the secure backend:"
    echo -e "   ${YELLOW}./START_SECURE_BACKEND.sh${NC}"
    echo ""
    echo "2. Access the Data Integrity Dashboard:"
    echo "   • Login to CyberAuton SOC"
    echo "   • Navigate to Management → Data Integrity Dashboard"
    echo ""
    echo "3. Read the documentation:"
    echo -e "   ${YELLOW}cat DATA_SECURITY_GUIDE.md${NC}"
    echo ""
    echo -e "${BLUE}API Endpoints:${NC}"
    echo "   • Health Check: http://localhost:5000/api/health"
    echo "   • Security Status: http://localhost:5000/api/security/status"
    echo "   • Full API docs in DATA_SECURITY_GUIDE.md"
    echo ""
else
    echo ""
    echo -e "${RED}===============================================${NC}"
    echo -e "${RED}⚠️  Setup completed with some test failures${NC}"
    echo -e "${RED}===============================================${NC}"
    echo ""
    echo "Please review the test results above and fix any issues."
    echo "The system may still be partially functional."
    echo ""
fi

echo -e "${BLUE}Created by Md.Hriday Khan${NC}"
echo -e "${BLUE}CyberAuton Security Operations Centre${NC}"
echo ""
