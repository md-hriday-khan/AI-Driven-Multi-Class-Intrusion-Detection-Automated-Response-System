#!/usr/bin/env python3
"""
CyberAuton SOC Complete System Startup
Comprehensive startup script for all backend services
Created by Md.Hriday Khan
"""

import os
import sys
import time
import threading
import subprocess
import logging
import signal
import json
from pathlib import Path
from datetime import datetime

# Add current directory to Python path
sys.path.append(str(Path.cwd()))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'system_startup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class CyberAutonSystemLauncher:
    """
    Complete system launcher for CyberAuton SOC
    """
    
    def __init__(self):
        self.processes = {}
        self.running = True
        self.start_time = time.time()
        
    def print_banner(self):
        """Print startup banner"""
        banner = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    CYBERAUTON SOC - COMPLETE SYSTEM STARTUP                 ║
║                           Created by Md.Hriday Khan                         ║
║                                                                              ║
║  🚀 Starting all backend services and APIs                                  ║
║  🗄️  CIC-IDS2017 dataset integration enabled                               ║
║  🔐 Authentication and security systems active                              ║
║  🌐 WebSocket real-time monitoring enabled                                  ║
║                                                                              ║
║  Startup Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
        """
        print(banner)
    
    def start_backend_api(self):
        """Start main backend API server"""
        logger.info("🔗 Starting Backend API Server...")
        try:
            process = subprocess.Popen(
                [sys.executable, "backend_api_server.py"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            self.processes['backend_api'] = process
            logger.info("✅ Backend API Server started (PID: %d)", process.pid)
            return True
        except Exception as e:
            logger.error("❌ Backend API Server failed to start: %s", e)
            return False
    
    def start_websocket_server(self):
        """Start WebSocket server"""
        logger.info("🌐 Starting WebSocket Server...")
        try:
            # Check if Node.js is available
            result = subprocess.run(['node', '--version'], capture_output=True, text=True)
            if result.returncode != 0:
                logger.warning("⚠️  Node.js not found, WebSocket server will not start")
                return False
            
            process = subprocess.Popen(
                ['node', 'websocket-server/server.js'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            self.processes['websocket'] = process
            logger.info("✅ WebSocket Server started (PID: %d)", process.pid)
            return True
        except Exception as e:
            logger.error("❌ WebSocket Server failed to start: %s", e)
            return False
    
    def start_enhanced_ids(self):
        """Start Enhanced IDS with CIC-IDS support"""
        logger.info("🔬 Starting Enhanced IDS System...")
        try:
            process = subprocess.Popen(
                [sys.executable, "enhanced_ids_dataset_integration.py"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            self.processes['enhanced_ids'] = process
            logger.info("✅ Enhanced IDS System started (PID: %d)", process.pid)
            return True
        except Exception as e:
            logger.error("❌ Enhanced IDS System failed to start: %s", e)
            return False
    
    def start_vehicle_safety_api(self):
        """Start Vehicle Safety API"""
        logger.info("🚗 Starting Vehicle Safety API...")
        try:
            process = subprocess.Popen(
                [sys.executable, "vehicle_safety_api.py"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            self.processes['vehicle_safety'] = process
            logger.info("✅ Vehicle Safety API started (PID: %d)", process.pid)
            return True
        except Exception as e:
            logger.error("❌ Vehicle Safety API failed to start: %s", e)
            return False
    
    def start_real_time_ids(self):
        """Start Real-time IDS engine"""
        logger.info("🛡️  Starting Real-time IDS Engine...")
        try:
            process = subprocess.Popen(
                [sys.executable, "real_time_ids.py"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            self.processes['real_time_ids'] = process
            logger.info("✅ Real-time IDS Engine started (PID: %d)", process.pid)
            return True
        except Exception as e:
            logger.error("❌ Real-time IDS Engine failed to start: %s", e)
            return False
    
    def check_service_health(self, service_name, port):
        """Check if a service is responding"""
        try:
            import requests
            response = requests.get(f"http://localhost:{port}/api/health", timeout=5)
            if response.status_code == 200:
                logger.info("✅ %s health check passed", service_name)
                return True
            else:
                logger.warning("⚠️  %s health check failed (status: %d)", service_name, response.status_code)
                return False
        except Exception as e:
            logger.warning("⚠️  %s health check failed: %s", service_name, e)
            return False
    
    def monitor_processes(self):
        """Monitor running processes"""
        while self.running:
            time.sleep(30)  # Check every 30 seconds
            
            for service_name, process in list(self.processes.items()):
                if process.poll() is not None:
                    logger.error("❌ %s has stopped unexpectedly", service_name)
                    # Could implement auto-restart logic here
                    del self.processes[service_name]
            
            # Log system status
            uptime = time.time() - self.start_time
            logger.info("🔄 System running - Uptime: %.1f minutes, Active services: %d", 
                       uptime / 60, len(self.processes))
    
    def shutdown_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info("🛑 Shutdown signal received, stopping all services...")
        self.shutdown()
    
    def shutdown(self):
        """Shutdown all services gracefully"""
        self.running = False
        
        for service_name, process in self.processes.items():
            logger.info("🛑 Stopping %s...", service_name)
            try:
                process.terminate()
                process.wait(timeout=10)
                logger.info("✅ %s stopped gracefully", service_name)
            except subprocess.TimeoutExpired:
                logger.warning("⚠️  Force killing %s", service_name)
                process.kill()
            except Exception as e:
                logger.error("❌ Error stopping %s: %s", service_name, e)
        
        logger.info("🎯 All services stopped")
    
    def start_all_services(self):
        """Start all services in the correct order"""
        self.print_banner()
        
        services = [
            ("Backend API", self.start_backend_api, 5000),
            ("Vehicle Safety API", self.start_vehicle_safety_api, 5001),
            ("WebSocket Server", self.start_websocket_server, 8080),
            ("Enhanced IDS", self.start_enhanced_ids, 8081),
            ("Real-time IDS", self.start_real_time_ids, None)
        ]
        
        started_services = 0
        
        for service_name, start_func, port in services:
            logger.info("🚀 Starting %s...", service_name)
            if start_func():
                started_services += 1
                time.sleep(3)  # Wait between service starts
                
                # Health check for HTTP services
                if port and port in [5000, 5001]:
                    time.sleep(5)  # Extra wait for HTTP services
                    self.check_service_health(service_name, port)
            else:
                logger.error("❌ Failed to start %s", service_name)
        
        # Display startup summary
        total_services = len(services)
        success_rate = (started_services / total_services) * 100
        
        summary = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                           STARTUP COMPLETE                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  📊 STARTUP SUMMARY:                                                         ║
║     • Services Started: {started_services}/{total_services} ({success_rate:.1f}%)                                   ║
║     • Total Processes: {len(self.processes)}                                               ║
║     • Startup Time: {time.time() - self.start_time:.1f} seconds                                     ║
║                                                                              ║
║  🌐 SYSTEM ENDPOINTS:                                                        ║
║     • Frontend Dashboard: http://localhost:3000                             ║
║     • Backend API: http://localhost:5000/api/health                         ║
║     • Vehicle Safety: http://localhost:5001/api/health                      ║
║     • WebSocket: ws://localhost:8080                                         ║
║     • Enhanced IDS: ws://localhost:8081                                      ║
║                                                                              ║
║  🔐 DEFAULT CREDENTIALS:                                                     ║
║     • admin/admin123 (Administrator)                                        ║
║     • analyst/analyst123 (Security Analyst)                                 ║
║     • operator/operator123 (SOC Operator)                                   ║
║                                                                              ║
║  📊 CIC-IDS2017 DATASET:                                                    ║
║     • Sample dataset ready for testing                                      ║
║     • 78 network flow features supported                                    ║
║     • Real-time anomaly detection active                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
        """
        print(summary)
        
        if started_services == total_services:
            logger.info("🎉 All services started successfully!")
        elif started_services > 0:
            logger.warning("⚠️  System partially operational (%d/%d services)", started_services, total_services)
        else:
            logger.error("❌ System startup failed - no services started")
            return False
        
        return True
    
    def run(self):
        """Main run method"""
        # Set up signal handlers
        signal.signal(signal.SIGINT, self.shutdown_handler)
        signal.signal(signal.SIGTERM, self.shutdown_handler)
        
        # Start all services
        if not self.start_all_services():
            logger.error("❌ System startup failed")
            return 1
        
        # Start monitoring
        monitor_thread = threading.Thread(target=self.monitor_processes, daemon=True)
        monitor_thread.start()
        
        # Main loop
        try:
            logger.info("🔄 System monitoring active. Press Ctrl+C to stop.")
            while self.running and self.processes:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("🛑 Keyboard interrupt received")
        finally:
            self.shutdown()
        
        return 0

def main():
    """Main function"""
    launcher = CyberAutonSystemLauncher()
    return launcher.run()

if __name__ == "__main__":
    sys.exit(main())