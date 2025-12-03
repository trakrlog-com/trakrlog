# VPS Deployment Guide (Hetzner)

This guide explains how to deploy trakrlog to a Hetzner VPS using Docker and GitHub Container Registry.

## Overview

The deployment workflow:
1. **GitHub Actions** builds the Docker image on every push to `main`
2. **Image is pushed** to GitHub Container Registry (ghcr.io)
3. **VPS pulls** the latest image and runs it with docker-compose

## Prerequisites

- Hetzner VPS (or any Linux VPS)
- Domain name pointed to your VPS IP
- Docker and Docker Compose installed on VPS

## 1. Initial VPS Setup

### SSH into your VPS
```bash
ssh root@your-server-ip
```

### Install Docker
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### Create deployment directory
```bash
mkdir -p /opt/trakrlog
cd /opt/trakrlog
```

## 2. Configure GitHub Container Registry Access

### Make image public (easiest option)
1. Go to https://github.com/orgs/trakrlog-com/packages
2. Find your `trakrlog` package
3. Click "Package settings"
4. Scroll to "Danger Zone"
5. Click "Change visibility" → "Public"

### OR authenticate with GitHub (for private images)
```bash
# Create a Personal Access Token (PAT) with 'read:packages' scope
# Then login to ghcr.io
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

## 3. Deploy Configuration Files

### Create docker-compose.prod.yml on VPS
```bash
nano docker-compose.prod.yml
```

Copy your production docker-compose.prod.yml content (it's already configured to use ghcr.io).

### Create .env file
```bash
nano .env
```

Add your production environment variables:
```env
# MongoDB Configuration
MONGODB_PASSWORD=YOUR_STRONG_MONGODB_PASSWORD
MONGODB_URL=mongodb://admin:YOUR_STRONG_MONGODB_PASSWORD@mongo:27017
MONGODB_DATABASE=trakrlog

# Session Configuration
SESSION_SECRET=YOUR_RANDOM_SECRET_KEY_HERE

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
```

**Important:** Generate strong secrets:
```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Generate MONGODB_PASSWORD
openssl rand -base64 24
```

### Create Caddyfile
```bash
nano Caddyfile
```

Copy your Caddyfile content and **update the domain**:
```
yourdomain.com {
    # ... rest of configuration
}
```

## 4. Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" > "Credentials"
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   - `https://yourdomain.com/auth/google/callback`
5. Add authorized JavaScript origins:
   - `https://yourdomain.com`

## 5. Deploy the Application

### Pull and start containers
```bash
cd /opt/trakrlog

# Pull latest image
docker compose -f docker-compose.prod.yml pull

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Verify deployment
```bash
# Check app health
curl http://localhost:4000/api/health

# Check if Caddy is serving
curl https://yourdomain.com
```

## 6. Continuous Deployment

Every time you push to `main` branch:
1. GitHub Actions builds a new Docker image
2. Image is pushed to ghcr.io with tag `latest`
3. On your VPS, update with:

```bash
cd /opt/trakrlog
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Automate updates (optional)

Create a webhook receiver or use a simple update script:

```bash
nano /opt/trakrlog/update.sh
```

```bash
#!/bin/bash
cd /opt/trakrlog
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker image prune -f
```

```bash
chmod +x /opt/trakrlog/update.sh
```

Then create a cron job or webhook to trigger it.

## 7. Monitoring and Maintenance

### View logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f mongo
docker compose -f docker-compose.prod.yml logs -f caddy
```

### Restart services
```bash
docker compose -f docker-compose.prod.yml restart
```

### Stop services
```bash
docker compose -f docker-compose.prod.yml down
```

### Backup MongoDB
```bash
docker compose -f docker-compose.prod.yml exec mongo mongodump \
  --username admin \
  --password YOUR_MONGODB_PASSWORD \
  --authenticationDatabase admin \
  --out /data/backup

# Copy backup to host
docker cp $(docker compose -f docker-compose.prod.yml ps -q mongo):/data/backup ./backup
```

### Clean up old images
```bash
docker image prune -a -f
```

## 8. Firewall Configuration

```bash
# Install UFW
apt install ufw -y

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp

# Enable firewall
ufw enable
ufw status
```

## 9. SSL/TLS

Caddy automatically handles SSL certificates via Let's Encrypt. Make sure:
- Your domain DNS points to your VPS IP
- Ports 80 and 443 are open
- Caddyfile has your correct domain name

Caddy will automatically obtain and renew certificates.

## Troubleshooting

### Image pull fails
```bash
# Check if you're logged in (for private images)
docker login ghcr.io

# Manually pull to see detailed error
docker pull ghcr.io/trakrlog-com/trakrlog:latest
```

### App won't start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs app

# Check if MongoDB is healthy
docker compose -f docker-compose.prod.yml ps
```

### Caddy SSL issues
```bash
# Check Caddy logs
docker compose -f docker-compose.prod.yml logs caddy

# Verify DNS is pointing to your server
dig yourdomain.com

# Test if port 443 is accessible
curl -v https://yourdomain.com
```

### MongoDB connection issues
```bash
# Verify MongoDB is running
docker compose -f docker-compose.prod.yml exec mongo mongosh \
  --username admin \
  --password YOUR_MONGODB_PASSWORD \
  --authenticationDatabase admin

# Check connection from app
docker compose -f docker-compose.prod.yml exec app sh
# Inside container:
wget -q -O- http://localhost:4000/api/health
```

## Quick Reference

```bash
# Deploy/Update
cd /opt/trakrlog
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Status
docker compose -f docker-compose.prod.yml ps

# Logs
docker compose -f docker-compose.prod.yml logs -f

# Restart
docker compose -f docker-compose.prod.yml restart

# Stop
docker compose -f docker-compose.prod.yml down

# Clean up
docker image prune -f
```
