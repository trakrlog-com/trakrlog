# Local Testing Guide

This guide shows you how to test the entire application locally using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Google OAuth credentials (optional, for auth testing)

## Quick Start

### 1. Configure Local Environment

```bash
# The .env.local file is already set up with sensible defaults
# You only need to update Google OAuth credentials if you want to test authentication

# Edit .env.local
nano .env.local
```

Update only if testing Google OAuth:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Important**: Add `http://localhost:4000/auth/google/callback` to your Google OAuth authorized redirect URIs.

### 2. Build and Run

```bash
# Build and start all services
docker compose -f docker-compose.local.yml --env-file .env.local up --build

# Or run in detached mode (background)
docker compose -f docker-compose.local.yml --env-file .env.local up -d --build
```

### 3. Access the Application

- **Frontend**: http://localhost:4000
- **API Health**: http://localhost:4000/api/health
- **MongoDB**: localhost:27017 (for database clients like MongoDB Compass)

### 4. View Logs

```bash
# All services
docker compose -f docker-compose.local.yml logs -f

# Specific service
docker compose -f docker-compose.local.yml logs -f app
docker compose -f docker-compose.local.yml logs -f mongo
```

### 5. Stop Services

```bash
# Stop services
docker compose -f docker-compose.local.yml down

# Stop and remove volumes (clean database)
docker compose -f docker-compose.local.yml down -v
```

## Local vs Production

| Feature | Local (`docker-compose.local.yml`) | Production (`docker-compose.prod.yml`) |
|---------|-----------------------------------|----------------------------------------|
| Ports | App exposed on 4000, MongoDB on 27017 | Only Caddy on 80/443 |
| SSL | No SSL | Automatic SSL via Caddy |
| Reverse Proxy | No (direct access) | Yes (Caddy) |
| Environment | Development | Production |
| Data Persistence | `mongo_data_local` volume | `mongo_data` volume |
| Security | Relaxed for testing | Hardened |

## Development Workflow

### Making Changes

When you change code:

```bash
# Rebuild and restart app service
docker compose -f docker-compose.local.yml --env-file .env.local up -d --build app

# View updated logs
docker compose -f docker-compose.local.yml logs -f app
```

### Database Access

Connect to MongoDB using any client:
- **Host**: localhost
- **Port**: 27017
- **Username**: admin
- **Password**: localpassword
- **Database**: trakrlog

Or use the CLI:
```bash
docker compose -f docker-compose.local.yml exec mongo mongosh -u admin -p localpassword
```

### Execute Commands in Containers

```bash
# Access app container shell
docker compose -f docker-compose.local.yml exec app sh

# Access MongoDB shell
docker compose -f docker-compose.local.yml exec mongo mongosh -u admin -p localpassword
```

## Troubleshooting

### Port Already in Use

If port 4000 or 27017 is already in use:

```bash
# Check what's using the port
sudo lsof -i :4000
sudo lsof -i :27017

# Kill the process or change the port in docker-compose.local.yml
```

### Frontend Not Building

```bash
# Check if node_modules exists in frontend folder
ls frontend/node_modules

# Clear Docker build cache and rebuild
docker compose -f docker-compose.local.yml build --no-cache app
```

### MongoDB Connection Failed

```bash
# Check if MongoDB is healthy
docker compose -f docker-compose.local.yml ps

# Verify MongoDB logs
docker compose -f docker-compose.local.yml logs mongo

# Wait a few seconds for MongoDB to initialize
```

### Google OAuth Not Working

1. Verify your Google OAuth credentials in `.env.local`
2. Make sure `http://localhost:4000/auth/google/callback` is in your authorized redirect URIs
3. Clear browser cookies and try again

## Testing Without OAuth

If you want to test without setting up Google OAuth:

1. Comment out the auth routes in your testing
2. Or add a test endpoint that bypasses authentication for local development
3. Focus on testing API endpoints with the API key authentication (`/api/track/*`)

## Clean Slate

To completely reset your local environment:

```bash
# Stop everything and remove all data
docker compose -f docker-compose.local.yml down -v

# Remove all Docker build cache
docker system prune -a

# Rebuild from scratch
docker compose -f docker-compose.local.yml --env-file .env.local up --build
```

## Performance

If the build is slow:

1. **Use BuildKit** (faster builds):
   ```bash
   DOCKER_BUILDKIT=1 docker compose -f docker-compose.local.yml build
   ```

2. **Limit resources**: Add to `docker-compose.local.yml`:
   ```yaml
   services:
     app:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
   ```

## Next Steps

Once everything works locally:
1. Push your changes to git
2. Deploy to VPS using `docker-compose.prod.yml`
3. Follow the `DEPLOYMENT.md` guide for production setup
