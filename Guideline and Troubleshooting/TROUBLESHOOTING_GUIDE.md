# CyberAuton SOC \- Complete Troubleshooting Guide

**Created by Md.Hriday Khan**

## 🚀 Quick Start (Terminal)

### Option 1: Complete Automated Launch

\# Make executable and run everything

chmod \+x run\_cyberauton\_soc.py

python3 run\_cyberauton\_soc.py

### Option 2: Manual Component Testing

\# Test backend API

python3 backend\_api\_server.py

\# Test real-time IDS

python3 real\_time\_ids.py

\# Test frontend (if Node.js available)

npm install

npm start

## 🔧 Component Verification

### Check All Components Load

1. **Open browser**: [http://localhost:3000](http://localhost:3000)  
2. **Navigate through all sections**:  
   - Security Overview ✅  
   - Advanced Security Artifact ✅  
   - Advanced Security Car ✅  
   - UAV Collaborative IDS ✅  
   - E-DIDS Distributed System ✅  
   - Audit Logs & File Info ✅

### Verify Backend Services

\# Check API health

curl http://localhost:5000/api/health

\# Check UAV service

curl http://localhost:5001/api/uav/health

\# Check E-DIDS service

curl http://localhost:5002/api/edids/health

## 🐛 Common Issues & Solutions

### 1\. Port Already in Use

**Error**: `Address already in use` **Solution**:

\# Kill processes on ports

sudo lsof \-ti:3000 | xargs kill \-9

sudo lsof \-ti:5000 | xargs kill \-9

sudo lsof \-ti:8080 | xargs kill \-9

\# Or use different ports

PORT=3001 npm start

### 2\. Python Dependencies Missing

**Error**: `ModuleNotFoundError` **Solution**:

\# Install comprehensive dependencies

pip3 install flask flask-cors numpy pandas scikit-learn

pip3 install requests websockets sqlite3

pip3 install \-r requirements.txt

### 3\. Node.js/npm Not Available

**Error**: `command not found: npm` **Solution**:

\# Install Node.js (Ubuntu/Debian)

curl \-fsSL https://deb.nodesource.com/setup\_18.x | sudo \-E bash \-

sudo apt-get install \-y nodejs

\# Install Node.js (macOS)

brew install node

\# Install Node.js (Windows)

\# Download from: https://nodejs.org/

### 4\. React App Won't Start

**Error**: Various React startup issues **Solution**:

\# Clear cache and reinstall

rm \-rf node\_modules package-lock.json

npm install

npm start

\# Or use yarn

yarn install

yarn start

### 5\. WebSocket Connection Failed

**Error**: WebSocket connection errors **Solution**:

- The app automatically falls back to mock data  
- WebSocket is optional for demonstration  
- All functionality works without WebSocket server

### 6\. Components Not Loading

**Error**: Blank screens or component errors **Solution**:

\# Check console for errors

\# Open browser dev tools (F12)

\# Look for import/export errors

\# Common fixes:

\# 1\. Verify all component imports in App.tsx

\# 2\. Check component exports match imports

\# 3\. Ensure all UI components exist

## 🔍 Debugging Steps

### Step 1: Verify File Structure

\# Check all required files exist

ls \-la components/

ls \-la components/ui/

ls backend\_api\_server.py

ls real\_time\_ids.py

### Step 2: Test Individual Components

\# Test backend independently

python3 \-c "

import backend\_api\_server

print('Backend imports OK')

"

\# Test IDS engine independently  

python3 \-c "

import real\_time\_ids

print('IDS engine imports OK')

"

### Step 3: Browser Console Check

1. Open [http://localhost:3000](http://localhost:3000)  
2. Press F12 to open dev tools  
3. Check Console tab for errors  
4. Check Network tab for failed requests

### Step 4: Component-by-Component Testing

Navigate to each section and verify:

- ✅ Security Overview  
- ✅ Advanced Security Artifact  
- ✅ Advanced Security Car  
- ✅ UAV Collaborative IDS  
- ✅ E-DIDS Distributed System  
- ✅ All other components

## 🛠️ Manual Setup (If Automated Fails)

### Backend Setup

\# Terminal 1: Main API

python3 backend\_api\_server.py

\# Terminal 2: IDS Engine  

python3 real\_time\_ids.py

\# Terminal 3: WebSocket (optional)

cd websocket-server

node server.js

### Frontend Setup

\# Terminal 4: React App

npm install

npm start

### UAV Services (Optional)

\# Terminal 5: UAV Monitoring

python3 \-c "

from flask import Flask, jsonify

from flask\_cors import CORS

import random

app \= Flask(\_\_name\_\_)

CORS(app)

@app.route('/api/uav/status')

def status():

    return jsonify({'status': 'ok', 'uavs': random.randint(3,8)})

app.run(port=5001)

"

## 🧪 Testing Scenarios

### Test 1: Basic Functionality

1. Start backend: `python3 backend_api_server.py`  
2. Open browser: [http://localhost:3000](http://localhost:3000) (manually)  
3. Navigate through all components  
4. Verify no console errors

### Test 2: Export Functions

1. Go to MITRE ATT\&CK Framework  
2. Click "Export Matrix" \- should download files  
3. Go to Network Traffic Monitor  
4. Click "Export PCAP" \- should download data  
5. Test all export buttons

### Test 3: Real-time Updates

1. Navigate to different dashboards  
2. Observe live data updates  
3. Check WebSocket connection (optional)  
4. Verify mock data generation

### Test 4: Attack Simulation

1. Go to Attack Simulation  
2. Start different attack scenarios  
3. Verify progress tracking  
4. Check response logging

## 📊 Performance Optimization

### For Low-Resource Systems

\# Reduce Python process count

export FLASK\_ENV=production

\# Limit concurrent processes

python3 backend\_api\_server.py \--workers=1

\# Use lightweight mode

export CYBERAUTON\_LITE=true

### For High-Performance Systems

\# Enable all features

export CYBERAUTON\_FULL=true

\# Increase worker processes

python3 backend\_api\_server.py \--workers=4

\# Enable advanced analytics

export ENABLE\_ADVANCED\_ANALYTICS=true

## 🔒 Security Notes

- All data is mock/demo data for testing  
- No real network traffic is captured  
- All exports are safe sample data  
- No external connections required  
- Suitable for offline demonstration

## 📋 Complete Component Checklist

### Core Components ✅

- [x] ThreatMap  
- [x] RealTimeMetrics  
- [x] AttackSimulation (white background)  
- [x] AIMonitoring  
- [x] NetworkTrafficMonitor (PCAP export working)  
- [x] MitreAttackFramework (export working)

### Advanced Components ✅

- [x] AdvancedSecurityArtifact  
- [x] AdvancedSecurityCar (renamed from car component)  
- [x] UAVCollaborativeIDS (new)  
- [x] EDIDS (new distributed system)  
- [x] AuditLogsViewer (full file info)

### UI Components ✅

- [x] All components use white backgrounds  
- [x] Proper text contrast (gray-900)  
- [x] Professional styling  
- [x] Error-free rendering

### Backend Services ✅

- [x] backend\_api\_server.py (comprehensive)  
- [x] real\_time\_ids.py (83 CIC-IDS features)  
- [x] WebSocket server (with fallback)  
- [x] Export functionality (all working)

## 🎯 Success Criteria

**System is working correctly when**:

1. ✅ All components load without errors  
2. ✅ Export functions download files  
3. ✅ Real-time data updates visible  
4. ✅ Attack simulations work  
5. ✅ UAV and E-DIDS systems operational  
6. ✅ No console errors in browser  
7. ✅ All backend APIs respond  
8. ✅ White backgrounds throughout  
9. ✅ Professional appearance  
10. ✅ Comprehensive functionality

## 📞 Support

### Immediate Issues

1. Check browser console (F12)  
2. Verify all files present  
3. Test backend APIs individually  
4. Use automated launcher script

### Advanced Debugging

1. Enable verbose logging  
2. Check service status individually  
3. Test network connectivity  
4. Verify dependencies installed

---

**System created and tested by Md.Hriday Khan**

