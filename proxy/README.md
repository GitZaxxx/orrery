# AGY Command Center Proxy Pod

This pod handles network routing, load balancing, SSL termination, and security for the AGY Command Center system.

## Components
- **Reverse Proxy**: NGINX or Envoy for traffic routing
- **Load Balancer**: Distributes requests across multiple instances
- **SSL Terminator**: Handles HTTPS encryption/decryption
- **API Gateway**: Routes requests to appropriate backend services
- **Security Layer**: Authentication, rate limiting, threat detection
- **Service Mesh**: Manages inter-service communication

## Features Provided
- **Request Routing**: Path-based and subdomain-based routing
- **SSL/TLS Termination**: Secure HTTPS endpoints
- **Load Balancing**: Round-robin, least-connections, and IP-hash algorithms
- **Rate Limiting**: Per-client and per-endpoint request limits
- **Authentication**: JWT validation, API key checking
- **Logging and Monitoring**: Request/response logging, metrics collection
- **Circuit Breaking**: Prevents cascade failures
- **Retry Logic**: Automatic retries for failed requests
- **Health Checks**: Backend service health monitoring

## Technology Stack
- NGINX Plus/NGINX: Reverse proxy and load balancing
- Envoy Proxy: Advanced service mesh capabilities (alternative)
- Certbot: SSL certificate management
- Lua/OpenResty: Custom logic and scripting
- Prometheus/Grafana: Metrics collection and visualization
- Fail2Ban: Intrusion prevention
- Podman: Containerized deployment

## Configuration
Configuration files are stored in the `src/` directory:
- `nginx.conf`: Main NGINX configuration
- `conf.d/`: Site-specific configurations
- `ssl/`: SSL certificates and keys
- `lua/`: Custom Lua scripts for advanced logic

## Running the Proxy Pod
```bash
# Build the container
podman build -t agy-proxy:latest .

# Run the container
podman run -d \
  -p 80:80 -p 443:443 \
  -v $(pwd)/src:/etc/nginx/conf.z:z \
  -v $(pwd)/certs:/etc/nginx/certs:z \
  -v $(pwd)/logs:/var/log/nginx:z \
  --name agy-proxy \
  agy-proxy:latest
```

## Environment Variables
- `PROXY_PORT_HTTP`: HTTP port (default: 80)
- `PROXY_PORT_HTTPS`: HTTPS port (default: 443)
- `SSL_CERT_PATH`: Path to SSL certificate
- `SSL_KEY_PATH`: Path to SSL private key
- `BACKEND_DASHBOARD_URL`: URL for dashboard service
- `BACKEND_INFERENCE_URL`: URL for inference service
- `RATE_LIMIT_REQUESTS`: Requests per minute limit
- `ALLOWED_IPS`: Comma-separated list of allowed IP addresses

## Development and Testing
```bash
# Test configuration
nginx -t

# Reload configuration
nginx -s reload

# View logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Test endpoints
curl -I http://localhost/
curl -k https://localhost/health
```
