#!/usr/bin/env python3
"""
Complete CyberAuton System Launcher
Starts all backend services and prepares the system for frontend
Created by Md.Hriday Khan
"""

import subprocess
import time
import sys
import os
import threading
import signal
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SystemLauncher:
    def __init__(self):
        self.processes = []
        self.running = True
        
    def start_service(self, script_name, description, port=None):
        """Start a backend service"""
        try:
            logger.info(f"Starting {description}...")
            if port:
                logger.info(f"  Service will be available on port {port}")
            
            process = subprocess.Popen([
                sys.executable, script_name
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            self.processes.append({
                'process': process,
                'name': description,
                'script': script_name,
                'port': port
            })
            
            # Give the service a moment to start
            time.sleep(2)
            
            # Check if process is still running
            if process.poll() is None:
                logger.info(f"✓ {description} started successfully")
                return True
            else:
                stdout, stderr = process.communicate()
                logger.error(f"✗ Failed to start {description}")
                logger.error(f"  Error: {stderr}")
                return False
                
        except Exception as e:
            logger.error(f"✗ Exception starting {description}: {e}")
            return False
    
    def check_services(self):
        """Check status of all running services"""
        logger.info("\n=== Service Status Check ===")
        active_services = 0
        
        for service in self.processes:
            if service['process'].poll() is None:
                logger.info(f"✓ {service['name']} - Running (PID: {service['process'].pid})")
                if service['port']:
                    logger.info(f"  Available at: http://localhost:{service['port']}")
                active_services += 1
            else:
                logger.error(f"✗ {service['name']} - Stopped")
        
        logger.info(f"\nActive Services: {active_services}/{len(self.processes)}")
        return active_services
    
    def stop_all_services(self):
        """Stop all running services"""
        logger.info("\n=== Stopping All Services ===")
        self.running = False
        
        for service in self.processes:
            try:
                if service['process'].poll() is None:
                    logger.info(f"Stopping {service['name']}...")
                    service['process'].terminate()
                    
                    # Wait for graceful shutdown
                    try:
                        service['process'].wait(timeout=5)
                        logger.info(f"✓ {service['name']} stopped gracefully")
                    except subprocess.TimeoutExpired:
                        logger.warning(f"Force killing {service['name']}...")
                        service['process'].kill()
                        service['process'].wait()
                        logger.info(f"✓ {service['name']} force stopped")
            except Exception as e:
                logger.error(f"Error stopping {service['name']}: {e}")
    
    def signal_handler(self, signum, frame):
        """Handle system signals for clean shutdown"""
        logger.info(f"\nReceived signal {signum}. Initiating shutdown...")
        self.stop_all_services()
        sys.exit(0)
    
    def monitor_services(self):
        """Monitor services and restart if needed"""
        while self.running:
            time.sleep(30)  # Check every 30 seconds
            
            if not self.running:
                break
                
            failed_services = []
            for service in self.processes:
                if service['process'].poll() is not None:
                    failed_services.append(service)
            
            if failed_services:
                logger.warning(f"\n⚠️  Detected {len(failed_services)} failed services")
                for service in failed_services:
                    logger.warning(f"  - {service['name']} has stopped")
                    # Could implement auto-restart here if needed
    
    def run(self):
        """Run the complete system"""
        logger.info("🚀 CyberAuton Security Operations Centre - System Launcher")
        logger.info("=" * 60)
        
        # Set up signal handlers for clean shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # Check if required files exist
        required_files = [
            'backend_api_server.py',
            'vehicle_safety_api.py',
            'real_time_ids.py'
        ]
        
        missing_files = [f for f in required_files if not os.path.exists(f)]
        if missing_files:
            logger.error("❌ Missing required files:")
            for file in missing_files:
                logger.error(f"  - {file}")
            logger.error("\nPlease ensure all backend files are present.")
            return False
        
        # Start all backend services
        services = [
            {
                'script': 'backend_api_server.py',
                'description': 'Main Backend API Server',
                'port': 5000
            },
            {
                'script': 'vehicle_safety_api.py', 
                'description': 'Vehicle Safety Control API',
                'port': 5001
            }
        ]
        
        success_count = 0
        for service in services:
            if self.start_service(
                service['script'], 
                service['description'], 
                service['port']
            ):
                success_count += 1
        
        if success_count == 0:
            logger.error("❌ No services started successfully. Exiting.")
            return False
        
        # Wait a bit for services to fully initialize
        logger.info("\n⏳ Waiting for services to initialize...")
        time.sleep(5)
        
        # Check service status
        active_services = self.check_services()
        
        if active_services > 0:
            logger.info("\n✅ System Setup Complete!")
            logger.info("=" * 60)
            logger.info("🌐 Frontend Development Server:")
            logger.info("   Start with: npm start")
            logger.info("   Access at: http://localhost:3000")
            logger.info("")
            logger.info("🔧 Available Backend APIs:")
            logger.info("   Main API: http://localhost:5000")
            logger.info("   Vehicle Safety: http://localhost:5001")
            logger.info("")
            logger.info("📚 API Documentation:")
            logger.info("   http://localhost:5000/api/health")
            logger.info("   http://localhost:5001/api/health")
            logger.info("")
            logger.info("🛡️  CyberAuton SOC Features Available:")
            logger.info("   • Real-time Threat Detection")
            logger.info("   • UAV Security Systems (MAVIDS, DroneSploit, UAV-NIDD)")
            logger.info("   • Emergency Vehicle Control")
            logger.info("   • AI-Powered Response Playbooks")
            logger.info("   • Comprehensive Security Monitoring")
            logger.info("")
            logger.info("Press Ctrl+C to stop all services")
            logger.info("=" * 60)
            
            # Start monitoring thread
            monitor_thread = threading.Thread(target=self.monitor_services, daemon=True)
            monitor_thread.start()
            
            # Keep the main thread alive
            try:
                while self.running:
                    time.sleep(1)
            except KeyboardInterrupt:
                self.signal_handler(signal.SIGINT, None)
        else:
            logger.error("❌ System startup failed. No services are running.")
            return False

def main():
    launcher = SystemLauncher()
    try:
        launcher.run()
    except Exception as e:
        logger.error(f"System launcher error: {e}")
        launcher.stop_all_services()
        return False
    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)