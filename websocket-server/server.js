const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

console.log('SHIELD WebSocket Server starting...');

// Store connected clients
const clients = new Set();

// Mock data generators
const generateThreatData = () => ({
  type: 'threat_update',
  data: {
    threatLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
    activeThreats: Math.floor(Math.random() * 20) + 1,
    location: {
      lat: (Math.random() - 0.5) * 180,
      lng: (Math.random() - 0.5) * 360,
      country: ['USA', 'China', 'Russia', 'Germany', 'UK', 'France'][Math.floor(Math.random() * 6)]
    },
    attackType: ['ddos', 'malware', 'botnet', 'bruteforce', 'exfiltration', 'zeroday'][Math.floor(Math.random() * 6)],
    severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
    confidence: 70 + Math.random() * 30,
    timestamp: Date.now()
  }
});

const generateNetworkData = () => ({
  type: 'network_update',
  data: {
    packetsPerSecond: 2000 + Math.random() * 1000,
    bytesPerSecond: 10 + Math.random() * 15,
    bandwidth: 60 + Math.random() * 35,
    connections: 1000 + Math.random() * 500,
    protocols: {
      http: 40 + Math.random() * 20,
      tcp: 25 + Math.random() * 15,
      udp: 15 + Math.random() * 10,
      dns: 5 + Math.random() * 5,
      ssh: 2 + Math.random() * 3,
      other: 1 + Math.random() * 2
    },
    timestamp: Date.now()
  }
});

const generateSystemData = () => ({
  type: 'system_update',
  data: {
    cpuUsage: 30 + Math.random() * 40,
    memoryUsage: 50 + Math.random() * 30,
    diskUsage: 25 + Math.random() * 20,
    gpuUsage: 60 + Math.random() * 30,
    networkLatency: 5 + Math.random() * 20,
    modelInferenceTime: 30 + Math.random() * 30,
    detectionLatency: 60 + Math.random() * 40,
    temperature: 50 + Math.random() * 25,
    timestamp: Date.now()
  }
});

const generateDetectionData = () => ({
  type: 'detection_update',
  data: {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    attackType: ['DDoS', 'Malware', 'Brute Force', 'Botnet', 'Zero-day', 'Exfiltration'][Math.floor(Math.random() * 6)],
    confidence: 70 + Math.random() * 25,
    source: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    target: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
    status: ['detected', 'investigating', 'mitigated'][Math.floor(Math.random() * 3)],
    timestamp: Date.now()
  }
});

const generateResponseData = () => ({
  type: 'response_update',
  data: {
    actionId: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    action: ['Block IP Address', 'Rate Limiting', 'Isolate Host', 'Deploy Countermeasures'][Math.floor(Math.random() * 4)],
    threatType: ['DDoS', 'Malware', 'Brute Force', 'Botnet'][Math.floor(Math.random() * 4)],
    status: ['initiated', 'in_progress', 'completed', 'failed'][Math.floor(Math.random() * 4)],
    effectiveness: Math.random() * 100,
    duration: Math.random() * 120 + 5,
    autoExecuted: Math.random() > 0.3,
    timestamp: Date.now()
  }
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log(`New client connected from ${req.socket.remoteAddress}`);
  clients.add(ws);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    data: {
      message: 'Connected to SHIELD Security Operations Center WebSocket',
      timestamp: Date.now(),
      clientId: Math.random().toString(36).substr(2, 9)
    }
  }));

  // Handle client messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data);
      
      // Echo back or handle specific commands
      if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          data: { timestamp: Date.now() }
        }));
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast data to all connected clients
const broadcast = (data) => {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Data generation intervals
setInterval(() => {
  if (clients.size > 0) {
    broadcast(generateThreatData());
  }
}, 3000); // Every 3 seconds

setInterval(() => {
  if (clients.size > 0) {
    broadcast(generateNetworkData());
  }
}, 2000); // Every 2 seconds

setInterval(() => {
  if (clients.size > 0) {
    broadcast(generateSystemData());
  }
}, 2500); // Every 2.5 seconds

setInterval(() => {
  if (clients.size > 0 && Math.random() > 0.7) {
    broadcast(generateDetectionData());
  }
}, 4000); // Every 4 seconds, 30% chance

setInterval(() => {
  if (clients.size > 0 && Math.random() > 0.8) {
    broadcast(generateResponseData());
  }
}, 5000); // Every 5 seconds, 20% chance

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      clients: clients.size,
      uptime: process.uptime(),
      timestamp: Date.now()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`SHIELD WebSocket Server listening on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});