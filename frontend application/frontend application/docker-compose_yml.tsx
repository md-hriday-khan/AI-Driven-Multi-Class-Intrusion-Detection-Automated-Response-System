version: '3.8'

services:
  # SHIELD Security Operations Center Frontend
  shield-soc:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: shield-soc-frontend
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
      - WEBSOCKET_URL=ws://websocket-server:8080
    networks:
      - shield-network
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.shield.rule=Host(`shield.local`)"
      - "traefik.http.services.shield.loadbalancer.server.port=80"

  # Simulated WebSocket Server for Real-time Data
  websocket-server:
    image: node:18-alpine
    container_name: shield-websocket-server
    working_dir: /app
    volumes:
      - ./websocket-server:/app
    command: >
      sh -c "
        npm init -y &&
        npm install ws &&
        node server.js
      "
    ports:
      - "8080:8080"
    networks:
      - shield-network
    restart: unless-stopped
    environment:
      - PORT=8080
      - UPDATE_INTERVAL=2000

  # PostgreSQL Database for Enterprise Data Storage
  postgres-db:
    image: postgres:15-alpine
    container_name: shield-postgres-db
    environment:
      - POSTGRES_DB=shield_soc
      - POSTGRES_USER=shield_user
      - POSTGRES_PASSWORD=shield_secure_password
      - POSTGRES_INITDB_ARGS=--auth-host=scram-sha-256
    volumes:
      - shield-postgres-data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
    ports:
      - "5432:5432"
    networks:
      - shield-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U shield_user -d shield_soc"]
      interval: 10s
      timeout: 5s
      retries: 5

  # SQLite for Lightweight Local Storage
  sqlite-db:
    image: alpine:latest
    container_name: shield-sqlite-db
    volumes:
      - shield-data:/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro
    command: >
      sh -c "
        apk add --no-cache sqlite &&
        sqlite3 /data/shield.db < /docker-entrypoint-initdb.d/init.sql &&
        tail -f /dev/null
      "
    networks:
      - shield-network
    restart: unless-stopped

  # Redis for Caching and Session Management
  redis-cache:
    image: redis:7-alpine
    container_name: shield-redis
    ports:
      - "6379:6379"
    volumes:
      - shield-redis-data:/data
    networks:
      - shield-network
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass shield_secure_password

  # Nginx Load Balancer / Reverse Proxy
  nginx-lb:
    image: nginx:alpine
    container_name: shield-nginx-lb
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - shield-network
    restart: unless-stopped
    depends_on:
      - shield-soc

  # Monitoring with Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: shield-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    networks:
      - shield-network
    restart: unless-stopped
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  # Grafana for Visualization
  grafana:
    image: grafana/grafana:latest
    container_name: shield-grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
    networks:
      - shield-network
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=shield_admin_password
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource

  # Log Aggregation with Fluentd
  fluentd:
    image: fluent/fluentd:v1.16-debian-1
    container_name: shield-fluentd
    volumes:
      - ./fluentd/conf:/fluentd/etc:ro
      - shield-logs:/var/log
    networks:
      - shield-network
    restart: unless-stopped
    ports:
      - "24224:24224"
      - "24224:24224/udp"

volumes:
  shield-data:
    driver: local
  shield-postgres-data:
    driver: local
  shield-redis-data:
    driver: local
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
  shield-logs:
    driver: local

networks:
  shield-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16