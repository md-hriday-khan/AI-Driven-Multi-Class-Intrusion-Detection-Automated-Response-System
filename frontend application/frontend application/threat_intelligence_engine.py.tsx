#!/usr/bin/env python3
"""
Real-time Threat Intelligence Engine for SHIELD SOC
Aggregates threat data from multiple sources and provides actionable intelligence
"""

import asyncio
import aiohttp
import json
import sqlite3
import time
import logging
import hashlib
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import numpy as np
import requests
from urllib.parse import urlparse
import ipaddress
import re
import websocket
import xml.etree.ElementTree as ET

@dataclass
class ThreatIndicator:
    """Threat indicator data structure"""
    indicator_id: str
    indicator_type: str  # ip, domain, url, hash, email
    value: str
    confidence: float
    severity: str  # low, medium, high, critical
    first_seen: str
    last_seen: str
    source: str
    tags: List[str]
    context: Dict[str, Any]
    ttl: int  # Time to live in seconds
    reputation_score: float

@dataclass
class ThreatIntelligence:
    """Comprehensive threat intelligence report"""
    intel_id: str
    timestamp: str
    threat_type: str
    threat_family: str
    indicators: List[ThreatIndicator]
    attack_patterns: List[str]
    mitre_tactics: List[str]
    mitre_techniques: List[str]
    geographic_origin: str
    target_sectors: List[str]
    confidence: float
    severity: str
    description: str
    recommendations: List[str]
    related_campaigns: List[str]

@dataclass
class ThreatCampaign:
    """Threat campaign tracking"""
    campaign_id: str
    name: str
    threat_actor: str
    start_date: str
    end_date: Optional[str]
    indicators: List[str]
    targeted_sectors: List[str]
    attack_vectors: List[str]
    confidence: float
    status: str  # active, dormant, concluded

class ThreatFeedManager:
    """Manages multiple threat intelligence feeds"""
    
    def __init__(self):
        self.feeds = {
            'misp': MISPFeedConnector(),
            'taxii': TAXIIFeedConnector(),
            'openai_threat': OpenAIThreatFeed(),
            'virustotal': VirusTotalConnector(),
            'alienvault': AlienVaultOTXConnector(),
            'custom_feeds': CustomFeedManager()
        }
        
        self.indicators_cache = {}
        self.feed_status = {}
        self.update_intervals = {
            'misp': 300,       # 5 minutes
            'taxii': 600,      # 10 minutes
            'openai_threat': 900,  # 15 minutes
            'virustotal': 1800,    # 30 minutes
            'alienvault': 1200,    # 20 minutes
            'custom_feeds': 180    # 3 minutes
        }
        
        self.running = False
        self.update_threads = {}

    async def start_feed_updates(self):
        """Start all threat feed updates"""
        self.running = True
        
        for feed_name, feed_connector in self.feeds.items():
            thread = threading.Thread(
                target=self._feed_update_loop,
                args=(feed_name, feed_connector),
                daemon=True
            )
            thread.start()
            self.update_threads[feed_name] = thread
            
        logging.info("All threat intelligence feeds started")

    def _feed_update_loop(self, feed_name: str, feed_connector):
        """Update loop for individual feed"""
        while self.running:
            try:
                start_time = time.time()
                
                # Update feed
                new_indicators = feed_connector.fetch_indicators()
                
                # Process and store indicators
                for indicator in new_indicators:
                    self._process_indicator(indicator, feed_name)
                
                # Update feed status
                self.feed_status[feed_name] = {
                    'last_update': datetime.now().isoformat(),
                    'indicators_fetched': len(new_indicators),
                    'status': 'healthy',
                    'update_time': time.time() - start_time
                }
                
                logging.info(f"Updated {feed_name}: {len(new_indicators)} indicators")
                
            except Exception as e:
                logging.error(f"Error updating {feed_name}: {e}")
                self.feed_status[feed_name] = {
                    'last_update': datetime.now().isoformat(),
                    'status': 'error',
                    'error': str(e)
                }
            
            # Wait for next update
            time.sleep(self.update_intervals.get(feed_name, 600))

    def _process_indicator(self, indicator: ThreatIndicator, source: str):
        """Process and enrich indicator"""
        # Add source information
        indicator.source = source
        
        # Calculate reputation score
        indicator.reputation_score = self._calculate_reputation_score(indicator)
        
        # Enrich with additional context
        indicator.context = self._enrich_indicator_context(indicator)
        
        # Store in cache
        cache_key = f"{indicator.indicator_type}:{indicator.value}"
        self.indicators_cache[cache_key] = indicator

    def _calculate_reputation_score(self, indicator: ThreatIndicator) -> float:
        """Calculate reputation score based on multiple factors"""
        score = 0.0
        
        # Base score from confidence
        score += indicator.confidence * 0.4
        
        # Severity weighting
        severity_weights = {'low': 0.2, 'medium': 0.5, 'high': 0.8, 'critical': 1.0}
        score += severity_weights.get(indicator.severity, 0.5) * 0.3
        
        # Source reliability
        source_weights = {'misp': 0.9, 'taxii': 0.85, 'virustotal': 0.8, 'alienvault': 0.75}
        score += source_weights.get(indicator.source, 0.6) * 0.3
        
        return min(score, 1.0)

    def _enrich_indicator_context(self, indicator: ThreatIndicator) -> Dict[str, Any]:
        """Enrich indicator with additional context"""
        context = {}
        
        if indicator.indicator_type == 'ip':
            context.update(self._enrich_ip_context(indicator.value))
        elif indicator.indicator_type == 'domain':
            context.update(self._enrich_domain_context(indicator.value))
        elif indicator.indicator_type == 'hash':
            context.update(self._enrich_hash_context(indicator.value))
        
        return context

    def _enrich_ip_context(self, ip: str) -> Dict[str, Any]:
        """Enrich IP address with geolocation and ASN data"""
        try:
            ip_obj = ipaddress.ip_address(ip)
            context = {
                'is_private': ip_obj.is_private,
                'is_multicast': ip_obj.is_multicast,
                'version': ip_obj.version
            }
            
            # Add geolocation (mock implementation)
            context['geolocation'] = {
                'country': 'Unknown',
                'city': 'Unknown',
                'asn': 'Unknown',
                'org': 'Unknown'
            }
            
            return context
        except:
            return {}

    def _enrich_domain_context(self, domain: str) -> Dict[str, Any]:
        """Enrich domain with DNS and WHOIS data"""
        context = {
            'tld': domain.split('.')[-1] if '.' in domain else '',
            'subdomain_count': len(domain.split('.')) - 2,
            'length': len(domain)
        }
        
        # Add domain reputation (mock)
        context['domain_age_days'] = np.random.randint(1, 3650)
        context['alexa_rank'] = np.random.randint(1000, 10000000) if np.random.random() > 0.7 else None
        
        return context

    def _enrich_hash_context(self, hash_value: str) -> Dict[str, Any]:
        """Enrich hash with file type and malware family data"""
        context = {
            'hash_type': self._detect_hash_type(hash_value),
            'length': len(hash_value)
        }
        
        # Add malware family (mock)
        families = ['trojan', 'ransomware', 'backdoor', 'adware', 'spyware']
        context['malware_family'] = np.random.choice(families) if np.random.random() > 0.5 else None
        
        return context

    def _detect_hash_type(self, hash_value: str) -> str:
        """Detect hash algorithm type"""
        length = len(hash_value)
        if length == 32:
            return 'md5'
        elif length == 40:
            return 'sha1'
        elif length == 64:
            return 'sha256'
        elif length == 128:
            return 'sha512'
        else:
            return 'unknown'

    def query_indicator(self, indicator_type: str, value: str) -> Optional[ThreatIndicator]:
        """Query for specific indicator"""
        cache_key = f"{indicator_type}:{value}"
        return self.indicators_cache.get(cache_key)

    def get_feed_status(self) -> Dict[str, Any]:
        """Get status of all feeds"""
        return self.feed_status.copy()

class MISPFeedConnector:
    """MISP threat intelligence platform connector"""
    
    def __init__(self, url: str = None, api_key: str = None):
        self.url = url or "https://misp.example.com"
        self.api_key = api_key or "demo_key"
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

    def fetch_indicators(self) -> List[ThreatIndicator]:
        """Fetch indicators from MISP"""
        # Mock implementation - in production, this would connect to real MISP API
        indicators = []
        
        for i in range(10):
            indicator = ThreatIndicator(
                indicator_id=f"misp_{int(time.time())}_{i}",
                indicator_type=np.random.choice(['ip', 'domain', 'hash']),
                value=self._generate_mock_indicator_value(),
                confidence=np.random.uniform(0.6, 0.95),
                severity=np.random.choice(['medium', 'high', 'critical']),
                first_seen=datetime.now().isoformat(),
                last_seen=datetime.now().isoformat(),
                source='misp',
                tags=['malware', 'apt'],
                context={},
                ttl=3600,
                reputation_score=0.0
            )
            indicators.append(indicator)
        
        return indicators

    def _generate_mock_indicator_value(self) -> str:
        """Generate mock indicator values for testing"""
        indicator_types = ['ip', 'domain', 'hash']
        indicator_type = np.random.choice(indicator_types)
        
        if indicator_type == 'ip':
            return f"{np.random.randint(1, 223)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}"
        elif indicator_type == 'domain':
            domains = ['malicious-site.com', 'evil-domain.net', 'threat-actor.org', 'c2-server.info']
            return np.random.choice(domains)
        else:  # hash
            return hashlib.md5(f"malware_{np.random.randint(1, 1000)}".encode()).hexdigest()

class TAXIIFeedConnector:
    """TAXII 2.1 feed connector"""
    
    def __init__(self, discovery_url: str = None):
        self.discovery_url = discovery_url or "https://taxii.example.com/taxii2/"
        self.collections = []

    def fetch_indicators(self) -> List[ThreatIndicator]:
        """Fetch STIX objects from TAXII server"""
        # Mock implementation
        indicators = []
        
        for i in range(8):
            indicator = ThreatIndicator(
                indicator_id=f"taxii_{int(time.time())}_{i}",
                indicator_type=np.random.choice(['ip', 'domain', 'url']),
                value=self._generate_mock_stix_indicator(),
                confidence=np.random.uniform(0.7, 0.9),
                severity=np.random.choice(['medium', 'high']),
                first_seen=(datetime.now() - timedelta(hours=np.random.randint(1, 48))).isoformat(),
                last_seen=datetime.now().isoformat(),
                source='taxii',
                tags=['stix', 'threat_intel'],
                context={},
                ttl=7200,
                reputation_score=0.0
            )
            indicators.append(indicator)
        
        return indicators

    def _generate_mock_stix_indicator(self) -> str:
        """Generate mock STIX indicators"""
        urls = ['http://malware-c2.com/gate', 'https://phishing-site.net/login', 'http://exploit-kit.org/landing']
        domains = ['suspicious-domain.com', 'threat-intel.net', 'malware-family.org']
        ips = [f"192.168.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}" 
               for _ in range(3)]
        
        return np.random.choice(urls + domains + ips)

class OpenAIThreatFeed:
    """AI-powered threat intelligence feed"""
    
    def fetch_indicators(self) -> List[ThreatIndicator]:
        """Generate AI-driven threat indicators"""
        indicators = []
        
        # Simulate AI-generated threat patterns
        threat_patterns = [
            'DGA_domain_generation',
            'ML_detected_anomaly',
            'AI_behavioral_analysis',
            'LLM_threat_prediction'
        ]
        
        for i, pattern in enumerate(threat_patterns):
            indicator = ThreatIndicator(
                indicator_id=f"ai_threat_{int(time.time())}_{i}",
                indicator_type='behavior',
                value=pattern,
                confidence=np.random.uniform(0.8, 0.95),
                severity=np.random.choice(['high', 'critical']),
                first_seen=datetime.now().isoformat(),
                last_seen=datetime.now().isoformat(),
                source='openai_threat',
                tags=['ai_generated', 'behavioral'],
                context={'detection_method': 'machine_learning'},
                ttl=1800,
                reputation_score=0.0
            )
            indicators.append(indicator)
        
        return indicators

class VirusTotalConnector:
    """VirusTotal API connector"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or "demo_vt_key"
        self.base_url = "https://www.virustotal.com/vtapi/v2"

    def fetch_indicators(self) -> List[ThreatIndicator]:
        """Fetch malicious indicators from VirusTotal"""
        # Mock implementation
        indicators = []
        
        for i in range(12):
            indicator = ThreatIndicator(
                indicator_id=f"vt_{int(time.time())}_{i}",
                indicator_type=np.random.choice(['hash', 'url', 'domain']),
                value=self._generate_mock_vt_indicator(),
                confidence=np.random.uniform(0.75, 0.98),
                severity=np.random.choice(['medium', 'high', 'critical']),
                first_seen=(datetime.now() - timedelta(days=np.random.randint(1, 30))).isoformat(),
                last_seen=datetime.now().isoformat(),
                source='virustotal',
                tags=['malware', 'virustotal'],
                context={'detection_engines': np.random.randint(5, 60)},
                ttl=3600,
                reputation_score=0.0
            )
            indicators.append(indicator)
        
        return indicators

    def _generate_mock_vt_indicator(self) -> str:
        """Generate mock VirusTotal indicators"""
        hashes = [hashlib.sha256(f"malware_{i}".encode()).hexdigest() for i in range(3)]
        urls = ['http://malware.example.com/payload', 'https://phishing.example.net/steal']
        domains = ['malicious.example.org', 'c2.example.info']
        
        return np.random.choice(hashes + urls + domains)

class AlienVaultOTXConnector:
    """AlienVault OTX connector"""
    
    def fetch_indicators(self) -> List[ThreatIndicator]:
        """Fetch indicators from AlienVault OTX"""
        # Mock implementation
        indicators = []
        
        for i in range(15):
            indicator = ThreatIndicator(
                indicator_id=f"otx_{int(time.time())}_{i}",
                indicator_type=np.random.choice(['ip', 'domain', 'hash', 'email']),
                value=self._generate_mock_otx_indicator(),
                confidence=np.random.uniform(0.65, 0.85),
                severity=np.random.choice(['low', 'medium', 'high']),
                first_seen=(datetime.now() - timedelta(hours=np.random.randint(1, 72))).isoformat(),
                last_seen=datetime.now().isoformat(),
                source='alienvault',
                tags=['otx', 'community'],
                context={'pulse_id': f"pulse_{np.random.randint(1000, 9999)}"},
                ttl=1800,
                reputation_score=0.0
            )
            indicators.append(indicator)
        
        return indicators

    def _generate_mock_otx_indicator(self) -> str:
        """Generate mock OTX indicators"""
        types = {
            'ip': lambda: f"{np.random.randint(1, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}",
            'domain': lambda: f"threat-{np.random.randint(1, 1000)}.malicious.com",
            'hash': lambda: hashlib.md5(f"sample_{np.random.randint(1, 1000)}".encode()).hexdigest(),
            'email': lambda: f"attacker{np.random.randint(1, 100)}@malicious.com"
        }
        
        indicator_type = np.random.choice(list(types.keys()))
        return types[indicator_type]()

class CustomFeedManager:
    """Manager for custom threat feeds"""
    
    def __init__(self):
        self.custom_feeds = [
            {'name': 'internal_honeypot', 'url': 'http://localhost:8001/threats'},
            {'name': 'partner_intel', 'url': 'http://localhost:8002/indicators'},
            {'name': 'commercial_feed', 'url': 'http://localhost:8003/api/threats'}
        ]

    def fetch_indicators(self) -> List[ThreatIndicator]:
        """Fetch from custom feeds"""
        indicators = []
        
        for feed in self.custom_feeds:
            try:
                # Mock custom feed data
                for i in range(5):
                    indicator = ThreatIndicator(
                        indicator_id=f"{feed['name']}_{int(time.time())}_{i}",
                        indicator_type=np.random.choice(['ip', 'domain', 'signature']),
                        value=self._generate_custom_indicator(),
                        confidence=np.random.uniform(0.8, 0.95),
                        severity=np.random.choice(['medium', 'high']),
                        first_seen=datetime.now().isoformat(),
                        last_seen=datetime.now().isoformat(),
                        source=feed['name'],
                        tags=['custom', 'internal'],
                        context={'feed_url': feed['url']},
                        ttl=900,
                        reputation_score=0.0
                    )
                    indicators.append(indicator)
            except Exception as e:
                logging.error(f"Error fetching from {feed['name']}: {e}")
        
        return indicators

    def _generate_custom_indicator(self) -> str:
        """Generate custom indicators"""
        return f"custom_threat_{np.random.randint(1, 1000)}"

class ThreatIntelligenceCorrelator:
    """Correlates threat intelligence across multiple sources"""
    
    def __init__(self):
        self.correlation_rules = []
        self.campaigns = {}
        self.actor_profiles = {}

    def correlate_indicators(self, indicators: List[ThreatIndicator]) -> List[ThreatCampaign]:
        """Correlate indicators to identify campaigns"""
        campaigns = []
        
        # Group indicators by similarity
        grouped_indicators = self._group_similar_indicators(indicators)
        
        for group in grouped_indicators:
            if len(group) >= 3:  # Minimum indicators for campaign
                campaign = self._create_campaign_from_indicators(group)
                campaigns.append(campaign)
        
        return campaigns

    def _group_similar_indicators(self, indicators: List[ThreatIndicator]) -> List[List[ThreatIndicator]]:
        """Group similar indicators together"""
        groups = []
        
        # Simple grouping by tags and context similarity
        tag_groups = defaultdict(list)
        
        for indicator in indicators:
            for tag in indicator.tags:
                tag_groups[tag].append(indicator)
        
        # Convert to list of groups
        for tag, group_indicators in tag_groups.items():
            if len(group_indicators) >= 2:
                groups.append(group_indicators)
        
        return groups

    def _create_campaign_from_indicators(self, indicators: List[ThreatIndicator]) -> ThreatCampaign:
        """Create campaign from grouped indicators"""
        campaign_id = f"campaign_{int(time.time())}_{hash(str(indicators)) % 10000}"
        
        # Extract common attributes
        common_tags = set(indicators[0].tags)
        for indicator in indicators[1:]:
            common_tags &= set(indicator.tags)
        
        # Determine threat actor (simplified)
        threat_actor = f"TA-{np.random.randint(1000, 9999)}"
        
        return ThreatCampaign(
            campaign_id=campaign_id,
            name=f"Campaign {campaign_id.split('_')[-1]}",
            threat_actor=threat_actor,
            start_date=min(i.first_seen for i in indicators),
            end_date=None,
            indicators=[i.indicator_id for i in indicators],
            targeted_sectors=['finance', 'healthcare', 'government'],
            attack_vectors=['phishing', 'malware', 'c2'],
            confidence=np.mean([i.confidence for i in indicators]),
            status='active'
        )

class ThreatIntelligenceEngine:
    """Main threat intelligence engine"""
    
    def __init__(self, db_path: str = './data/threat_intelligence.db'):
        self.db_path = db_path
        self.feed_manager = ThreatFeedManager()
        self.correlator = ThreatIntelligenceCorrelator()
        
        # Initialize database
        self._init_database()
        
        # WebSocket for real-time updates
        self.websocket_clients = set()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger('ThreatIntelligenceEngine')

    def _init_database(self):
        """Initialize threat intelligence database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Threat indicators table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS threat_indicators (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        indicator_id TEXT UNIQUE NOT NULL,
                        indicator_type TEXT NOT NULL,
                        value TEXT NOT NULL,
                        confidence REAL,
                        severity TEXT,
                        first_seen TEXT,
                        last_seen TEXT,
                        source TEXT,
                        tags TEXT,
                        context TEXT,
                        ttl INTEGER,
                        reputation_score REAL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Threat campaigns table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS threat_campaigns (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        campaign_id TEXT UNIQUE NOT NULL,
                        name TEXT,
                        threat_actor TEXT,
                        start_date TEXT,
                        end_date TEXT,
                        indicators TEXT,
                        targeted_sectors TEXT,
                        attack_vectors TEXT,
                        confidence REAL,
                        status TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Intelligence reports table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS intelligence_reports (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        intel_id TEXT UNIQUE NOT NULL,
                        timestamp TEXT,
                        threat_type TEXT,
                        threat_family TEXT,
                        indicators TEXT,
                        attack_patterns TEXT,
                        mitre_tactics TEXT,
                        mitre_techniques TEXT,
                        geographic_origin TEXT,
                        target_sectors TEXT,
                        confidence REAL,
                        severity TEXT,
                        description TEXT,
                        recommendations TEXT,
                        related_campaigns TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                conn.commit()
                self.logger.info("Threat intelligence database initialized")
                
        except Exception as e:
            self.logger.error(f"Error initializing database: {e}")

    async def start_engine(self):
        """Start the threat intelligence engine"""
        self.logger.info("Starting Threat Intelligence Engine...")
        
        # Start feed updates
        await self.feed_manager.start_feed_updates()
        
        # Start correlation engine
        asyncio.create_task(self._correlation_loop())
        
        # Start cleanup task
        asyncio.create_task(self._cleanup_expired_indicators())
        
        self.logger.info("Threat Intelligence Engine started successfully")

    async def _correlation_loop(self):
        """Main correlation loop"""
        while True:
            try:
                # Get recent indicators
                indicators = list(self.feed_manager.indicators_cache.values())
                
                # Correlate indicators
                campaigns = self.correlator.correlate_indicators(indicators)
                
                # Store campaigns
                for campaign in campaigns:
                    self._store_campaign(campaign)
                
                # Generate intelligence reports
                reports = self._generate_intelligence_reports(indicators, campaigns)
                
                # Store reports
                for report in reports:
                    self._store_intelligence_report(report)
                
                # Broadcast updates via WebSocket
                await self._broadcast_updates({
                    'type': 'intelligence_update',
                    'indicators_count': len(indicators),
                    'campaigns_count': len(campaigns),
                    'reports_count': len(reports)
                })
                
            except Exception as e:
                self.logger.error(f"Error in correlation loop: {e}")
            
            # Wait before next correlation
            await asyncio.sleep(60)

    def _store_campaign(self, campaign: ThreatCampaign):
        """Store threat campaign in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT OR REPLACE INTO threat_campaigns (
                        campaign_id, name, threat_actor, start_date, end_date,
                        indicators, targeted_sectors, attack_vectors, confidence, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    campaign.campaign_id,
                    campaign.name,
                    campaign.threat_actor,
                    campaign.start_date,
                    campaign.end_date,
                    json.dumps(campaign.indicators),
                    json.dumps(campaign.targeted_sectors),
                    json.dumps(campaign.attack_vectors),
                    campaign.confidence,
                    campaign.status
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing campaign: {e}")

    def _generate_intelligence_reports(self, indicators: List[ThreatIndicator], campaigns: List[ThreatCampaign]) -> List[ThreatIntelligence]:
        """Generate comprehensive intelligence reports"""
        reports = []
        
        # Group indicators by threat type
        threat_groups = defaultdict(list)
        for indicator in indicators:
            if indicator.tags:
                threat_type = indicator.tags[0]  # Use first tag as threat type
                threat_groups[threat_type].append(indicator)
        
        # Generate report for each threat type
        for threat_type, type_indicators in threat_groups.items():
            if len(type_indicators) >= 3:  # Minimum for report
                report = ThreatIntelligence(
                    intel_id=f"intel_{int(time.time())}_{hash(threat_type) % 10000}",
                    timestamp=datetime.now().isoformat(),
                    threat_type=threat_type,
                    threat_family=self._determine_threat_family(type_indicators),
                    indicators=type_indicators,
                    attack_patterns=self._extract_attack_patterns(type_indicators),
                    mitre_tactics=self._map_to_mitre_tactics(type_indicators),
                    mitre_techniques=self._map_to_mitre_techniques(type_indicators),
                    geographic_origin=self._determine_geographic_origin(type_indicators),
                    target_sectors=self._determine_target_sectors(type_indicators),
                    confidence=np.mean([i.confidence for i in type_indicators]),
                    severity=self._determine_overall_severity(type_indicators),
                    description=f"Intelligence report for {threat_type} threat activity",
                    recommendations=self._generate_recommendations(threat_type, type_indicators),
                    related_campaigns=[c.campaign_id for c in campaigns if any(i.indicator_id in c.indicators for i in type_indicators)]
                )
                reports.append(report)
        
        return reports

    def _determine_threat_family(self, indicators: List[ThreatIndicator]) -> str:
        """Determine threat family from indicators"""
        # Analyze tags and context to determine family
        common_tags = set(indicators[0].tags)
        for indicator in indicators[1:]:
            common_tags &= set(indicator.tags)
        
        families = ['apt', 'ransomware', 'banking_trojan', 'botnet', 'phishing']
        return np.random.choice(families)  # Simplified logic

    def _extract_attack_patterns(self, indicators: List[ThreatIndicator]) -> List[str]:
        """Extract attack patterns from indicators"""
        patterns = []
        
        # Analyze indicator types and context
        for indicator in indicators:
            if indicator.indicator_type == 'ip':
                patterns.append('network_communication')
            elif indicator.indicator_type == 'domain':
                patterns.append('dns_resolution')
            elif indicator.indicator_type == 'hash':
                patterns.append('file_execution')
            elif indicator.indicator_type == 'email':
                patterns.append('phishing_campaign')
        
        return list(set(patterns))

    def _map_to_mitre_tactics(self, indicators: List[ThreatIndicator]) -> List[str]:
        """Map indicators to MITRE ATT&CK tactics"""
        tactics = []
        
        # Simple mapping based on indicator types
        type_to_tactics = {
            'ip': ['Command and Control'],
            'domain': ['Command and Control', 'Exfiltration'],
            'hash': ['Execution', 'Persistence'],
            'email': ['Initial Access'],
            'url': ['Initial Access', 'Command and Control']
        }
        
        for indicator in indicators:
            tactics.extend(type_to_tactics.get(indicator.indicator_type, []))
        
        return list(set(tactics))

    def _map_to_mitre_techniques(self, indicators: List[ThreatIndicator]) -> List[str]:
        """Map indicators to MITRE ATT&CK techniques"""
        techniques = []
        
        # Simple mapping
        type_to_techniques = {
            'ip': ['T1071.001'],  # Application Layer Protocol: Web Protocols
            'domain': ['T1071.004'],  # Application Layer Protocol: DNS
            'hash': ['T1204.002'],  # User Execution: Malicious File
            'email': ['T1566.001']  # Phishing: Spearphishing Attachment
        }
        
        for indicator in indicators:
            techniques.extend(type_to_techniques.get(indicator.indicator_type, []))
        
        return list(set(techniques))

    def _determine_geographic_origin(self, indicators: List[ThreatIndicator]) -> str:
        """Determine geographic origin of threat"""
        # Analyze IP geolocation data
        countries = ['Unknown', 'Russia', 'China', 'North Korea', 'Iran', 'Various']
        return np.random.choice(countries)

    def _determine_target_sectors(self, indicators: List[ThreatIndicator]) -> List[str]:
        """Determine targeted industry sectors"""
        sectors = ['finance', 'healthcare', 'government', 'technology', 'energy', 'retail']
        return list(np.random.choice(sectors, size=np.random.randint(1, 4), replace=False))

    def _determine_overall_severity(self, indicators: List[ThreatIndicator]) -> str:
        """Determine overall threat severity"""
        severities = [i.severity for i in indicators]
        severity_weights = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
        
        avg_weight = np.mean([severity_weights[s] for s in severities])
        
        if avg_weight >= 3.5:
            return 'critical'
        elif avg_weight >= 2.5:
            return 'high'
        elif avg_weight >= 1.5:
            return 'medium'
        else:
            return 'low'

    def _generate_recommendations(self, threat_type: str, indicators: List[ThreatIndicator]) -> List[str]:
        """Generate security recommendations"""
        recommendations = []
        
        base_recommendations = {
            'malware': [
                'Deploy advanced endpoint detection and response (EDR)',
                'Implement application whitelisting',
                'Update antivirus signatures',
                'Conduct threat hunting activities'
            ],
            'phishing': [
                'Implement email security gateways',
                'Conduct user awareness training',
                'Deploy DMARC/SPF/DKIM policies',
                'Monitor for domain spoofing'
            ],
            'c2': [
                'Block identified C2 domains and IPs',
                'Monitor network traffic for beaconing',
                'Implement DNS filtering',
                'Deploy network segmentation'
            ]
        }
        
        recommendations.extend(base_recommendations.get(threat_type, [
            'Monitor for identified indicators',
            'Update security controls',
            'Increase monitoring sensitivity'
        ]))
        
        return recommendations

    def _store_intelligence_report(self, report: ThreatIntelligence):
        """Store intelligence report in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT OR REPLACE INTO intelligence_reports (
                        intel_id, timestamp, threat_type, threat_family, indicators,
                        attack_patterns, mitre_tactics, mitre_techniques, geographic_origin,
                        target_sectors, confidence, severity, description, recommendations,
                        related_campaigns
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    report.intel_id,
                    report.timestamp,
                    report.threat_type,
                    report.threat_family,
                    json.dumps([asdict(i) for i in report.indicators]),
                    json.dumps(report.attack_patterns),
                    json.dumps(report.mitre_tactics),
                    json.dumps(report.mitre_techniques),
                    report.geographic_origin,
                    json.dumps(report.target_sectors),
                    report.confidence,
                    report.severity,
                    report.description,
                    json.dumps(report.recommendations),
                    json.dumps(report.related_campaigns)
                ))
                
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing intelligence report: {e}")

    async def _cleanup_expired_indicators(self):
        """Clean up expired threat indicators"""
        while True:
            try:
                current_time = time.time()
                expired_keys = []
                
                for key, indicator in self.feed_manager.indicators_cache.items():
                    # Check if indicator has expired based on TTL
                    created_time = datetime.fromisoformat(indicator.first_seen).timestamp()
                    if current_time - created_time > indicator.ttl:
                        expired_keys.append(key)
                
                # Remove expired indicators
                for key in expired_keys:
                    del self.feed_manager.indicators_cache[key]
                
                if expired_keys:
                    self.logger.info(f"Cleaned up {len(expired_keys)} expired indicators")
                
            except Exception as e:
                self.logger.error(f"Error in cleanup task: {e}")
            
            # Wait 1 hour before next cleanup
            await asyncio.sleep(3600)

    async def _broadcast_updates(self, data: Dict[str, Any]):
        """Broadcast updates to WebSocket clients"""
        if self.websocket_clients:
            message = json.dumps(data)
            for client in self.websocket_clients.copy():
                try:
                    await client.send(message)
                except:
                    self.websocket_clients.discard(client)

    def get_threat_intelligence_summary(self) -> Dict[str, Any]:
        """Get threat intelligence dashboard summary"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get recent indicators count by type
                cursor.execute('''
                    SELECT indicator_type, COUNT(*), AVG(confidence), AVG(reputation_score)
                    FROM threat_indicators 
                    WHERE created_at > datetime('now', '-24 hours')
                    GROUP BY indicator_type
                ''')
                indicators_by_type = cursor.fetchall()
                
                # Get active campaigns
                cursor.execute('''
                    SELECT COUNT(*) FROM threat_campaigns 
                    WHERE status = 'active'
                ''')
                active_campaigns = cursor.fetchone()[0]
                
                # Get recent reports by severity
                cursor.execute('''
                    SELECT severity, COUNT(*) FROM intelligence_reports
                    WHERE created_at > datetime('now', '-24 hours')
                    GROUP BY severity
                ''')
                reports_by_severity = cursor.fetchall()
                
                return {
                    'indicators_by_type': [
                        {
                            'type': row[0],
                            'count': row[1],
                            'avg_confidence': row[2],
                            'avg_reputation': row[3]
                        } for row in indicators_by_type
                    ],
                    'active_campaigns': active_campaigns,
                    'reports_by_severity': [
                        {'severity': row[0], 'count': row[1]}
                        for row in reports_by_severity
                    ],
                    'feed_status': self.feed_manager.get_feed_status(),
                    'total_indicators': len(self.feed_manager.indicators_cache),
                    'last_update': datetime.now().isoformat()
                }
                
        except Exception as e:
            self.logger.error(f"Error getting summary: {e}")
            return {}

    def query_indicators(self, query: Dict[str, Any]) -> List[ThreatIndicator]:
        """Query threat indicators"""
        results = []
        
        indicator_type = query.get('type')
        value = query.get('value')
        severity = query.get('severity')
        source = query.get('source')
        
        for indicator in self.feed_manager.indicators_cache.values():
            match = True
            
            if indicator_type and indicator.indicator_type != indicator_type:
                match = False
            if value and value.lower() not in indicator.value.lower():
                match = False
            if severity and indicator.severity != severity:
                match = False
            if source and indicator.source != source:
                match = False
            
            if match:
                results.append(indicator)
        
        return results[:100]  # Limit results

async def main():
    """Main function for testing"""
    engine = ThreatIntelligenceEngine()
    await engine.start_engine()
    
    # Keep running
    try:
        while True:
            await asyncio.sleep(10)
            summary = engine.get_threat_intelligence_summary()
            print(f"\n--- Threat Intelligence Summary ---")
            print(f"Total Indicators: {summary.get('total_indicators', 0)}")
            print(f"Active Campaigns: {summary.get('active_campaigns', 0)}")
            print(f"Feed Status: {len([f for f in summary.get('feed_status', {}).values() if f.get('status') == 'healthy'])}/{len(summary.get('feed_status', {}))}")
    except KeyboardInterrupt:
        print("\nShutting down Threat Intelligence Engine...")

if __name__ == "__main__":
    asyncio.run(main())