#!/usr/bin/env python3
"""
SHIELD Security Operations Center - Startup Script
Launches all backend services and systems
Created by Md.Hriday Khan
"""

import subprocess
import sys
import time
import threading
import signal
import os
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('SHIELD-SOC')

class SHIELDSOCLauncher:
    """Main launcher for SHIELD SOC"""
    
    def __init__(self):
        self.processes = []
        self.running = True
        self.services = {
            'websocket_server': None,
            'backend_api': None,
            'ids_engine': None
        }
        
    def check_requirements(self):
        """Check if all required files exist"""
        required_files = [
            'backend_api_server.py',
            'real_time_ids.py',
            'websocket-server/server.js'
        ]
        
        missing_files = []
        for file_path in required_files:
            if not Path(file_path).exists():
                missing_files.append(file_path)
        
        if missing_files:
            logger.error(f"Missing required files: {missing_files}")
            return False
        
        return True
    
    def install_dependencies(self):
        """Install Python dependencies"""
        logger.info("Installing Python dependencies...")
        try:
            subprocess.run([
                sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'
            ], check=True, capture_output=True)
            logger.info("Python dependencies installed successfully")
        except subprocess.CalledProcessError as e:
            logger.warning(f"Failed to install some dependencies: {e}")
        except FileNotFoundError:
            logger.info("requirements.txt not found, skipping Python dependency installation")
    
    def start_websocket_server(self):
        """Start the WebSocket server"""
        logger.info("Starting WebSocket server...")
        try:
            # Check if Node.js is available
            subprocess.run(['node', '--version'], check=True, capture_output=True)
            
            process = subprocess.Popen([
                'node', 'websocket-server/server.js'
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            self.services['websocket_server'] = process
            self.processes.append(process)
            logger.info("WebSocket server started on port 8080")
            return True
            
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("Node.js not available, WebSocket server will use mock data mode")
            return False
    
    def start_backend_api(self):
        """Start the backend API server"""
        logger.info("Starting Backend API server...")
        try:
            process = subprocess.Popen([
                sys.executable, 'backend_api_server.py'
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            self.services['backend_api'] = process
            self.processes.append(process)
            logger.info("Backend API server started on port 5000")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start Backend API server: {e}")
            return False
    
    def start_ids_engine(self):
        """Start the IDS engine"""
        logger.info("Starting IDS engine...")
        try:
            process = subprocess.Popen([
                sys.executable, 'real_time_ids.py'
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            self.services['ids_engine'] = process
            self.processes.append(process)
            logger.info("IDS engine started successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start IDS engine: {e}")
            return False
    
    def monitor_services(self):
        """Monitor all services and restart if needed"""
        while self.running:
            for service_name, process in self.services.items():
                if process and process.poll() is not None:
                    logger.warning(f"Service {service_name} has stopped, attempting restart...")
                    
                    if service_name == 'websocket_server':
                        self.start_websocket_server()
                    elif service_name == 'backend_api':
                        self.start_backend_api()
                    elif service_name == 'ids_engine':
                        self.start_ids_engine()
            
            time.sleep(10)  # Check every 10 seconds
    
    def create_demo_data(self):
        """Create initial demo data"""
        logger.info("Initializing demo data...")
        
        # Create demo database
        import sqlite3
        conn = sqlite3.connect('shield_backend.db')
        cursor = conn.cursor()
        
        # Insert some demo network captures
        demo_captures = [
            (time.time(), '192.168.1.100', '10.0.0.50', 'TCP', 443, 80, 1500, 'SYN,ACK', 'HTTP/1.1 GET /api/data'),
            (time.time(), '192.168.1.101', '10.0.0.51', 'UDP', 53, 53, 512, '', 'DNS Query: example.com'),
            (time.time(), '192.168.1.102', '10.0.0.52', 'TCP', 22, 22, 1024, 'PSH,ACK', 'SSH Protocol')
        ]
        
        for capture in demo_captures:
            cursor.execute('''
                INSERT INTO network_captures 
                (timestamp, src_ip, dst_ip, protocol, src_port, dst_port, packet_size, flags, payload_preview)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', capture)
        
        conn.commit()
        conn.close()
        logger.info("Demo data created successfully")
    
    def print_banner(self):
        """Print SHIELD SOC banner"""
        banner = """
    ███████╗██╗  ██╗██╗███████╗██╗     ██████╗     ███████╗ ██████╗  ██████╗
    ██╔════╝██║  ██║██║██╔════╝██║     ██╔══██╗    ██╔════╝██╔═══██╗██╔════╝
    ███████╗███████║██║█████╗  ██║     ██║  ██║    ███████╗██║   ██║██║     
    ╚════██║██╔══██║██║██╔══╝  ██║     ██║  ██║    ╚════██║██║   ██║██║     
    ███████║██║  ██║██║███████╗███████╗██████╔╝    ███████║╚██████╔╝╚██████╗
    ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═════╝     ╚══════╝ ╚═════╝  ╚═════╝
    
    Security Operations Center - Advanced Cybersecurity Platform
    Created by Md.Hriday Khan
    
    🛡️  Real-time Threat Detection & Response
    🔍  Advanced Network Traffic Analysis  
    🤖  AI-Powered Anomaly Detection
    📊  Comprehensive Security Analytics
    🚨  Autonomous Response Engine
    """
        print(banner)
    
    def print_status(self):
        """Print current status of all services"""
        print("\n" + "="*60)
        print("SHIELD SOC - SERVICE STATUS")
        print("="*60)
        
        for service_name, process in self.services.items():
            if process and process.poll() is None:
                status = "🟢 RUNNING"
            else:
                status = "🔴 STOPPED"
            
            print(f"{service_name.upper():<20} {status}")
        
        print("\nACCESS POINTS:")
        print("Frontend:        http://localhost:3000")
        print("Backend API:     http://localhost:5000")
        print("WebSocket:       ws://localhost:8080")
        print("Health Check:    http://localhost:5000/api/health")
        print("\nPress Ctrl+C to shutdown all services")
        print("="*60)
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info("Shutdown signal received, stopping all services...")
        self.shutdown()
    
    def shutdown(self):
        """Shutdown all services"""
        self.running = False
        
        for process in self.processes:
            if process.poll() is None:
                logger.info(f"Terminating process {process.pid}")
                process.terminate()
                
                # Wait for graceful shutdown
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    logger.warning(f"Force killing process {process.pid}")
                    process.kill()
        
        logger.info("All services stopped successfully")
    
    def start(self):
        """Start all SHIELD SOC services"""
        # Setup signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        self.print_banner()
        
        # Check requirements
        if not self.check_requirements():
            logger.error("Requirements check failed, exiting...")
            return False
        
        # Install dependencies
        self.install_dependencies()
        
        # Create demo data
        self.create_demo_data()
        
        # Start services
        logger.info("Starting SHIELD SOC services...")
        
        services_started = 0
        
        if self.start_websocket_server():
            services_started += 1
        
        if self.start_backend_api():
            services_started += 1
        
        if self.start_ids_engine():
            services_started += 1
        
        if services_started == 0:
            logger.error("Failed to start any services")
            return False
        
        # Wait for services to initialize
        time.sleep(3)
        
        # Print status
        self.print_status()
        
        # Start monitoring thread
        monitor_thread = threading.Thread(target=self.monitor_services, daemon=True)
        monitor_thread.start()
        
        # Keep main thread alive
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
        finally:
            self.shutdown()
        
        return True

def main():
    """Main entry point"""
    launcher = SHIELDSOCLauncher()
    
    try:
        success = launcher.start()
        if success:
            logger.info("SHIELD SOC started successfully")
        else:
            logger.error("Failed to start SHIELD SOC")
            return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())