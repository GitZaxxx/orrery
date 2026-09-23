# AGY Command Center Shared Components

This directory contains shared components, libraries, and documentation used across all pods in the AGY Command Center system.

## Contents
- **common-libs/**: Shared libraries and utility functions
- **api-specs/**: OpenAPI/Swagger specifications for inter-pod communication
- **data-schemas/**: JSON schemas for data validation
- **monitoring/**: Shared monitoring and logging configurations
- **security/**: Shared security policies and certificates
- **docs/**: Cross-pod documentation and architecture diagrams
- **scripts/**: Deployment and maintenance scripts

## Inter-Pod Communication

### 1. REST APIs
All pods expose RESTful APIs for synchronous communication:
- Dashboard → Inference: UI actions triggering AI processing
- Inference → Dashboard: Results and metrics updates
- Proxy → All: Health checks and routing decisions
- All → Shared: Configuration and status updates

### 2. WebSocket Connections
For real-time updates:
- Dashboard ←→ Inference: Live token streaming and metrics
- Dashboard → Proxy: Connection statistics and alerts
- Inference → Shared: Model performance metrics

### 3. Message Queues
For asynchronous processing:
- Redis Pub/Sub: Event broadcasting
- Redis Streams: Ordered event processing
- Message Topics: 
  - `agy.metrics`: Telemetry and performance data
  - `agy.events`: System events and alerts
  - `agy.commands`: Control instructions
  - `agy.responses`: Results and outcomes

### 4. Shared Volumes
Certain data is shared via volume mounts:
- Model files: Inference pod ←→ Shared storage
- Logs: All pods ←→ Centralized logging
- Config: Shared configuration files
- Cache: Distributed caching layer

## Security Model
- **Zero Trust**: Each pod authenticates and authorizes every request
- **Mutual TLS**: Service-to-service encryption where required
- **Secrets Management**: Sensitive data stored in secure vaults
- **Network Policies**: Restrictive inter-pod communication rules
- **Audit Logging**: Comprehensive logging of all access attempts

## Monitoring and Observability
- **Distributed Tracing**: OpenTelemetry for request tracing
- **Metrics Collection**: Prometheus-compatible metrics endpoints
- **Log Aggregation**: Centralized logging with structured format
- **Health Checks**: Liveness and readiness probes for all services
- **Alerting**: Automated notifications for system anomalies

## Deployment Architecture
```
[ External Users ] 
         ↓ (HTTPS)
[ Proxy Pod ] ←→ [ Dashboard Pod ]
         ↓ (HTTP/gRPC)
[ Inference Pod ] ←→ [ Shared Services ]
         ↓
[ External Services ] (APIs, databases, etc.)
```

## Common Dependencies
All pods share these base dependencies:
- Base Linux distribution (Ubuntu/Debian or similar)
- Core utilities (curl, git, bash, etc.)
- Logging framework (structured JSON logging)
- Health check endpoints
- Metrics exposition (/metrics endpoint)
- Graceful shutdown handling

## Development Guidelines
1. **API Versioning**: All APIs are versioned (v1, v2, etc.)
2. **Backward Compatibility**: Breaking changes require version bumps
3. **Error Handling**: Consistent error response formats
4. **Logging Standards**: Structured logs with trace IDs
5. **Security**: Input validation, output encoding, least privilege
6. **Performance**: Latency targets, throughput benchmarks
7. **Observability**: Adequate logging, metrics, and tracing

## Deployment Instructions
See individual pod READMEs for specific deployment instructions.

To deploy all pods together using podman pods:
```bash
# Create a pod
podman pod create --name agy-pod -p 80:80 -p 443:443 -p 3000:3000 -p 8000:8000

# Add containers to the pod
podman run --pod agy-pod --name agy-dashboard -d agy-dashboard:latest
podman run --pod agy-pod --name agy-inference -d agy-inference:latest
podman run --pod agy-pod --name agy-proxy -d agy-proxy:latest

# Or use docker-compose/podman-compose for orchestration
```
