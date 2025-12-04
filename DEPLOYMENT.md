# Deployment Guide for TrakrLog

This guide will help you deploy the TrakrLog application to a VPS using Docker, Docker Compose, and Caddy.

## Prerequisites

- A VPS with Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed on the VPS
- A domain name pointing to your VPS IP address
- Google OAuth credentials configured

## Quick Start

### 1. Install Docker and Docker Compose on your VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (optional, to run docker without sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 2. Clone the repository on your VPS

```bash
git clone https://github.com/yourusername/trakrlog.git
cd trakrlog
```

### 3. Configure environment variables

```bash
# Copy the example env file
cp .env.example .env

# Edit the .env file with your actual values
nano .env
```

Update the following variables:
- `DOMAIN`: Your domain name (e.g., `trakrlog.com` or `api.trakrlog.com`)
- `MONGODB_URL`: MongoDB connection string
  - For local container: `mongodb://admin:your_password@mongo:27017`
  - For MongoDB Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/`
  - For other external MongoDB: Use your provider's connection string
- `MONGODB_DATABASE`: Database name (default: `trakrlog`)
- `MONGODB_PASSWORD`: MongoDB root password (only needed for local container)
- `SESSION_SECRET`: Generate with `openssl rand -hex 32`
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `GOOGLE_CALLBACK_URL`: `https://yourdomain.com/auth/google/callback`

### 4. Choose MongoDB Deployment Option

**Option A: Use MongoDB Atlas (Recommended for Production)**

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string (looks like `mongodb+srv://...`)
4. Set `MONGODB_URL` to your Atlas connection string in `.env`
5. Deploy without local MongoDB:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

**Option B: Use Local MongoDB Container**

1. Set `MONGODB_URL=mongodb://admin:yourpassword@mongo:27017` in `.env`
2. Set `MONGODB_PASSWORD=yourpassword` in `.env`
3. Deploy with local MongoDB:
   ```bash
   docker compose -f docker-compose.prod.yml --profile local-db up -d
   ```

### 5. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://yourdomain.com/auth/google/callback` (production)
   - `http://localhost:4000/auth/google/callback` (local development)

### 6. Build and deploy

```bash
# Build and start all services (with external MongoDB like Atlas)
docker compose -f docker-compose.prod.yml up -d --build

# OR: Build and start with local MongoDB container
docker compose -f docker-compose.prod.yml --profile local-db up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check service status
docker compose -f docker-compose.prod.yml ps
```

### 7. Verify deployment

- Visit `https://yourdomain.com` - should show your frontend
## Architecture

**With External MongoDB (e.g., Atlas):**
```
┌─────────────────┐
│   Internet      │
└────────┬────────┘
         │
    ┌────▼────┐
    │  Caddy  │ :80, :443 (Reverse Proxy + SSL)
    └────┬────┘
         │
    ┌────▼────┐                    ┌──────────────┐
    │   App   │ :4000 ────────────►│ MongoDB Atlas│
    └─────────┘                    │  (External)  │
                                   └──────────────┘
```

**With Local MongoDB Container:**
```
┌─────────────────┐
│   Internet      │
└────────┬────────┘
         │
    ┌────▼────┐
    │  Caddy  │ :80, :443 (Reverse Proxy + SSL)
    └────┬────┘
         │
    ┌────▼────┐
    │   App   │ :4000 (Go Backend + React Frontend - Internal Only)
    └────┬────┘
         │
    ┌────▼────┐
    │ MongoDB │ :27017 (Database - Internal Only)
    └─────────┘
```

## Services

### MongoDB (Optional - use --profile local-db)
- Internal port: 27017 (when using local container)
- Data persisted in Docker volume: `mongo_data`
- Credentials configured via environment variables
- **Alternative**: Use MongoDB Atlas or any external MongoDB service
- Internal port: 27017
- Data persisted in Docker volume: `mongo_data`
- Credentials configured via environment variables

### App (Go Backend + React Frontend)
- Internal port: 4000 (not exposed externally)
- Serves both API and frontend static files
- Automatically serves frontend from `/frontend/dist`
- Health check endpoint: `/api/health`
- Only accessible via Caddy reverse proxy

### Caddy
- Ports: 80 (HTTP), 443 (HTTPS)
- Automatically provisions SSL certificates via Let's Encrypt
- Reverse proxy to the app service
- Gzip compression enabled
- Security headers configured

## Useful Commands

```bash
# View logs for all services
docker compose -f docker-compose.prod.yml logs -f

# View logs for specific service
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f mongo
docker compose -f docker-compose.prod.yml logs -f caddy

# Restart a specific service
docker compose -f docker-compose.prod.yml restart app

# Stop all services
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (WARNING: deletes database data)
docker compose -f docker-compose.prod.yml down -v

# Rebuild and restart after code changes
docker compose -f docker-compose.prod.yml up -d --build

# Execute commands in a running container
docker compose -f docker-compose.prod.yml exec app sh
docker compose -f docker-compose.prod.yml exec mongo mongosh

# View resource usage
docker stats
```

## Backup MongoDB

```bash
# Extract credentials from MONGODB_URL for backup commands
# Example: MONGODB_URL=mongodb://user:pass@mongo:27017
# Extract username and password from your .env file

# Create backup
docker compose -f docker-compose.prod.yml exec mongo mongodump \
  --uri="$MONGODB_URL" \
  --db=$MONGODB_DATABASE \
  --out=/tmp/backup

# Copy backup from container to host
docker compose -f docker-compose.prod.yml cp mongo:/tmp/backup ./backup

# Restore backup
docker compose -f docker-compose.prod.yml exec -T mongo mongorestore \
  --uri="$MONGODB_URL" \
  --db=$MONGODB_DATABASE \
  /tmp/backup/$MONGODB_DATABASE
```

## SSL Certificates

Caddy automatically provisions SSL certificates from Let's Encrypt. Make sure:
1. Your domain DNS is pointing to your VPS IP
2. Ports 80 and 443 are open in your firewall
3. The `DOMAIN` environment variable is set correctly

## Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Monitoring

### Health Checks

The application includes health checks:
- App: `http://localhost:4000/api/health` (internal only, within Docker network)
- MongoDB: Automatic ping check
- External: `https://yourdomain.com/health` (via Caddy)

### Resource Monitoring

```bash
# Monitor container resources
docker stats

# Monitor disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

## Troubleshooting

### App won't start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs app

# Common issues:
# 1. Missing environment variables - check .env file
# 2. MongoDB not ready - wait for health check
# 3. Port already in use - check with: sudo lsof -i :4000
```

### SSL certificate issues
```bash
# Check Caddy logs
docker compose -f docker-compose.prod.yml logs caddy

# Common issues:
# 1. DNS not propagated - wait 24-48 hours
# 2. Ports not open - check firewall
# 3. Domain typo - verify DOMAIN env var
```

### MongoDB connection issues
```bash
# Test MongoDB connection
docker compose -f docker-compose.prod.yml exec mongo mongosh "$MONGODB_URL"

# Check if MongoDB is healthy
docker compose -f docker-compose.prod.yml ps
```

### Frontend not loading
```bash
# Verify frontend was built
docker compose -f docker-compose.prod.yml exec app ls -la frontend/dist

# Rebuild if necessary
docker compose -f docker-compose.prod.yml up -d --build app
```

## Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Or restart specific service
docker compose -f docker-compose.prod.yml up -d --build app
```

## Security Best Practices

1. **Use strong passwords** in MONGODB_URL connection string
2. **Keep SESSION_SECRET secure** and rotate periodically
3. **Enable firewall** and only open necessary ports (80, 443, 22)
4. **Don't expose app port** - The app runs on port 4000 internally and is only accessible via Caddy reverse proxy
5. **Regular updates**: Keep Docker and OS updated
6. **Monitor logs** for suspicious activity
7. **Backup regularly** - automate MongoDB backups
8. **Use environment variables** - never commit secrets to git
9. **Limit Docker socket access** - don't expose Docker API

## Performance Optimization

1. **Enable CDN** for static assets
2. **Configure MongoDB indexes** for frequently queried fields
3. **Adjust Docker resources** if needed:
   ```yaml
   services:
     app:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
   ```
4. **Monitor and optimize** slow queries
5. **Use connection pooling** (already configured in Go)

## Support

For issues and questions:
- GitHub Issues: [your-repo-issues-url]
- Documentation: [your-docs-url]
