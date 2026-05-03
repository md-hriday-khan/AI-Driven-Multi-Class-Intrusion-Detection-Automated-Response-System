# AI-Driven-Multi-Class-Intrusion-Detection-Automated-Response-System

## 🛡️ System Overview

CyberAuton SOC is a real-time AI-powered Security Operations Centre (SOC) designed to secure autonomous systems against cyber threats.

It combines ensemble machine learning (Random Forest, KNN) and deep learning (LSTM) to detect and classify multi-class network attacks and trigger automated responses in real time.



CyberAuton SOC is an enterprise-grade security operations platform featuring:

### 🚁 UAV Security Suite

- **MAVIDS**: Micro Air Vehicle Intrusion Detection System  
- **DroneSploit**: Open-source penetration testing framework for UAVs  
- **UAV-NIDD**: Network Intrusion Detection Dataset for real-time threat training  
- **UAV Collaborative IDS**: Multi-platform threat detection and sharing  
- **E-DIDS**: Exhaustive Distributed Intrusion Detection System (98.6% accuracy)

### 🚗 Vehicle Safety Systems

- **Emergency Control System**: Safe stop, pull over, and emergency stop functionality  
- **Real-time Vehicle Monitoring**: Live status tracking and threat assessment  
- **Automated Safety Responses**: AI-driven protective protocols

### 🤖 AI-Powered Security

- **LSTM Anomaly Detection**: Advanced machine learning threat identification  
- **Response Playbooks**: Automated incident response with GPS spoofing detection  
- **Self-Healing Systems**: Automated subsystem recovery mechanisms  
- **Threat Intelligence**: Real-time mapping and prioritization

### 🔧 Advanced Features

- **CIC-IDS Feature Extraction**: 83 network flow features for threat analysis  
- **MITRE ATT\&CK Framework**: Industry-standard attack pattern mapping  
- **Real-time Attack Visualization**: Live threat monitoring and analysis  
- **Comprehensive Audit Logging**: Complete security event tracking



## 🏆 System Capabilities

### Real-time Processing

- **Live Threat Detection**: Continuous monitoring  
- **Instant Response**: Sub-second reaction times  
- **Dynamic Adaptation**: Learning threat patterns  
- **Scalable Architecture**: Enterprise-ready deployment

### Multi-Domain Security

- **Air Domain**: UAV and drone protection  
- **Ground Domain**: Vehicle safety systems  
- **Network Domain**: Traffic analysis and protection  
- **Data Domain**: Privacy and integrity assurance

### Automation & Intelligence

- **AI-Powered Detection**: Machine learning algorithms  
- **Automated Response**: Threat mitigation workflows  
- **Predictive Analytics**: Proactive threat identification  
- **Continuous Learning**: Adaptive security posture


This README provides setup and running instructions for both the **Frontend** and **Backend** of the Artifact Autonomous project.

**Running the Frontend**

### **1\. Install Dependencies**

Run the following command to install all necessary packages:

Run \`npm i\`

### **2.Start the Development Server**

Launch the frontend development server with:

Run \`npm run dev\`

## **Running the Backend**

### **1\. Activate Virtual Environment**

If the virtual environment is not created yet, create and activate it:

Venv/scripts/activate

### **2\. Install Python Dependencies**

Install backend requirements using:

pip install \-r requirements.txt

### **3\. Start the Backend Server**

Run the backend API using Uvicorn:

uvicorn main:app \--reload

### 1.Prerequisites

- **Python 3.8+** with pip  
- **Node.js 16+** with npm  
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

**2.Access Application**

- Open: [http://localhost:3000](http://localhost:3000)  
  - Login: Use any credentials (demo mode)



## 🌐 System Architecture

### Backend Services

- **Main API Server** (port 5000): Core security data and analytics  
- **Vehicle Safety API** (port 5001): Emergency control and monitoring  
- **Real-time IDS Engine**: Continuous threat detection  
- **WebSocket Server**: Live data streaming

### Frontend Components

- **67+ Security Modules**: Comprehensive threat monitoring  
- **Real-time Dashboards**: Live threat visualization  
- **Interactive Controls**: Emergency response interfaces  
- **Export Capabilities**: PCAP, MITRE framework data

## 🎯 System Architecture

Frontend (React)         Backend Services

Port 3000               Port 5000, 5001, 8080, 8081

     │                          │

     ├─────── HTTP ────────────►│ Backend API (5000)

     │                          │ \- Threat intelligence

     │                          │ \- Network monitoring

     │                          │ \- MITRE framework

     │                          │

     ├─────── HTTP ────────────►│ Vehicle Safety (5001)

     │                          │ \- Emergency controls

     │                          │ \- System health

     │                          │

     ├────── WebSocket ────────►│ Main WS (8080) \[Optional\]

     │                          │ \- Real-time updates

     │                          │

     └────── WebSocket ────────►│ Enhanced IDS (8081) \[Optional\]

                                │ \- CIC-IDS features



## 📚 Documentation

### API Documentation

- **Main API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)  
- **Vehicle Safety**: [http://localhost:5001/api/health](http://localhost:5001/api/health)  
- **WebSocket Events**: Real-time data streaming  
- **Export Formats**: JSON, CSV, PCAP, Excel

### Security Standards

- **MITRE ATT\&CK**: Industry-standard attack patterns  
- **CIC-IDS**: Network flow feature extraction  
- **MAVLink Protocol**: UAV communication security  
- **ISO 27001**: Information security management


## 👨‍💻 Created By

**Md.Hriday Khan**  
Cybersecurity Researcher ,University of Bedfordshire


The CyberAuton Security Operations Centre is fully operational with all 67 security components, advanced UAV protection systems, vehicle emergency controls, and AI-powered threat detection capabilities.

**System Status**: ✅ **OPERATIONAL** **Last Updated**: 16 November 2025 **Version**: 1.0.0
