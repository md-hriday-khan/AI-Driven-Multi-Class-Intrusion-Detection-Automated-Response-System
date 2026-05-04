#!/usr/bin/env python3
"""
Digital Twin Security Testing Environment for SHIELD SOC
Virtual replica of network infrastructure for security scenario testing
"""

import numpy as np
import pandas as pd
import networkx as nx
import json
import sqlite3
import threading
import time
import logging
import uuid
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Set
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio
import websockets
from concurrent.futures import ThreadPoolExecutor
import ipaddress
import subprocess
import socket

class NodeType(Enum):
    """Network node types"""
    WORKSTATION = "workstation"
    SERVER = "server"
    ROUTER = "router"
    SWITCH = "switch"
    FIREWALL = "firewall"
    DATABASE = "database"
    IOT_DEVICE = "iot_device"
    CLOUD_SERVICE = "cloud_service"

class ServiceType(Enum):
    """Network service types"""
    HTTP = "http"
    HTTPS = "https"
    SSH = "ssh"
    FTP = "ftp"
    SMTP = "smtp"
    DNS = "dns"
    DHCP = "dhcp"
    SQL = "sql"
    API = "api"
    RDP = "rdp"

class VulnerabilityType(Enum):
    """Vulnerability classifications"""
    BUFFER_OVERFLOW = "buffer_overflow"
    SQL_INJECTION = "sql_injection"
    XSS = "xss"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    WEAK_AUTHENTICATION = "weak_authentication"
    UNPATCHED_SOFTWARE = "unpatched_software"
    MISCONFIGURATIONS = "misconfigurations"
    DEFAULT_CREDENTIALS = "default_credentials"

@dataclass
class NetworkNode:
    """Digital twin network node"""
    node_id: str
    name: str
    node_type: NodeType
    ip_address: str
    mac_address: str
    os_type: str
    os_version: str
    services: List[Dict[str, Any]]
    vulnerabilities: List[Dict[str, Any]]
    security_controls: List[str]
    network_zone: str
    criticality: str  # low, medium, high, critical
    status: str  # online, offline, compromised, isolated
    metadata: Dict[str, Any]

@dataclass
class NetworkConnection:
    """Network connection between nodes"""
    connection_id: str
    source_node: str
    target_node: str
    connection_type: str  # tcp, udp, icmp
    port: int
    protocol: str
    bandwidth: float
    latency: float
    status: str  # active, inactive, blocked
    firewall_rules: List[Dict[str, Any]]

@dataclass
class SecurityScenario:
    """Security testing scenario"""
    scenario_id: str
    name: str
    description: str
    scenario_type: str  # penetration_test, vulnerability_scan, attack_simulation
    target_nodes: List[str]
    attack_vectors: List[str]
    expected_outcomes: List[str]
    success_criteria: Dict[str, Any]
    duration_minutes: int
    parameters: Dict[str, Any]
    status: str  # pending, running, completed, failed

@dataclass
class TestResult:
    """Security testing result"""
    result_id: str
    scenario_id: str
    timestamp: str
    test_type: str
    target_node: str
    success: bool
    details: Dict[str, Any]
    findings: List[Dict[str, Any]]
    recommendations: List[str]
    risk_score: float

class NetworkTopologyGenerator:
    """Generates realistic network topologies"""
    
    def __init__(self):
        self.node_templates = self._load_node_templates()
        self.vulnerability_db = self._load_vulnerability_database()
        
    def _load_node_templates(self) -> Dict[str, Dict[str, Any]]:
        """Load node templates for different device types"""
        return {
            "windows_workstation": {
                "os_type": "Windows",
                "os_version": "Windows 10",
                "common_services": [
                    {"name": "RDP", "port": 3389, "protocol": "tcp"},
                    {"name": "SMB", "port": 445, "protocol": "tcp"},
                    {"name": "WinRM", "port": 5985, "protocol": "tcp"}
                ],
                "common_vulnerabilities": ["weak_authentication", "unpatched_software"],
                "security_controls": ["windows_defender", "firewall"]
            },
            "linux_server": {
                "os_type": "Linux",
                "os_version": "Ubuntu 20.04",
                "common_services": [
                    {"name": "SSH", "port": 22, "protocol": "tcp"},
                    {"name": "HTTP", "port": 80, "protocol": "tcp"},
                    {"name": "HTTPS", "port": 443, "protocol": "tcp"}
                ],
                "common_vulnerabilities": ["privilege_escalation", "misconfigurations"],
                "security_controls": ["iptables", "fail2ban", "selinux"]
            },
            "database_server": {
                "os_type": "Linux",
                "os_version": "CentOS 8",
                "common_services": [
                    {"name": "MySQL", "port": 3306, "protocol": "tcp"},
                    {"name": "SSH", "port": 22, "protocol": "tcp"}
                ],
                "common_vulnerabilities": ["sql_injection", "weak_authentication"],
                "security_controls": ["mysql_firewall", "encryption_at_rest"]
            },
            "web_server": {
                "os_type": "Linux",
                "os_version": "Ubuntu 18.04",
                "common_services": [
                    {"name": "Apache", "port": 80, "protocol": "tcp"},
                    {"name": "HTTPS", "port": 443, "protocol": "tcp"},
                    {"name": "SSH", "port": 22, "protocol": "tcp"}
                ],
                "common_vulnerabilities": ["xss", "buffer_overflow"],
                "security_controls": ["mod_security", "ssl_certificates"]
            }
        }
    
    def _load_vulnerability_database(self) -> Dict[str, Dict[str, Any]]:
        """Load vulnerability database"""
        return {
            "CVE-2021-34527": {
                "type": "privilege_escalation",
                "severity": "critical",
                "description": "Windows Print Spooler Remote Code Execution",
                "affected_systems": ["Windows"],
                "cvss_score": 8.8
            },
            "CVE-2021-44228": {
                "type": "remote_code_execution",
                "severity": "critical",
                "description": "Log4j Remote Code Execution",
                "affected_systems": ["Java Applications"],
                "cvss_score": 10.0
            },
            "CVE-2021-34523": {
                "type": "privilege_escalation",
                "severity": "high",
                "description": "Microsoft Exchange Server Elevation of Privilege",
                "affected_systems": ["Exchange Server"],
                "cvss_score": 7.8
            }
        }
    
    def generate_corporate_network(self, num_workstations: int = 50, 
                                 num_servers: int = 10) -> Tuple[List[NetworkNode], List[NetworkConnection]]:
        """Generate a realistic corporate network topology"""
        nodes = []
        connections = []
        
        # Create network zones
        zones = {
            "dmz": {"subnet": "10.0.1.0/24", "nodes": []},
            "internal": {"subnet": "10.0.2.0/24", "nodes": []},
            "database": {"subnet": "10.0.3.0/24", "nodes": []},
            "management": {"subnet": "10.0.4.0/24", "nodes": []}
        }
        
        # Generate infrastructure nodes
        infrastructure_nodes = self._generate_infrastructure_nodes(zones)
        nodes.extend(infrastructure_nodes)
        
        # Generate workstations
        workstation_nodes = self._generate_workstations(num_workstations, zones["internal"])
        nodes.extend(workstation_nodes)
        
        # Generate servers
        server_nodes = self._generate_servers(num_servers, zones)
        nodes.extend(server_nodes)
        
        # Generate connections based on network topology
        connections = self._generate_network_connections(nodes, zones)
        
        return nodes, connections
    
    def _generate_infrastructure_nodes(self, zones: Dict[str, Dict[str, Any]]) -> List[NetworkNode]:
        """Generate infrastructure nodes (routers, switches, firewalls)"""
        nodes = []
        
        # Core router
        router = NetworkNode(
            node_id=str(uuid.uuid4()),
            name="core-router-01",
            node_type=NodeType.ROUTER,
            ip_address="10.0.0.1",
            mac_address=self._generate_mac_address(),
            os_type="Cisco IOS",
            os_version="15.7",
            services=[
                {"name": "SNMP", "port": 161, "protocol": "udp"},
                {"name": "SSH", "port": 22, "protocol": "tcp"}
            ],
            vulnerabilities=[
                {"cve": "CVE-2020-3452", "severity": "high", "type": "directory_traversal"}
            ],
            security_controls=["acl", "logging"],
            network_zone="management",
            criticality="critical",
            status="online",
            metadata={"vendor": "Cisco", "model": "ISR4331"}
        )
        nodes.append(router)
        
        # Firewall
        firewall = NetworkNode(
            node_id=str(uuid.uuid4()),
            name="perimeter-fw-01",
            node_type=NodeType.FIREWALL,
            ip_address="10.0.0.2",
            mac_address=self._generate_mac_address(),
            os_type="Palo Alto PAN-OS",
            os_version="10.1.0",
            services=[
                {"name": "HTTPS", "port": 443, "protocol": "tcp"},
                {"name": "SSH", "port": 22, "protocol": "tcp"}
            ],
            vulnerabilities=[],
            security_controls=["ips", "url_filtering", "application_control"],
            network_zone="dmz",
            criticality="critical",
            status="online",
            metadata={"vendor": "Palo Alto", "model": "PA-220"}
        )
        nodes.append(firewall)
        
        return nodes
    
    def _generate_workstations(self, count: int, zone: Dict[str, Any]) -> List[NetworkNode]:
        """Generate workstation nodes"""
        nodes = []
        base_ip = ipaddress.IPv4Network(zone["subnet"])
        
        for i in range(count):
            node = NetworkNode(
                node_id=str(uuid.uuid4()),
                name=f"workstation-{i+1:03d}",
                node_type=NodeType.WORKSTATION,
                ip_address=str(base_ip.network_address + i + 10),
                mac_address=self._generate_mac_address(),
                os_type="Windows",
                os_version=random.choice(["Windows 10", "Windows 11"]),
                services=self.node_templates["windows_workstation"]["common_services"].copy(),
                vulnerabilities=self._generate_vulnerabilities("workstation"),
                security_controls=self.node_templates["windows_workstation"]["security_controls"].copy(),
                network_zone="internal",
                criticality=random.choice(["low", "medium"]),
                status="online",
                metadata={"department": random.choice(["IT", "Finance", "HR", "Marketing", "Sales"])}
            )
            nodes.append(node)
            zone["nodes"].append(node.node_id)
        
        return nodes
    
    def _generate_servers(self, count: int, zones: Dict[str, Dict[str, Any]]) -> List[NetworkNode]:
        """Generate server nodes"""
        nodes = []
        server_types = ["web_server", "database_server", "linux_server"]
        
        for i in range(count):
            server_type = random.choice(server_types)
            zone_name = self._determine_server_zone(server_type)
            zone = zones[zone_name]
            
            base_ip = ipaddress.IPv4Network(zone["subnet"])
            
            node = NetworkNode(
                node_id=str(uuid.uuid4()),
                name=f"{server_type.replace('_', '-')}-{i+1:02d}",
                node_type=NodeType.SERVER,
                ip_address=str(base_ip.network_address + len(zone["nodes"]) + 10),
                mac_address=self._generate_mac_address(),
                os_type=self.node_templates[server_type]["os_type"],
                os_version=self.node_templates[server_type]["os_version"],
                services=self.node_templates[server_type]["common_services"].copy(),
                vulnerabilities=self._generate_vulnerabilities(server_type),
                security_controls=self.node_templates[server_type]["security_controls"].copy(),
                network_zone=zone_name,
                criticality="high" if server_type == "database_server" else "medium",
                status="online",
                metadata={"purpose": server_type, "backup_schedule": "daily"}
            )
            nodes.append(node)
            zone["nodes"].append(node.node_id)
        
        return nodes
    
    def _determine_server_zone(self, server_type: str) -> str:
        """Determine appropriate zone for server type"""
        zone_mapping = {
            "web_server": "dmz",
            "database_server": "database",
            "linux_server": "internal"
        }
        return zone_mapping.get(server_type, "internal")
    
    def _generate_vulnerabilities(self, node_type: str) -> List[Dict[str, Any]]:
        """Generate realistic vulnerabilities for node type"""
        vulnerabilities = []
        
        # Base vulnerabilities from template
        if node_type in self.node_templates:
            base_vulns = self.node_templates[node_type]["common_vulnerabilities"]
            for vuln_type in base_vulns:
                if random.random() < 0.3:  # 30% chance of vulnerability
                    vulnerabilities.append({
                        "type": vuln_type,
                        "severity": random.choice(["low", "medium", "high"]),
                        "cve": f"CVE-2021-{random.randint(10000, 99999)}",
                        "description": f"Sample {vuln_type} vulnerability"
                    })
        
        # Add random CVEs
        for cve, vuln_data in random.sample(list(self.vulnerability_db.items()), 
                                          min(2, len(self.vulnerability_db))):
            if random.random() < 0.1:  # 10% chance of known CVE
                vulnerabilities.append({
                    "cve": cve,
                    "type": vuln_data["type"],
                    "severity": vuln_data["severity"],
                    "description": vuln_data["description"],
                    "cvss_score": vuln_data["cvss_score"]
                })
        
        return vulnerabilities
    
    def _generate_network_connections(self, nodes: List[NetworkNode], 
                                    zones: Dict[str, Dict[str, Any]]) -> List[NetworkConnection]:
        """Generate network connections between nodes"""
        connections = []
        
        # Create connections based on network zones and business logic
        for node in nodes:
            if node.node_type == NodeType.WORKSTATION:
                # Workstations connect to servers and internet
                connections.extend(self._create_workstation_connections(node, nodes))
            elif node.node_type == NodeType.SERVER:
                # Servers have specific connection patterns
                connections.extend(self._create_server_connections(node, nodes))
        
        return connections
    
    def _create_workstation_connections(self, workstation: NetworkNode, 
                                      all_nodes: List[NetworkNode]) -> List[NetworkConnection]:
        """Create connections for workstation"""
        connections = []
        
        # Connect to servers in DMZ and internal zones
        for node in all_nodes:
            if (node.node_type == NodeType.SERVER and 
                node.network_zone in ["dmz", "internal"]):
                
                connection = NetworkConnection(
                    connection_id=str(uuid.uuid4()),
                    source_node=workstation.node_id,
                    target_node=node.node_id,
                    connection_type="tcp",
                    port=80,  # HTTP traffic
                    protocol="http",
                    bandwidth=100.0,  # Mbps
                    latency=1.0,  # ms
                    status="active",
                    firewall_rules=[
                        {"action": "allow", "source": workstation.network_zone, 
                         "destination": node.network_zone}
                    ]
                )
                connections.append(connection)
        
        return connections
    
    def _create_server_connections(self, server: NetworkNode, 
                                 all_nodes: List[NetworkNode]) -> List[NetworkConnection]:
        """Create connections for server"""
        connections = []
        
        # Database servers connect to application servers
        if "database" in server.name.lower():
            for node in all_nodes:
                if (node.node_type == NodeType.SERVER and 
                    "web" in node.name.lower()):
                    
                    connection = NetworkConnection(
                        connection_id=str(uuid.uuid4()),
                        source_node=node.node_id,
                        target_node=server.node_id,
                        connection_type="tcp",
                        port=3306,  # MySQL
                        protocol="mysql",
                        bandwidth=1000.0,  # Gbps
                        latency=0.5,  # ms
                        status="active",
                        firewall_rules=[
                            {"action": "allow", "source": "dmz", 
                             "destination": "database", "port": 3306}
                        ]
                    )
                    connections.append(connection)
        
        return connections
    
    def _generate_mac_address(self) -> str:
        """Generate random MAC address"""
        return ":".join([f"{random.randint(0, 255):02x}" for _ in range(6)])

class SecurityScenarioEngine:
    """Executes security testing scenarios on digital twin"""
    
    def __init__(self):
        self.scenario_templates = self._load_scenario_templates()
        self.attack_techniques = self._load_attack_techniques()
        
    def _load_scenario_templates(self) -> Dict[str, Dict[str, Any]]:
        """Load security scenario templates"""
        return {
            "lateral_movement": {
                "description": "Test lateral movement from compromised workstation",
                "attack_vectors": ["credential_dumping", "network_enumeration", "privilege_escalation"],
                "target_types": ["server", "database"],
                "success_criteria": {"nodes_compromised": 3, "time_limit": 1800}
            },
            "data_exfiltration": {
                "description": "Test data exfiltration detection capabilities",
                "attack_vectors": ["database_access", "file_transfer", "dns_tunneling"],
                "target_types": ["database_server", "file_server"],
                "success_criteria": {"data_extracted": True, "detection_rate": 0.8}
            },
            "ddos_simulation": {
                "description": "Simulate distributed denial of service attack",
                "attack_vectors": ["traffic_flooding", "resource_exhaustion"],
                "target_types": ["web_server", "firewall"],
                "success_criteria": {"service_degradation": True, "mitigation_time": 300}
            },
            "phishing_campaign": {
                "description": "Simulate phishing attack campaign",
                "attack_vectors": ["email_phishing", "credential_harvesting", "malware_deployment"],
                "target_types": ["workstation"],
                "success_criteria": {"click_rate": 0.15, "compromise_rate": 0.05}
            }
        }
    
    def _load_attack_techniques(self) -> Dict[str, Dict[str, Any]]:
        """Load MITRE ATT&CK techniques"""
        return {
            "T1078": {
                "name": "Valid Accounts",
                "description": "Use valid account credentials",
                "tactic": "Defense Evasion",
                "difficulty": "medium",
                "detection_probability": 0.6
            },
            "T1055": {
                "name": "Process Injection",
                "description": "Inject code into running processes",
                "tactic": "Defense Evasion",
                "difficulty": "high",
                "detection_probability": 0.4
            },
            "T1021": {
                "name": "Remote Services",
                "description": "Use remote services for lateral movement",
                "tactic": "Lateral Movement",
                "difficulty": "low",
                "detection_probability": 0.8
            }
        }
    
    def create_scenario(self, scenario_type: str, target_nodes: List[str], 
                       parameters: Dict[str, Any] = None) -> SecurityScenario:
        """Create security testing scenario"""
        if scenario_type not in self.scenario_templates:
            raise ValueError(f"Unknown scenario type: {scenario_type}")
        
        template = self.scenario_templates[scenario_type]
        
        scenario = SecurityScenario(
            scenario_id=str(uuid.uuid4()),
            name=f"{scenario_type}_scenario_{int(time.time())}",
            description=template["description"],
            scenario_type=scenario_type,
            target_nodes=target_nodes,
            attack_vectors=template["attack_vectors"],
            expected_outcomes=self._determine_expected_outcomes(scenario_type, target_nodes),
            success_criteria=template["success_criteria"],
            duration_minutes=parameters.get("duration", 30) if parameters else 30,
            parameters=parameters or {},
            status="pending"
        )
        
        return scenario
    
    def execute_scenario(self, scenario: SecurityScenario, 
                        network_nodes: List[NetworkNode]) -> List[TestResult]:
        """Execute security scenario"""
        results = []
        scenario.status = "running"
        
        try:
            # Execute each attack vector
            for attack_vector in scenario.attack_vectors:
                vector_results = self._execute_attack_vector(
                    attack_vector, scenario.target_nodes, network_nodes, scenario.parameters
                )
                results.extend(vector_results)
            
            # Evaluate success criteria
            scenario_success = self._evaluate_success_criteria(scenario, results)
            
            scenario.status = "completed" if scenario_success else "failed"
            
        except Exception as e:
            scenario.status = "failed"
            logging.error(f"Error executing scenario {scenario.scenario_id}: {e}")
        
        return results
    
    def _execute_attack_vector(self, attack_vector: str, target_nodes: List[str],
                             network_nodes: List[NetworkNode], parameters: Dict[str, Any]) -> List[TestResult]:
        """Execute specific attack vector"""
        results = []
        
        # Get target node objects
        targets = [node for node in network_nodes if node.node_id in target_nodes]
        
        for target in targets:
            result = self._simulate_attack(attack_vector, target, parameters)
            results.append(result)
        
        return results
    
    def _simulate_attack(self, attack_vector: str, target: NetworkNode, 
                        parameters: Dict[str, Any]) -> TestResult:
        """Simulate attack against target node"""
        # Calculate success probability based on vulnerabilities and security controls
        vulnerability_factor = len([v for v in target.vulnerabilities if v.get("severity") in ["high", "critical"]]) * 0.2
        security_factor = len(target.security_controls) * 0.1
        
        base_success_probability = 0.3  # Base chance
        success_probability = base_success_probability + vulnerability_factor - security_factor
        success_probability = max(0.0, min(1.0, success_probability))
        
        # Simulate attack
        attack_success = random.random() < success_probability
        
        # Generate findings
        findings = []
        if attack_success:
            findings.append({
                "type": "successful_compromise",
                "description": f"{attack_vector} successful against {target.name}",
                "severity": "high",
                "evidence": ["logs", "network_traffic", "system_artifacts"]
            })
        else:
            findings.append({
                "type": "blocked_attack",
                "description": f"{attack_vector} blocked by security controls",
                "severity": "medium",
                "mitigation": target.security_controls
            })
        
        # Calculate risk score
        risk_score = self._calculate_risk_score(attack_success, target, findings)
        
        return TestResult(
            result_id=str(uuid.uuid4()),
            scenario_id="",  # Will be set by caller
            timestamp=datetime.now().isoformat(),
            test_type=attack_vector,
            target_node=target.node_id,
            success=attack_success,
            details={
                "attack_vector": attack_vector,
                "target_info": {
                    "name": target.name,
                    "type": target.node_type.value,
                    "ip": target.ip_address,
                    "zone": target.network_zone
                },
                "success_probability": success_probability,
                "vulnerability_count": len(target.vulnerabilities),
                "security_controls": target.security_controls
            },
            findings=findings,
            recommendations=self._generate_recommendations(attack_vector, target, attack_success),
            risk_score=risk_score
        )
    
    def _calculate_risk_score(self, attack_success: bool, target: NetworkNode, 
                            findings: List[Dict[str, Any]]) -> float:
        """Calculate risk score for test result"""
        base_score = 5.0  # Medium risk
        
        # Adjust for attack success
        if attack_success:
            base_score += 3.0
        
        # Adjust for target criticality
        criticality_multiplier = {
            "low": 0.8,
            "medium": 1.0,
            "high": 1.3,
            "critical": 1.5
        }
        base_score *= criticality_multiplier.get(target.criticality, 1.0)
        
        # Adjust for vulnerability severity
        high_vuln_count = len([v for v in target.vulnerabilities if v.get("severity") == "high"])
        critical_vuln_count = len([v for v in target.vulnerabilities if v.get("severity") == "critical"])
        
        base_score += high_vuln_count * 0.5 + critical_vuln_count * 1.0
        
        return min(10.0, max(0.0, base_score))
    
    def _generate_recommendations(self, attack_vector: str, target: NetworkNode, 
                                attack_success: bool) -> List[str]:
        """Generate security recommendations"""
        recommendations = []
        
        if attack_success:
            recommendations.append(f"Implement additional security controls for {attack_vector}")
            recommendations.append(f"Review and update security configuration on {target.name}")
            
            # Specific recommendations based on vulnerabilities
            for vuln in target.vulnerabilities:
                if vuln.get("severity") in ["high", "critical"]:
                    recommendations.append(f"Patch vulnerability: {vuln.get('cve', 'Unknown CVE')}")
        
        # General recommendations
        recommendations.extend([
            "Conduct regular vulnerability assessments",
            "Implement network segmentation",
            "Enable comprehensive logging and monitoring",
            "Provide security awareness training"
        ])
        
        return recommendations
    
    def _evaluate_success_criteria(self, scenario: SecurityScenario, 
                                 results: List[TestResult]) -> bool:
        """Evaluate if scenario met success criteria"""
        success_criteria = scenario.success_criteria
        
        if "nodes_compromised" in success_criteria:
            compromised_count = len([r for r in results if r.success])
            return compromised_count >= success_criteria["nodes_compromised"]
        
        if "detection_rate" in success_criteria:
            detected_attacks = len([r for r in results if not r.success])
            total_attacks = len(results)
            detection_rate = detected_attacks / total_attacks if total_attacks > 0 else 0
            return detection_rate >= success_criteria["detection_rate"]
        
        return False
    
    def _determine_expected_outcomes(self, scenario_type: str, target_nodes: List[str]) -> List[str]:
        """Determine expected outcomes for scenario"""
        outcomes = []
        
        outcome_mapping = {
            "lateral_movement": ["network_enumeration", "credential_compromise", "privilege_escalation"],
            "data_exfiltration": ["data_access", "data_transfer", "detection_evasion"],
            "ddos_simulation": ["service_disruption", "resource_exhaustion", "mitigation_response"],
            "phishing_campaign": ["email_delivery", "user_interaction", "payload_execution"]
        }
        
        return outcome_mapping.get(scenario_type, ["unknown_outcome"])

class DigitalTwinManager:
    """Main digital twin management system"""
    
    def __init__(self, db_path: str = './data/digital_twin.db'):
        self.db_path = db_path
        self.topology_generator = NetworkTopologyGenerator()
        self.scenario_engine = SecurityScenarioEngine()
        
        # Current digital twin state
        self.network_nodes = []
        self.network_connections = []
        self.active_scenarios = {}
        self.test_results = []
        
        # Execution thread pool
        self.executor = ThreadPoolExecutor(max_workers=5)
        
        # Initialize database
        self._init_database()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger('DigitalTwinManager')
    
    def _init_database(self):
        """Initialize digital twin database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Network nodes table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS network_nodes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        node_id TEXT UNIQUE NOT NULL,
                        name TEXT NOT NULL,
                        node_type TEXT,
                        ip_address TEXT,
                        mac_address TEXT,
                        os_type TEXT,
                        os_version TEXT,
                        services TEXT,
                        vulnerabilities TEXT,
                        security_controls TEXT,
                        network_zone TEXT,
                        criticality TEXT,
                        status TEXT,
                        metadata TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Network connections table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS network_connections (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        connection_id TEXT UNIQUE NOT NULL,
                        source_node TEXT,
                        target_node TEXT,
                        connection_type TEXT,
                        port INTEGER,
                        protocol TEXT,
                        bandwidth REAL,
                        latency REAL,
                        status TEXT,
                        firewall_rules TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Security scenarios table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS security_scenarios (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        scenario_id TEXT UNIQUE NOT NULL,
                        name TEXT,
                        description TEXT,
                        scenario_type TEXT,
                        target_nodes TEXT,
                        attack_vectors TEXT,
                        expected_outcomes TEXT,
                        success_criteria TEXT,
                        duration_minutes INTEGER,
                        parameters TEXT,
                        status TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Test results table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS test_results (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        result_id TEXT UNIQUE NOT NULL,
                        scenario_id TEXT,
                        timestamp TEXT,
                        test_type TEXT,
                        target_node TEXT,
                        success BOOLEAN,
                        details TEXT,
                        findings TEXT,
                        recommendations TEXT,
                        risk_score REAL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                conn.commit()
                self.logger.info("Digital twin database initialized")
                
        except Exception as e:
            self.logger.error(f"Error initializing database: {e}")
    
    def create_network_topology(self, topology_type: str = "corporate", 
                              **kwargs) -> Dict[str, Any]:
        """Create network topology"""
        try:
            if topology_type == "corporate":
                nodes, connections = self.topology_generator.generate_corporate_network(
                    num_workstations=kwargs.get("workstations", 20),
                    num_servers=kwargs.get("servers", 5)
                )
            else:
                raise ValueError(f"Unknown topology type: {topology_type}")
            
            # Store in memory and database
            self.network_nodes = nodes
            self.network_connections = connections
            
            self._store_topology()
            
            self.logger.info(f"Created {topology_type} topology: {len(nodes)} nodes, {len(connections)} connections")
            
            return {
                "topology_type": topology_type,
                "nodes_created": len(nodes),
                "connections_created": len(connections),
                "zones": self._get_zone_summary(),
                "creation_time": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error creating topology: {e}")
            raise
    
    def _store_topology(self):
        """Store topology in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Clear existing topology
                cursor.execute('DELETE FROM network_nodes')
                cursor.execute('DELETE FROM network_connections')
                
                # Store nodes
                for node in self.network_nodes:
                    cursor.execute('''
                        INSERT INTO network_nodes (
                            node_id, name, node_type, ip_address, mac_address,
                            os_type, os_version, services, vulnerabilities,
                            security_controls, network_zone, criticality, status, metadata
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        node.node_id, node.name, node.node_type.value, node.ip_address,
                        node.mac_address, node.os_type, node.os_version,
                        json.dumps(node.services), json.dumps(node.vulnerabilities),
                        json.dumps(node.security_controls), node.network_zone,
                        node.criticality, node.status, json.dumps(node.metadata)
                    ))
                
                # Store connections
                for conn_obj in self.network_connections:
                    cursor.execute('''
                        INSERT INTO network_connections (
                            connection_id, source_node, target_node, connection_type,
                            port, protocol, bandwidth, latency, status, firewall_rules
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        conn_obj.connection_id, conn_obj.source_node, conn_obj.target_node,
                        conn_obj.connection_type, conn_obj.port, conn_obj.protocol,
                        conn_obj.bandwidth, conn_obj.latency, conn_obj.status,
                        json.dumps(conn_obj.firewall_rules)
                    ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing topology: {e}")
    
    def run_security_scenario(self, scenario_type: str, target_nodes: List[str] = None,
                            parameters: Dict[str, Any] = None) -> str:
        """Run security testing scenario"""
        try:
            # Auto-select targets if not specified
            if not target_nodes:
                target_nodes = self._auto_select_targets(scenario_type)
            
            # Create scenario
            scenario = self.scenario_engine.create_scenario(scenario_type, target_nodes, parameters)
            
            # Store scenario
            self._store_scenario(scenario)
            self.active_scenarios[scenario.scenario_id] = scenario
            
            # Execute scenario asynchronously
            future = self.executor.submit(self._execute_scenario_async, scenario)
            
            self.logger.info(f"Started scenario {scenario.scenario_id}: {scenario_type}")
            return scenario.scenario_id
            
        except Exception as e:
            self.logger.error(f"Error running scenario: {e}")
            raise
    
    def _auto_select_targets(self, scenario_type: str) -> List[str]:
        """Auto-select appropriate targets for scenario type"""
        target_mapping = {
            "lateral_movement": [NodeType.WORKSTATION, NodeType.SERVER],
            "data_exfiltration": [NodeType.DATABASE, NodeType.SERVER],
            "ddos_simulation": [NodeType.SERVER],
            "phishing_campaign": [NodeType.WORKSTATION]
        }
        
        target_types = target_mapping.get(scenario_type, [NodeType.WORKSTATION])
        
        # Select nodes of appropriate types
        targets = []
        for node in self.network_nodes:
            if node.node_type in target_types and len(targets) < 3:
                targets.append(node.node_id)
        
        return targets
    
    def _execute_scenario_async(self, scenario: SecurityScenario):
        """Execute scenario asynchronously"""
        try:
            results = self.scenario_engine.execute_scenario(scenario, self.network_nodes)
            
            # Store results
            for result in results:
                result.scenario_id = scenario.scenario_id
                self._store_test_result(result)
            
            self.test_results.extend(results)
            
            self.logger.info(f"Completed scenario {scenario.scenario_id}: {len(results)} results")
            
        except Exception as e:
            self.logger.error(f"Error executing scenario {scenario.scenario_id}: {e}")
            scenario.status = "failed"
    
    def _store_scenario(self, scenario: SecurityScenario):
        """Store scenario in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO security_scenarios (
                        scenario_id, name, description, scenario_type, target_nodes,
                        attack_vectors, expected_outcomes, success_criteria,
                        duration_minutes, parameters, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    scenario.scenario_id, scenario.name, scenario.description,
                    scenario.scenario_type, json.dumps(scenario.target_nodes),
                    json.dumps(scenario.attack_vectors), json.dumps(scenario.expected_outcomes),
                    json.dumps(scenario.success_criteria), scenario.duration_minutes,
                    json.dumps(scenario.parameters), scenario.status
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing scenario: {e}")
    
    def _store_test_result(self, result: TestResult):
        """Store test result in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO test_results (
                        result_id, scenario_id, timestamp, test_type, target_node,
                        success, details, findings, recommendations, risk_score
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    result.result_id, result.scenario_id, result.timestamp,
                    result.test_type, result.target_node, result.success,
                    json.dumps(result.details), json.dumps(result.findings),
                    json.dumps(result.recommendations), result.risk_score
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing test result: {e}")
    
    def get_topology_overview(self) -> Dict[str, Any]:
        """Get topology overview"""
        try:
            zone_summary = self._get_zone_summary()
            vulnerability_summary = self._get_vulnerability_summary()
            
            return {
                "total_nodes": len(self.network_nodes),
                "total_connections": len(self.network_connections),
                "zones": zone_summary,
                "node_types": self._get_node_type_summary(),
                "vulnerability_summary": vulnerability_summary,
                "critical_nodes": len([n for n in self.network_nodes if n.criticality == "critical"]),
                "online_nodes": len([n for n in self.network_nodes if n.status == "online"]),
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error getting topology overview: {e}")
            return {}
    
    def _get_zone_summary(self) -> Dict[str, int]:
        """Get summary of nodes by network zone"""
        zones = {}
        for node in self.network_nodes:
            zones[node.network_zone] = zones.get(node.network_zone, 0) + 1
        return zones
    
    def _get_node_type_summary(self) -> Dict[str, int]:
        """Get summary of nodes by type"""
        types = {}
        for node in self.network_nodes:
            type_name = node.node_type.value
            types[type_name] = types.get(type_name, 0) + 1
        return types
    
    def _get_vulnerability_summary(self) -> Dict[str, int]:
        """Get vulnerability summary"""
        severity_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        
        for node in self.network_nodes:
            for vuln in node.vulnerabilities:
                severity = vuln.get("severity", "unknown")
                if severity in severity_counts:
                    severity_counts[severity] += 1
        
        return severity_counts
    
    def get_scenario_status(self, scenario_id: str) -> Dict[str, Any]:
        """Get status of running scenario"""
        if scenario_id not in self.active_scenarios:
            return {"error": "Scenario not found"}
        
        scenario = self.active_scenarios[scenario_id]
        
        # Get results for this scenario
        scenario_results = [r for r in self.test_results if r.scenario_id == scenario_id]
        
        return {
            "scenario_id": scenario_id,
            "name": scenario.name,
            "status": scenario.status,
            "scenario_type": scenario.scenario_type,
            "target_nodes": len(scenario.target_nodes),
            "results_count": len(scenario_results),
            "successful_attacks": len([r for r in scenario_results if r.success]),
            "failed_attacks": len([r for r in scenario_results if not r.success]),
            "average_risk_score": np.mean([r.risk_score for r in scenario_results]) if scenario_results else 0,
            "duration_minutes": scenario.duration_minutes,
            "created_at": scenario.timestamp if hasattr(scenario, 'timestamp') else datetime.now().isoformat()
        }
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get comprehensive dashboard data"""
        try:
            topology_overview = self.get_topology_overview()
            
            # Active scenarios
            active_scenarios = [
                self.get_scenario_status(scenario_id) 
                for scenario_id in self.active_scenarios.keys()
            ]
            
            # Recent test results
            recent_results = sorted(self.test_results, key=lambda x: x.timestamp, reverse=True)[:10]
            
            # Risk assessment
            high_risk_nodes = [
                node for node in self.network_nodes
                if len([v for v in node.vulnerabilities if v.get("severity") in ["high", "critical"]]) > 0
            ]
            
            return {
                "topology_overview": topology_overview,
                "active_scenarios": active_scenarios,
                "recent_results": [
                    {
                        "result_id": r.result_id,
                        "test_type": r.test_type,
                        "success": r.success,
                        "risk_score": r.risk_score,
                        "timestamp": r.timestamp
                    } for r in recent_results
                ],
                "risk_assessment": {
                    "high_risk_nodes": len(high_risk_nodes),
                    "total_vulnerabilities": sum(len(node.vulnerabilities) for node in self.network_nodes),
                    "security_coverage": self._calculate_security_coverage()
                },
                "performance_metrics": {
                    "scenarios_run": len(self.active_scenarios),
                    "tests_executed": len(self.test_results),
                    "success_rate": len([r for r in self.test_results if not r.success]) / len(self.test_results) if self.test_results else 0
                },
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error getting dashboard data: {e}")
            return {}
    
    def _calculate_security_coverage(self) -> float:
        """Calculate security control coverage"""
        if not self.network_nodes:
            return 0.0
        
        nodes_with_controls = len([node for node in self.network_nodes if node.security_controls])
        return nodes_with_controls / len(self.network_nodes)

def main():
    """Main function for testing digital twin"""
    manager = DigitalTwinManager()
    
    print("Digital Twin Security Testing Environment")
    print("=" * 50)
    
    # Create network topology
    print("\n1. Creating Corporate Network Topology...")
    topology_result = manager.create_network_topology("corporate", workstations=10, servers=3)
    print(f"Created topology: {topology_result}")
    
    # Get topology overview
    print("\n2. Topology Overview:")
    overview = manager.get_topology_overview()
    print(json.dumps(overview, indent=2))
    
    # Run security scenario
    print("\n3. Running Lateral Movement Scenario...")
    scenario_id = manager.run_security_scenario("lateral_movement")
    print(f"Started scenario: {scenario_id}")
    
    # Wait for scenario to complete
    time.sleep(5)
    
    # Check scenario status
    print("\n4. Scenario Status:")
    status = manager.get_scenario_status(scenario_id)
    print(json.dumps(status, indent=2))
    
    # Get dashboard data
    print("\n5. Dashboard Summary:")
    dashboard = manager.get_dashboard_data()
    print(json.dumps(dashboard, indent=2))

if __name__ == "__main__":
    main()