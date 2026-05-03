# AI-Driven-Multi-Class-Intrusion-Detection-Automated-Response-System

## 🛡️ System Overview

CyberAuton SOC is a real-time AI-powered Security Operations Centre (SOC) designed to secure autonomous systems against cyber threats.

It combines ensemble machine learning (Random Forest, KNN) and deep learning (LSTM) to detect and classify multi-class network attacks and trigger automated responses in real time.



```
 ██████╗██╗   ██╗██████╗ ███████╗██████╗  █████╗ ██╗   ██╗████████╗ ██████╗ ███╗   ██╗
██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗████╗  ██║
██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝███████║██║   ██║   ██║   ██║   ██║██╔██╗ ██║
██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██╔══██║██║   ██║   ██║   ██║   ██║██║╚██╗██║
╚██████╗   ██║   ██████╔╝███████╗██║  ██║██║  ██║╚██████╔╝   ██║   ╚██████╔╝██║ ╚████║
 ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝ ╚═╝  ╚═══╝
                                        S O C
```



> **Enterprise-grade, real-time AI security platform** protecting autonomous systems (UAVs, vehicles, and networks) from multi-vector cyberattacks with sub-second detection and automated incident response.

</div>

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Threat Detection Engine](#threat-detection-engine)
- [Dataset & Model Performance](#dataset--model-performance)
- [Security Modules](#security-modules)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [API Reference](#api-reference)
- [Security Standards](#security-standards)
- [Author](#author)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CYBERAUTON SOC PLATFORM                         │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────┐      │
│   │              Frontend Dashboard  (Next.js :3000)         │      │
│   └────────┬──────────────┬──────────────────┬──────────────┘      │
│            │              │                  │                      │
│          HTTP           HTTP            WebSocket                   │
│            │              │                  │                      │
│   ┌────────▼──────┐ ┌─────▼──────┐  ┌───────▼────────┐            │
│   │ Threat Intel  │ │  Vehicle   │  │   Live IDS     │            │
│   │  API :5000    │ │  API :5001 │  │  Engine :8081  │            │
│   │               │ │            │  │                │            │
│   │ • MITRE Maps  │ │ • Safe Stop│  │ • ML Inference │            │
│   │ • IOC Feed    │ │ • Alerts   │  │ • LSTM Engine  │            │
│   │ • Playbooks   │ │ • Telemetry│  │ • Auto-Respond │            │
│   └───────────────┘ └────────────┘  └────────────────┘            │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────┐      │
│   │                  WS Broadcast Server :8080               │      │
│   │              Real-time event fan-out layer               │      │
│   └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Threat Detection Engine

CyberAuton SOC uses a **hybrid AI pipeline** combining classical ensemble learning with deep temporal modelling to achieve high-fidelity, low-latency threat classification.

### Detection Pipeline

```
Raw Network Flow
      │
      ▼
┌─────────────────┐
│  Feature Ext.   │  83 CIC-IDS features extracted per flow
│  (83 features)  │
└────────┬────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
┌─────────────────┐                  ┌──────────────────┐
│ Ensemble Models │                  │   LSTM Engine    │
│                 │                  │                  │
│  • RandomForest │                  │ Temporal Pattern │
│  • KNN          │                  │ Sequence Modelling│
│  • SVM          │                  │ Anomaly Scoring  │
│  • LogReg       │                  └────────┬─────────┘
│  • Naive Bayes  │                           │
└────────┬────────┘                           │
         └───────────────┬───────────────────┘
                         │
                         ▼
               ┌──────────────────┐
               │ Threat Classifier │
               │                  │
               │  BENIGN          │
               │  DDoS            │
               │  BOTNET          │
               │  BRUTEFORCE      │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │  Auto-Response   │  < 1 second
               │  Playbook Engine │
               └──────────────────┘
```

### Automated Response Actions

| Threat Class | Severity | Automated Response |
|---|---|---|
| **DDoS** | Critical | Rate limiting, traffic blackhole, upstream filter |
| **Botnet** | High | C2 channel isolation, lateral movement block |
| **Bruteforce** | Medium | IP block, account lockout, MFA enforcement |
| **Anomaly** | Variable | Alert escalation, flow capture, analyst notify |

---

## Dataset & Model Performance

### Dataset

| Attribute | Value |
|---|---|
| **Total Samples** | 412,000+ network flow records |
| **Feature Schema** | 83 CIC-IDS2017/2018 standard features |
| **Attack Classes** | Benign, DDoS, Botnet, Bruteforce |
| **Source Standard** | Canadian Institute for Cybersecurity (CIC) |

### Models Evaluated

| Model | Type | Notes |
|---|---|---|
| **Random Forest** | Ensemble | Primary production classifier |
| **LSTM** | Deep Learning | Temporal/sequential attack detection |
| **KNN** | Instance-Based | Baseline comparison |
| **SVM** | Kernel-Based | High-dimensional feature space |
| **Logistic Regression** | Linear | Interpretability benchmark |
| **Gaussian Naive Bayes** | Probabilistic | Lightweight fallback |

> **E-DIDS (Distributed IDS Node)** achieves **98.6% detection accuracy** in multi-node collaborative mode.

---

## Security Modules

### UAV / Drone Security Suite

```
┌─────────────────────────────────────────┐
│          UAV SECURITY SUITE             │
│                                         │
│  ┌─────────────┐   ┌─────────────────┐  │
│  │   MAVIDS    │   │  DroneSploit    │  │
│  │  Micro-AV   │   │  Pen-Testing    │  │
│  │  IDS Engine │   │  Framework      │  │
│  └─────────────┘   └─────────────────┘  │
│                                         │
│  ┌─────────────┐   ┌─────────────────┐  │
│  │  UAV-NIDD   │   │  Collaborative  │  │
│  │  Dataset    │   │  IDS Multi-Node │  │
│  │  Integration│   │  Detection      │  │
│  └─────────────┘   └─────────────────┘  │
│                                         │
│  ✓ MAVLink Protocol Security            │
│  ✓ GPS Spoofing Detection               │
│  ✓ Communication Integrity Checks       │
└─────────────────────────────────────────┘
```

### Vehicle Safety System

- **Emergency Control** — AI-triggered safe stop and pull-over sequences
- **Real-Time Telemetry** — Continuous vehicle state monitoring
- **Threat-Aware Response** — Coordinated safety action under cyber incident

### AI Security Intelligence

- Automated incident response with evidence preservation
- MITRE ATT&CK tactic and technique mapping (TTP correlation)
- Self-healing subsystem recovery after attack containment
- Predictive threat modelling via continuous learning pipeline

---

## Tech Stack

### Backend
```
Python 3.8+  │  FastAPI  │  Uvicorn (ASGI)  │  WebSockets
```

### Frontend
```
Next.js 14 (React)  │  Tailwind CSS  │  Real-time WebSocket Client
```

### Machine Learning
```
Scikit-learn  │  TensorFlow / Keras  │  NumPy / Pandas
```

### Export & Audit
```
JSON  │  CSV  │  PCAP  │  Excel  │  Full Audit Logging
```

---

## Installation

### Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.8+ |
| Node.js | 16+ |
| Browser | Any modern (Chrome / Firefox / Edge) |

### Backend

```bash
# Clone the repository
git clone https://github.com/your-username/cyberauton-soc.git
cd cyberauton-soc

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the main API server
uvicorn main:app --reload --port 5000

# Start the vehicle safety API (separate terminal)
uvicorn vehicle:app --reload --port 5001

# Start the WebSocket IDS engine (separate terminal)
python ids_engine.py
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access Points

| Service | URL |
|---|---|
| **Dashboard** | http://localhost:3000 |
| **Threat Intel API** | http://localhost:5000/api/health |
| **Vehicle Safety API** | http://localhost:5001/api/health |
| **Live IDS WebSocket** | ws://localhost:8081 |
| **Broadcast WebSocket** | ws://localhost:8080 |

---

## API Reference

### Threat Intelligence API — `:5000`

```http
GET  /api/health               # System health check
GET  /api/threats              # Active threat feed
POST /api/analyse              # Submit flow for classification
GET  /api/mitre/{technique_id} # Lookup MITRE ATT&CK mapping
GET  /api/playbook/{threat}    # Retrieve response playbook
```

### Vehicle Safety API — `:5001`

```http
GET  /api/health               # Vehicle system status
POST /api/emergency/stop       # Trigger safe-stop sequence
GET  /api/telemetry            # Live vehicle telemetry
POST /api/alert                # Raise safety alert
```

### WebSocket Streams

```
ws://localhost:8080  →  Live threat event broadcast
ws://localhost:8081  →  Real-time IDS classification stream
```

---

## Security Standards

| Standard | Application |
|---|---|
| **MITRE ATT&CK** | TTP mapping, detection coverage, threat hunting |
| **CIC-IDS Feature Schema** | Standardised 83-feature network flow extraction |
| **MAVLink Protocol Security** | UAV communication integrity and authentication |
| **ISO 27001 Principles** | Security management, audit logging, incident response |

---

## Platform Capabilities Summary

| Domain | Capability |
|---|---|
| **Air** | UAV intrusion detection, MAVLink security, GPS spoofing defence |
| **Ground** | Vehicle safety control, telemetry monitoring, AI-driven response |
| **Network** | Multi-class traffic classification, DDoS/Botnet/Bruteforce detection |
| **Data** | Integrity monitoring, audit trails, export and forensic capture |
| **Response** | Sub-second automated mitigation, self-healing, continuous learning |

---

## Project Status

| Attribute | Detail |
|---|---|
| **Status** | ✅ Fully Operational |
| **Active Modules** | 67+ security components |
| **Version** | 1.0.5 |
| **Last Updated** | November 2025 |
| **Institution** | University of Bedfordshire |

---

Author
Md. Hriday Khan
Cybersecurity Researcher · University of Bedfordshire

Specialising in AI-driven threat detection, autonomous system security, and enterprise SOC engineering.
https://www.linkedin.com/in/md-hriday-khan/
email:md.khan@fedex.com


Built to demonstrate real-world SOC engineering — from ML model design to production-ready autonomous system protection.
</div>
