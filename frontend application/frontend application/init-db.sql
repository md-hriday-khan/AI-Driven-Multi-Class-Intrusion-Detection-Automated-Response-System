-- SHIELD Security Operations Center Database Schema
-- SQLite database initialization script

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Create tables for security event logging
CREATE TABLE IF NOT EXISTS threat_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT UNIQUE NOT NULL,
    timestamp INTEGER NOT NULL,
    threat_type TEXT NOT NULL,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
    confidence REAL CHECK(confidence >= 0 AND confidence <= 100) NOT NULL,
    source_ip TEXT NOT NULL,
    target_ip TEXT,
    attack_vector TEXT,
    payload_size INTEGER,
    geo_location TEXT,
    status TEXT CHECK(status IN ('detected', 'investigating', 'mitigated', 'false_positive')) DEFAULT 'detected',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_threat_events_timestamp ON threat_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_threat_events_threat_type ON threat_events(threat_type);
CREATE INDEX IF NOT EXISTS idx_threat_events_severity ON threat_events(severity);

-- Network traffic logs
CREATE TABLE IF NOT EXISTS network_traffic (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    source_ip TEXT NOT NULL,
    destination_ip TEXT NOT NULL,
    source_port INTEGER,
    destination_port INTEGER,
    protocol TEXT NOT NULL,
    packet_size INTEGER,
    flags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_network_traffic_timestamp ON network_traffic(timestamp);
CREATE INDEX IF NOT EXISTS idx_network_traffic_protocol ON network_traffic(protocol);

-- Response actions log
CREATE TABLE IF NOT EXISTS response_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id TEXT UNIQUE NOT NULL,
    threat_event_id TEXT,
    action_type TEXT NOT NULL,
    status TEXT CHECK(status IN ('initiated', 'in_progress', 'completed', 'failed', 'timeout')) NOT NULL,
    effectiveness REAL CHECK(effectiveness >= 0 AND effectiveness <= 100),
    execution_time REAL, -- in seconds
    auto_executed BOOLEAN DEFAULT FALSE,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (threat_event_id) REFERENCES threat_events(event_id)
);

CREATE INDEX IF NOT EXISTS idx_response_actions_timestamp ON response_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_response_actions_status ON response_actions(status);

-- System performance metrics
CREATE TABLE IF NOT EXISTS system_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    cpu_usage REAL CHECK(cpu_usage >= 0 AND cpu_usage <= 100),
    memory_usage REAL CHECK(memory_usage >= 0 AND memory_usage <= 100),
    disk_usage REAL CHECK(disk_usage >= 0 AND disk_usage <= 100),
    gpu_usage REAL CHECK(gpu_usage >= 0 AND gpu_usage <= 100),
    network_latency REAL,
    model_inference_time REAL,
    detection_latency REAL,
    temperature REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);

-- AI model performance
CREATE TABLE IF NOT EXISTS model_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT NOT NULL,
    version TEXT NOT NULL,
    accuracy REAL CHECK(accuracy >= 0 AND accuracy <= 100),
    precision_score REAL CHECK(precision_score >= 0 AND precision_score <= 100),
    recall REAL CHECK(recall >= 0 AND recall <= 100),
    f1_score REAL CHECK(f1_score >= 0 AND f1_score <= 100),
    false_positive_rate REAL CHECK(false_positive_rate >= 0 AND false_positive_rate <= 100),
    training_time REAL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User activity logs
CREATE TABLE IF NOT EXISTS user_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity(created_at);

-- Configuration settings
CREATE TABLE IF NOT EXISTS configuration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT OR IGNORE INTO configuration (key, value, description) VALUES
    ('threat_detection_enabled', 'true', 'Enable/disable threat detection system'),
    ('auto_response_enabled', 'true', 'Enable/disable automated response actions'),
    ('confidence_threshold', '0.8', 'Minimum confidence score for threat detection'),
    ('max_response_time', '30', 'Maximum response time in seconds'),
    ('log_retention_days', '30', 'Number of days to retain logs'),
    ('websocket_enabled', 'true', 'Enable/disable WebSocket real-time updates');

-- Insert sample data for testing
INSERT OR IGNORE INTO threat_events (event_id, timestamp, threat_type, severity, confidence, source_ip, target_ip, attack_vector, geo_location, status)
VALUES 
    ('evt_001', strftime('%s', 'now'), 'ddos', 'high', 94.2, '203.0.113.1', '192.168.1.100', 'HTTP Flood', 'US', 'mitigated'),
    ('evt_002', strftime('%s', 'now') - 3600, 'malware', 'critical', 97.8, '203.0.113.2', '192.168.1.101', 'Trojan', 'CN', 'mitigated'),
    ('evt_003', strftime('%s', 'now') - 7200, 'bruteforce', 'medium', 87.3, '203.0.113.3', '192.168.1.102', 'SSH Login', 'RU', 'investigating');

INSERT OR IGNORE INTO response_actions (action_id, threat_event_id, action_type, status, effectiveness, execution_time, auto_executed, details)
VALUES 
    ('act_001', 'evt_001', 'Block IP Address', 'completed', 98.5, 2.3, TRUE, 'Successfully blocked malicious IP addresses'),
    ('act_002', 'evt_002', 'Isolate Host', 'completed', 95.2, 12.7, TRUE, 'Host quarantined and cleaned'),
    ('act_003', 'evt_003', 'Rate Limiting', 'in_progress', NULL, NULL, TRUE, 'Applying rate limiting rules');

-- Create views for common queries
CREATE VIEW IF NOT EXISTS threat_summary AS
SELECT 
    threat_type,
    severity,
    COUNT(*) as total_events,
    AVG(confidence) as avg_confidence,
    COUNT(CASE WHEN status = 'mitigated' THEN 1 END) as mitigated_count
FROM threat_events 
WHERE timestamp > strftime('%s', 'now') - 86400  -- Last 24 hours
GROUP BY threat_type, severity;

CREATE VIEW IF NOT EXISTS response_effectiveness AS
SELECT 
    action_type,
    COUNT(*) as total_actions,
    AVG(effectiveness) as avg_effectiveness,
    AVG(execution_time) as avg_execution_time,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as success_rate
FROM response_actions
GROUP BY action_type;

-- Triggers for updating timestamps
CREATE TRIGGER IF NOT EXISTS update_threat_events_timestamp
    AFTER UPDATE ON threat_events
BEGIN
    UPDATE threat_events SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_configuration_timestamp
    AFTER UPDATE ON configuration
BEGIN
    UPDATE configuration SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create a cleanup procedure (simulated with a view since SQLite doesn't have stored procedures)
CREATE VIEW IF NOT EXISTS cleanup_old_data AS
SELECT 
    'DELETE FROM threat_events WHERE created_at < date("now", "-30 days")' as cleanup_threats,
    'DELETE FROM network_traffic WHERE created_at < date("now", "-7 days")' as cleanup_network,
    'DELETE FROM system_metrics WHERE created_at < date("now", "-14 days")' as cleanup_metrics;