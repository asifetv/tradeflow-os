# M0 Verification Checklist

Complete these steps in order to verify M0 (Foundation) is properly set up.

## Phase 1: ✅ Prerequisites (COMPLETED)

- [x] Git installed: `git version 2.39.3`
- [x] Python 3.12 installed: `python3 --version`
- [x] Node.js v22 installed: `node --version`
- [x] npm 10.9 installed: `npm --version`
- [ ] Docker installed and running: `docker --version`
- [ ] Docker Compose installed: `docker compose version`

### Action: Install Docker

If you haven't already, install Docker Desktop from: https://www.docker.com/products/docker-desktop

After installation, verify:
```bash
docker --version
docker compose version
docker run hello-world  # Should print hello message
```

---

## Phase 2: File Structure Verification

Verify the project structure matches M0 requirements:

```bash
cd /Users/asifetv/tradeflow-os

# Check backend structure
test -d backend/app/models && echo "✓ backend/app/models" || echo "✗ MISSING: backend/app/models"
test -d backend/app/schemas && echo "✓ backend/app/schemas" || echo "✗ MISSING: backend/app/schemas"
test -d backend/app/api && echo "✓ backend/app/api" || echo "✗ MISSING: backend/app/api"
test -d backend/app/services && echo "✓ backend/app/services" || echo "✗ MISSING: backend/app/services"
test -d backend/alembic && echo "✓ backend/alembic" || echo "✗ MISSING: backend/alembic"

# Check files
test -f backend/requirements.txt && echo "✓ backend/requirements.txt" || echo "✗ MISSING: backend/requirements.txt"
test -f backend/app/main.py && echo "✓ backend/app/main.py" || echo "✗ MISSING: backend/app/main.py"
test -f frontend/package.json && echo "✓ frontend/package.json" || echo "✗ MISSING: frontend/package.json"
test -f docker-compose.yml && echo "✓ docker-compose.yml" || echo "✗ MISSING: docker-compose.yml"
test -f Makefile && echo "✓ Makefile" || echo "✗ MISSING: Makefile"
```

---

## Phase 3: Git Repository Verification

Verify Git is properly configured:

```bash
cd /Users/asifetv/tradeflow-os

# Check remote
git remote -v  # Should show origin -> github.com/asifetv/tradeflow-os.git

# Check commit history
git log --oneline -3

# Check branch
git branch -a  # Should show main branch

# Check status
git status  # Should be "nothing to commit, working tree clean"
```

**Expected output:**
```
origin	git@github.com:asifetv/tradeflow-os.git (fetch)
origin	git@github.com:asifetv/tradeflow-os.git (push)
d6fef76 feat: M0 - Foundation - Project setup with Docker, FastAPI, Next.js
* main
nothing to commit, working tree clean
```

---

## Phase 4: Backend Configuration Verification

Verify backend configuration files are correct:

```bash
cd backend

# Check Python version requirement
cat pyproject.toml | grep "requires-python"  # Should be >= 3.12

# Check key dependencies exist in requirements
grep "fastapi" requirements.txt
grep "sqlalchemy" requirements.txt
grep "pydantic" requirements.txt
grep "anthropic" requirements.txt
grep "celery" requirements.txt

# Check config.py loads
python3 -c "from app.config import settings; print(f'✓ Config loads successfully'); print(f'  APP_ENV={settings.APP_ENV}')"
```

**Expected output:**
```
✓ Config loads successfully
  APP_ENV=development
```

---

## Phase 5: Docker Compose File Verification

Verify Docker Compose configuration is valid:

```bash
cd /Users/asifetv/tradeflow-os

# Validate docker-compose syntax
docker compose config > /dev/null && echo "✓ docker-compose.yml is valid" || echo "✗ Invalid docker-compose.yml"

# Check all required services are defined
docker compose config | grep "services:" -A 50 | grep "^  [a-z]"
```

**Expected services:**
- postgres (PostgreSQL 16 + pgvector)
- redis (Redis 7)
- minio (MinIO object storage)
- api (FastAPI)
- celery-worker (Celery worker)
- celery-beat (Celery scheduler)
- frontend (Next.js)

---

## Phase 6: Build Docker Images

Build all Docker images (this may take 5-10 minutes):

```bash
cd /Users/asifetv/tradeflow-os

# Build backend image
docker compose build api

# Build frontend image (optional, will auto-build on compose up)
docker compose build frontend

# List built images
docker images | grep tradeflow
```

**Expected output:**
```
REPOSITORY                    TAG       IMAGE ID
tradeflow-os-api             latest    [ID]
tradeflow-os-frontend        latest    [ID]
```

---

## Phase 7: Start Services (First Time)

Start all services for the first time:

```bash
cd /Users/asifetv/tradeflow-os

# Start services (runs in foreground, ctrl+c to stop)
docker compose up

# OR run in background (recommended)
docker compose up -d
```

**Expected startup sequence (watch logs):**
1. PostgreSQL initializes + pgvector extension
2. Redis starts
3. MinIO starts
4. FastAPI starts (should see "Uvicorn running on 0.0.0.0:8000")
5. Next.js starts (should see "Ready in X seconds")

---

## Phase 8: Service Health Checks

Verify all services are running and healthy:

```bash
# Check running containers
docker compose ps

# Check service health
docker compose logs postgres | head -20
docker compose logs redis | head -10
docker compose logs minio | head -10
docker compose logs api | tail -20
docker compose logs frontend | tail -20
```

**Expected output for `docker compose ps`:**
```
NAME                    STATUS                      PORTS
tradeflow-postgres      Up (healthy)                5432/tcp
tradeflow-redis         Up (healthy)                6379/tcp
tradeflow-minio         Up (healthy)                9000-9001/tcp
tradeflow-api           Up (healthy)                8000/tcp
tradeflow-frontend      Up                          3000/tcp
```

---

## Phase 9: API Health Checks

Test FastAPI is responding:

```bash
# Health check endpoint
curl -s http://localhost:8000/healthz | jq .
# Expected: {"status":"ok"}

# Readiness check
curl -s http://localhost:8000/readyz | jq .
# Expected: {"status":"ready"}

# OpenAPI schema
curl -s http://localhost:8000/openapi.json | jq .paths | head -20
```

---

## Phase 10: Access Services

Open these in your browser to verify everything is running:

1. **Frontend**: http://localhost:3000
   - Should display "TradeFlow OS" title
   - Should show "M0 - Foundation (Project setup in progress)"

2. **API Documentation**: http://localhost:8000/docs
   - Should show Swagger UI
   - Should list endpoints (only `/healthz` and `/readyz` for M0)

3. **API ReDoc**: http://localhost:8000/redoc
   - Alternative API documentation view

4. **MinIO Console**: http://localhost:9001
   - Username: `minioadmin`
   - Password: `minioadmin`
   - Should see empty `documents` bucket

---

## Phase 11: Database Verification

Verify PostgreSQL is set up correctly:

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U tradeflow -d tradeflow -c "\dt"

# Check pgvector extension is enabled
docker compose exec postgres psql -U tradeflow -d tradeflow -c "SELECT * FROM pg_extension WHERE extname='vector';"

# Check UUID extension
docker compose exec postgres psql -U tradeflow -d tradeflow -c "SELECT * FROM pg_extension WHERE extname='uuid-ossp';"
```

**Expected output:**
```
 extname | extversion | extnamespace | extowner | extrelocatable | extversion
---------+------------+--------------+----------+----------------+------------
 vector  | 0.5.0      |           11 |        1 | f              |
 uuid-ossp |          | ...
```

---

## Phase 12: Redis Verification

Verify Redis is working:

```bash
# Check Redis is responsive
docker compose exec redis redis-cli ping
# Expected: PONG

# Check memory usage
docker compose exec redis redis-cli INFO memory | grep used_memory_human
```

---

## Phase 13: Makefile Commands Verification

Verify Makefile commands work:

```bash
cd /Users/asifetv/tradeflow-os

# Show help
make help  # Should list all commands

# View logs
docker compose logs api | tail -10

# Stop services
docker compose down

# Start again
make dev
```

---

## Phase 14: Git Push Verification

Verify latest changes are pushed to GitHub:

```bash
cd /Users/asifetv/tradeflow-os

git log --oneline -1  # Get latest commit hash

# View on GitHub
# Go to: https://github.com/asifetv/tradeflow-os/commits/main
# Latest commit should be: "feat: M0 - Foundation - Project setup..."
```

---

## Summary Checklist

- [ ] Docker and Docker Compose installed
- [ ] File structure verified (all directories and files present)
- [ ] Git repository connected to GitHub
- [ ] Backend configuration loads correctly
- [ ] docker-compose.yml is valid
- [ ] All Docker images built successfully
- [ ] All services running and healthy
- [ ] API health checks passing (http://localhost:8000/healthz)
- [ ] Frontend accessible (http://localhost:3000)
- [ ] API docs available (http://localhost:8000/docs)
- [ ] MinIO console accessible (http://localhost:9001)
- [ ] PostgreSQL + pgvector verified
- [ ] Redis verified
- [ ] Makefile commands working
- [ ] Latest changes pushed to GitHub

---

## M0 Complete! ✅

If all checks pass, **M0 (Foundation) is successfully set up**.

Next steps:
1. Review `tradeflow-build-plan-python.pdf` Section 3 (M0 User Stories)
2. Prepare for M1 (Deal Hub) implementation
3. Set up GitHub Actions CI/CD pipeline (optional)

---

For any issues, check:
- `docker compose logs [service-name]` for detailed logs
- `docker compose ps` to verify service status
- `.env` configuration is correct
- Port conflicts (3000, 8000, 5432, 6379, 9000, 9001)
