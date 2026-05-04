#!/usr/bin/env python3
"""
Installation Script for SHIELD SOC AI Monitoring & Observability Framework
Installs and configures all AI monitoring components
"""

import os
import sys
import subprocess
import sqlite3
import json
import time
import logging
from pathlib import Path

def setup_logging():
    """Setup logging for the installation process"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('ai_monitoring_install.log'),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger('AI_Monitoring_Installer')

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        raise RuntimeError("Python 3.8 or higher is required")
    
    print(f"✓ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro} detected")

def install_python_dependencies():
    """Install required Python packages"""
    print("\n📦 Installing Python dependencies...")
    
    requirements = [
        'numpy>=1.21.0',
        'pandas>=1.3.0',
        'scikit-learn>=1.0.0',
        'tensorflow>=2.8.0',
        'matplotlib>=3.5.0',
        'seaborn>=0.11.0',
        'shap>=0.40.0',
        'lime>=0.2.0',
        'psutil>=5.8.0',
        'websocket-client>=1.0.0',
        'scipy>=1.7.0',
        'joblib>=1.1.0'
    ]
    
    for requirement in requirements:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', requirement])
            print(f"✓ Installed {requirement}")
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to install {requirement}: {e}")
            raise

def create_directory_structure():
    """Create necessary directories"""
    print("\n📁 Creating directory structure...")
    
    directories = [
        'data',
        'models',
        'logs',
        'config',
        'temp',
        'notebooks',
        'scripts'
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✓ Created directory: {directory}")

def initialize_databases():
    """Initialize SQLite databases for AI monitoring"""
    print("\n🗃️ Initializing databases...")
    
    databases = {
        'data/ai_monitoring.db': [
            '''CREATE TABLE IF NOT EXISTS monitoring_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                accuracy REAL,
                precision_score REAL,
                recall_score REAL,
                f1_score REAL,
                avg_confidence REAL,
                avg_latency REAL,
                cpu_usage REAL,
                memory_usage REAL,
                drift_severity TEXT,
                alert_level TEXT
            )''',
            '''CREATE TABLE IF NOT EXISTS drift_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                alert_type TEXT,
                severity TEXT,
                message TEXT,
                affected_features TEXT,
                drift_magnitude REAL,
                recommended_action TEXT
            )'''
        ],
        'data/adaptive_learning.db': [
            '''CREATE TABLE IF NOT EXISTS learning_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                model_version TEXT,
                samples_processed INTEGER,
                active_learning_queries INTEGER,
                model_updates INTEGER,
                performance_improvement REAL,
                uncertainty_reduction REAL,
                feedback_accuracy REAL
            )''',
            '''CREATE TABLE IF NOT EXISTS uncertain_samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sample_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                features TEXT,
                prediction INTEGER,
                confidence REAL,
                uncertainty_score REAL,
                human_label INTEGER,
                status TEXT
            )'''
        ],
        'data/xai_explanations.db': [
            '''CREATE TABLE IF NOT EXISTS explanations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sample_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                prediction INTEGER,
                confidence REAL,
                attack_type TEXT,
                explanation_method TEXT,
                feature_explanations TEXT,
                decision_rationale TEXT,
                model_version TEXT
            )''',
            '''CREATE TABLE IF NOT EXISTS calibration_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                confidence REAL,
                prediction INTEGER,
                true_label INTEGER,
                calibration_error REAL
            )'''
        ],
        'data/ai_anomaly_detection.db': [
            '''CREATE TABLE IF NOT EXISTS system_anomalies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                anomaly_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                anomaly_type TEXT,
                severity TEXT,
                description TEXT,
                affected_components TEXT,
                root_cause TEXT,
                mitigation_applied BOOLEAN,
                resolution_status TEXT
            )''',
            '''CREATE TABLE IF NOT EXISTS security_threats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                threat_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                threat_type TEXT,
                severity TEXT,
                source TEXT,
                target_component TEXT,
                confidence REAL,
                mitigation_status TEXT
            )''',
            '''CREATE TABLE IF NOT EXISTS system_health (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                cpu_usage REAL,
                memory_usage REAL,
                gpu_usage REAL,
                prediction_throughput REAL,
                error_rate REAL,
                health_score REAL
            )'''
        ]
    }
    
    for db_path, tables in databases.items():
        try:
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                for table_sql in tables:
                    cursor.execute(table_sql)
                conn.commit()
            print(f"✓ Initialized database: {db_path}")
        except Exception as e:
            print(f"✗ Failed to initialize {db_path}: {e}")
            raise

def create_configuration_files():
    """Create configuration files"""
    print("\n⚙️ Creating configuration files...")
    
    # AI Monitor configuration
    ai_monitor_config = {
        "monitoring": {
            "window_size": 1000,
            "drift_threshold": 0.1,
            "update_interval": 10,
            "websocket_url": "ws://localhost:8080"
        },
        "alerting": {
            "accuracy_threshold": 0.8,
            "latency_threshold": 0.1,
            "confidence_threshold": 0.6,
            "email_notifications": False,
            "webhook_url": None
        },
        "storage": {
            "database_path": "./data/ai_monitoring.db",
            "log_level": "INFO",
            "retention_days": 30
        }
    }
    
    with open('config/ai_monitor_config.json', 'w') as f:
        json.dump(ai_monitor_config, f, indent=2)
    print("✓ Created ai_monitor_config.json")
    
    # Adaptive Learning configuration
    adaptive_config = {
        "learning": {
            "uncertainty_threshold": 0.3,
            "update_threshold": 100,
            "max_queue_size": 1000,
            "ensemble_models": ["lstm_deep", "lstm_bidirectional"]
        },
        "active_learning": {
            "sampling_strategy": "uncertainty",
            "query_budget": 1000,
            "feedback_timeout": 86400
        },
        "model_management": {
            "model_directory": "./models",
            "version_control": True,
            "auto_backup": True,
            "rollback_enabled": True
        }
    }
    
    with open('config/adaptive_learning_config.json', 'w') as f:
        json.dump(adaptive_config, f, indent=2)
    print("✓ Created adaptive_learning_config.json")
    
    # XAI configuration
    xai_config = {
        "explainers": {
            "shap_enabled": True,
            "lime_enabled": True,
            "background_samples": 100,
            "explanation_timeout": 30
        },
        "calibration": {
            "calibration_bins": 10,
            "min_samples": 100,
            "recalibration_frequency": "daily"
        },
        "visualization": {
            "save_plots": True,
            "plot_directory": "./temp",
            "plot_format": "png",
            "plot_dpi": 300
        }
    }
    
    with open('config/xai_config.json', 'w') as f:
        json.dump(xai_config, f, indent=2)
    print("✓ Created xai_config.json")
    
    # AI Anomaly Detection configuration
    anomaly_config = {
        "detection": {
            "contamination": 0.1,
            "min_samples": 100,
            "detection_methods": ["isolation_forest", "statistical_threshold"],
            "auto_mitigation": True
        },
        "security": {
            "threat_detection": True,
            "ip_blocking": False,
            "rate_limiting": True,
            "alert_threshold": "medium"
        },
        "system_monitoring": {
            "resource_monitoring": True,
            "performance_tracking": True,
            "health_check_interval": 30
        }
    }
    
    with open('config/ai_anomaly_config.json', 'w') as f:
        json.dump(anomaly_config, f, indent=2)
    print("✓ Created ai_anomaly_config.json")

def create_startup_scripts():
    """Create startup scripts for AI monitoring components"""
    print("\n🚀 Creating startup scripts...")
    
    # Master startup script
    startup_script = '''#!/bin/bash
# SHIELD SOC AI Monitoring Startup Script

echo "Starting SHIELD SOC AI Monitoring & Observability Framework..."

# Create log directory
mkdir -p logs

# Start AI Monitor
echo "Starting AI Performance Monitor..."
python ai_monitor.py --duration 0 > logs/ai_monitor.log 2>&1 &
AI_MONITOR_PID=$!
echo "AI Monitor started with PID: $AI_MONITOR_PID"

# Start Adaptive Learning System
echo "Starting Adaptive Learning System..."
python adaptive_learner.py --duration 0 > logs/adaptive_learner.log 2>&1 &
ADAPTIVE_PID=$!
echo "Adaptive Learning started with PID: $ADAPTIVE_PID"

# Start AI Anomaly Detector
echo "Starting AI Anomaly Detector..."
python ai_anomaly_detector.py --duration 0 > logs/ai_anomaly_detector.log 2>&1 &
ANOMALY_PID=$!
echo "AI Anomaly Detector started with PID: $ANOMALY_PID"

# Save PIDs for later shutdown
echo "$AI_MONITOR_PID" > logs/ai_monitor.pid
echo "$ADAPTIVE_PID" > logs/adaptive_learner.pid
echo "$ANOMALY_PID" > logs/ai_anomaly_detector.pid

echo "All AI monitoring components started successfully!"
echo "Logs are being written to the logs/ directory"
echo "To stop all services, run: ./scripts/stop_ai_monitoring.sh"
'''
    
    with open('scripts/start_ai_monitoring.sh', 'w') as f:
        f.write(startup_script)
    os.chmod('scripts/start_ai_monitoring.sh', 0o755)
    print("✓ Created start_ai_monitoring.sh")
    
    # Shutdown script
    shutdown_script = '''#!/bin/bash
# SHIELD SOC AI Monitoring Shutdown Script

echo "Stopping SHIELD SOC AI Monitoring components..."

# Stop AI Monitor
if [ -f logs/ai_monitor.pid ]; then
    PID=$(cat logs/ai_monitor.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "Stopped AI Monitor (PID: $PID)"
    fi
    rm -f logs/ai_monitor.pid
fi

# Stop Adaptive Learning
if [ -f logs/adaptive_learner.pid ]; then
    PID=$(cat logs/adaptive_learner.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "Stopped Adaptive Learning (PID: $PID)"
    fi
    rm -f logs/adaptive_learner.pid
fi

# Stop AI Anomaly Detector
if [ -f logs/ai_anomaly_detector.pid ]; then
    PID=$(cat logs/ai_anomaly_detector.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "Stopped AI Anomaly Detector (PID: $PID)"
    fi
    rm -f logs/ai_anomaly_detector.pid
fi

echo "All AI monitoring components stopped."
'''
    
    with open('scripts/stop_ai_monitoring.sh', 'w') as f:
        f.write(shutdown_script)
    os.chmod('scripts/stop_ai_monitoring.sh', 0o755)
    print("✓ Created stop_ai_monitoring.sh")
    
    # Status script
    status_script = '''#!/bin/bash
# SHIELD SOC AI Monitoring Status Script

echo "SHIELD SOC AI Monitoring Status:"
echo "================================"

# Check AI Monitor
if [ -f logs/ai_monitor.pid ]; then
    PID=$(cat logs/ai_monitor.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "✓ AI Monitor: Running (PID: $PID)"
    else
        echo "✗ AI Monitor: Stopped"
    fi
else
    echo "✗ AI Monitor: Not started"
fi

# Check Adaptive Learning
if [ -f logs/adaptive_learner.pid ]; then
    PID=$(cat logs/adaptive_learner.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "✓ Adaptive Learning: Running (PID: $PID)"
    else
        echo "✗ Adaptive Learning: Stopped"
    fi
else
    echo "✗ Adaptive Learning: Not started"
fi

# Check AI Anomaly Detector
if [ -f logs/ai_anomaly_detector.pid ]; then
    PID=$(cat logs/ai_anomaly_detector.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "✓ AI Anomaly Detector: Running (PID: $PID)"
    else
        echo "✗ AI Anomaly Detector: Stopped"
    fi
else
    echo "✗ AI Anomaly Detector: Not started"
fi

echo ""
echo "Recent log entries:"
echo "==================="
if [ -f logs/ai_monitor.log ]; then
    echo "AI Monitor (last 3 lines):"
    tail -3 logs/ai_monitor.log
    echo ""
fi

if [ -f logs/adaptive_learner.log ]; then
    echo "Adaptive Learning (last 3 lines):"
    tail -3 logs/adaptive_learner.log
    echo ""
fi

if [ -f logs/ai_anomaly_detector.log ]; then
    echo "AI Anomaly Detector (last 3 lines):"
    tail -3 logs/ai_anomaly_detector.log
fi
'''
    
    with open('scripts/status_ai_monitoring.sh', 'w') as f:
        f.write(status_script)
    os.chmod('scripts/status_ai_monitoring.sh', 0o755)
    print("✓ Created status_ai_monitoring.sh")

def create_demo_data():
    """Create sample data for demonstration"""
    print("\n📊 Creating demonstration data...")
    
    # Create sample training data
    import numpy as np
    
    # Generate synthetic CIC-IDS feature data
    np.random.seed(42)
    n_samples = 10000
    n_features = 20
    
    # Normal traffic
    normal_features = np.random.normal(0, 1, (n_samples // 2, n_features))
    normal_labels = np.zeros(n_samples // 2)
    
    # Attack traffic (with different distributions)
    attack_features = np.random.normal(2, 1.5, (n_samples // 2, n_features))
    attack_labels = np.ones(n_samples // 2)
    
    # Combine data
    X = np.vstack([normal_features, attack_features])
    y = np.concatenate([normal_labels, attack_labels])
    
    # Shuffle
    indices = np.random.permutation(len(X))
    X = X[indices]
    y = y[indices]
    
    # Save data
    np.save('data/sample_features.npy', X)
    np.save('data/sample_labels.npy', y)
    
    print(f"✓ Created sample dataset: {X.shape[0]} samples, {X.shape[1]} features")
    
    # Create feature names mapping
    feature_names = [
        'flow_duration', 'total_fwd_packets', 'total_bwd_packets',
        'packet_length_mean', 'packet_length_std', 'flow_bytes_s',
        'flow_packets_s', 'flow_iat_mean', 'fwd_header_length',
        'psh_flag_count', 'urg_flag_count', 'syn_flag_count',
        'ack_flag_count', 'down_up_ratio', 'average_packet_size',
        'fwd_packets_s', 'bwd_packets_s', 'active_mean',
        'idle_mean', 'packet_length_variance'
    ]
    
    with open('data/feature_names.json', 'w') as f:
        json.dump(feature_names, f, indent=2)
    print("✓ Created feature names mapping")

def run_integration_tests():
    """Run basic integration tests"""
    print("\n🧪 Running integration tests...")
    
    try:
        # Test AI Monitor
        import ai_monitor
        print("✓ AI Monitor module imports successfully")
        
        # Test Adaptive Learning
        import adaptive_learner
        print("✓ Adaptive Learning module imports successfully")
        
        # Test XAI Explainer
        import xai_explainer
        print("✓ XAI Explainer module imports successfully")
        
        # Test AI Anomaly Detector
        import ai_anomaly_detector
        print("✓ AI Anomaly Detector module imports successfully")
        
        # Test database connections
        for db_path in ['data/ai_monitoring.db', 'data/adaptive_learning.db', 
                       'data/xai_explanations.db', 'data/ai_anomaly_detection.db']:
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = cursor.fetchall()
                print(f"✓ Database {db_path}: {len(tables)} tables initialized")
        
        print("✓ All integration tests passed!")
        
    except Exception as e:
        print(f"✗ Integration test failed: {e}")
        raise

def main():
    """Main installation function"""
    logger = setup_logging()
    
    print("🛡️  SHIELD SOC AI Monitoring & Observability Framework")
    print("=" * 60)
    print("Installing AI monitoring components...")
    print()
    
    try:
        # Check prerequisites
        check_python_version()
        
        # Install dependencies
        install_python_dependencies()
        
        # Create structure
        create_directory_structure()
        
        # Initialize databases
        initialize_databases()
        
        # Create configurations
        create_configuration_files()
        
        # Create scripts
        create_startup_scripts()
        
        # Create demo data
        create_demo_data()
        
        # Run tests
        run_integration_tests()
        
        print("\n" + "=" * 60)
        print("🎉 Installation completed successfully!")
        print("=" * 60)
        print()
        print("Next steps:")
        print("1. Start the AI monitoring components:")
        print("   ./scripts/start_ai_monitoring.sh")
        print()
        print("2. Check status:")
        print("   ./scripts/status_ai_monitoring.sh")
        print()
        print("3. View the monitoring dashboard in your browser:")
        print("   http://localhost:3000 (AI Observability tab)")
        print()
        print("4. Stop monitoring components:")
        print("   ./scripts/stop_ai_monitoring.sh")
        print()
        print("Configuration files are located in: ./config/")
        print("Log files will be written to: ./logs/")
        print("Databases are stored in: ./data/")
        print()
        print("For more information, see the documentation in SETUP_GUIDE.md")
        
    except Exception as e:
        logger.error(f"Installation failed: {e}")
        print(f"\n❌ Installation failed: {e}")
        print("Check ai_monitoring_install.log for detailed error information")
        sys.exit(1)

if __name__ == "__main__":
    main()