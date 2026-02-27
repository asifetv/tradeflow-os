# TradeFlow OS - Deployment Flow & Architecture

**Current Status:** 🟢 Live on AWS EC2 (44.222.94.206)
**Deployment Method:** GitHub Actions CI/CD → Docker Images → EC2

---

## Complete Deployment Pipeline

### Step 1: You Make a Code Change
```
Local Machine:
  1. Edit code (e.g., fix bug in deal.py, update component)
  2. git add .
  3. git commit -m "Fix: describe the change"
  4. git push origin main
```

### Step 2: GitHub Actions Automatically Triggers
```
GitHub automatically detects push to main branch:

├─ Workflow 1: Backend Tests (backend-ci.yml)
│  ├─ Checkout code
│  ├─ Setup Python 3.12
│  ├─ Install requirements.txt
│  ├─ Start PostgreSQL service
│  └─ Run: pytest tests/ -v
│     └─ ✅ All 164 tests PASS (or ❌ FAIL → blocks deployment)
│
├─ Workflow 2: Frontend Tests (frontend-ci.yml)
│  ├─ Checkout code
│  ├─ Setup Node.js 20
│  ├─ Install npm dependencies
│  ├─ Run: npm run lint (ESLint)
│  ├─ Run: npm run type-check (TypeScript)
│  ├─ Run: npm run test (Jest)
│  └─ Run: npm run build (Next.js production)
│     └─ ✅ All checks PASS (or ❌ FAIL → blocks deployment)
│
├─ Workflow 3: Build & Push Backend Docker
│  ├─ Build Dockerfile (backend/)
│  ├─ Tag image: ghcr.io/asifetv/tradeflow-api:latest
│  ├─ Tag image: ghcr.io/asifetv/tradeflow-api:main-abc123def (commit SHA)
│  └─ Push to GitHub Container Registry (GHCR)
│     └─ ✅ Image available for deployment
│
└─ Workflow 4: Build & Push Frontend Docker
   ├─ Build Dockerfile (frontend/)
   ├─ Tag image: ghcr.io/asifetv/tradeflow-web:latest
   ├─ Tag image: ghcr.io/asifetv/tradeflow-web:main-abc123def (commit SHA)
   └─ Push to GitHub Container Registry (GHCR)
      └─ ✅ Image available for deployment
```

### Step 3: ALL Tests Must PASS to Deploy
```
If ANY workflow fails (❌):
  └─ Deployment is BLOCKED
     └─ GitHub Actions shows red X
     └─ You must fix the issue, commit, and push again

If ALL workflows pass (✅):
  └─ Docker images are ready
  └─ EC2 can pull latest images
  └─ Deployment workflow triggers (workflow_run event)
```

### Step 4: Deploy to EC2 (Currently Manual)
```
CURRENT FLOW (Manual):
  1. GitHub Actions deploy-production.yml workflow triggers
  2. It displays deployment instructions
  3. You manually SSH into EC2:

     ssh -i your-key.pem ec2-user@44.222.94.206
     cd /opt/tradeflow-os
     git pull origin main
     docker compose pull
     docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
     docker compose exec api alembic upgrade head
     docker compose ps

IMPROVED FLOW (Can be automated):
  1. GitHub Actions automatically SSHes into EC2
  2. Pulls latest Docker images
  3. Stops old containers
  4. Starts new containers
  5. Runs database migrations
  6. Verifies health checks
  7. Sends success notification (optional)
```

---

## Current Architecture

```
Your Local Machine
        ↓ (git push)
        ↓
GitHub Repository (main branch)
        ↓ (Webhook triggers workflows)
        ↓
GitHub Actions Runners (Ubuntu VMs)
  ├─ Backend Tests (pytest)
  ├─ Frontend Tests (Next.js)
  ├─ Docker Build Backend → ghcr.io/asifetv/tradeflow-api:latest
  └─ Docker Build Frontend → ghcr.io/asifetv/tradeflow-web:latest
        ↓ (If all PASS)
        ↓
GitHub Container Registry (GHCR)
  ├─ ghcr.io/asifetv/tradeflow-api:latest
  ├─ ghcr.io/asifetv/tradeflow-api:main-abc123def
  ├─ ghcr.io/asifetv/tradeflow-web:latest
  └─ ghcr.io/asifetv/tradeflow-web:main-abc123def
        ↓ (Manual SSH or Automated)
        ↓
AWS EC2 Instance (44.222.94.206)
  ├─ /opt/tradeflow-os (cloned repo)
  ├─ docker compose (pulls latest images from GHCR)
  ├─ PostgreSQL (postgres_data_prod volume)
  ├─ MinIO (minio_data_prod volume)
  ├─ API Service (port 8000)
  ├─ Frontend Service (port 3000)
  └─ Nginx Reverse Proxy (ports 80, 443)
        ↓
        ↓
End Users Access
  └─ http://44.222.94.206:3000 (Frontend)
  └─ http://44.222.94.206:8000/docs (API Docs)
  └─ (Or custom domain with SSL when configured)
```

---

## What Each Workflow Does

### 1️⃣ Backend Tests (`backend-ci.yml`)

**Triggers:** Every push to main/develop, every PR, manual trigger

**Duration:** ~45 seconds

**What It Tests:**
- 164 pytest tests covering:
  - Authentication & multi-tenancy
  - Deal CRUD operations
  - Customer management
  - Quotes & Purchase Orders
  - Vendor management
  - Document uploads & AI extraction
  - All state machine transitions
  - Activity logging

**Environment Variables Provided:**
- DATABASE_URL: postgresql+asyncpg://postgres:postgres@localhost:5432/test_db
- JWT_SECRET_KEY: test-secret-key-do-not-use-in-production
- ANTHROPIC_API_KEY: sk-test-key-for-ci-only
- APP_ENV: test

**Success Criteria:** All 164 tests PASS
**Failure Action:** Blocks docker builds and deployment

---

### 2️⃣ Frontend Tests (`frontend-ci.yml`)

**Triggers:** Every push to main/develop, every PR, manual trigger

**Duration:** ~3-5 minutes

**What It Tests:**

1. **ESLint (Linting)**
   - Code style consistency
   - Finds potential bugs
   - Enforces best practices

2. **TypeScript Type Check**
   - Validates all type annotations
   - Catches type mismatches
   - Ensures type safety

3. **Jest Unit Tests**
   - 17+ component tests
   - Validation schema tests
   - Utility function tests
   - React Testing Library checks

4. **Next.js Production Build**
   - Builds entire production bundle
   - Optimizes images, CSS, JavaScript
   - Ensures build succeeds
   - Creates standalone output for Docker

**Success Criteria:** All checks PASS, build completes
**Failure Action:** Blocks docker builds and deployment

---

### 3️⃣ Build & Push Backend Docker (`docker-backend.yml`)

**Triggers:** Every push to main/develop (ONLY if backend-ci.yml passes)

**Duration:** ~2-3 minutes

**What It Does:**
1. Builds Dockerfile from backend/
2. Runs multi-stage build:
   - Stage 1: Python 3.12 + dependencies
   - Stage 2: Minimal production image
3. Tags with:
   - `latest` (always points to newest)
   - `main-abc123def` (specific commit SHA)
4. Logs into ghcr.io (GitHub Container Registry)
5. Pushes both tags
6. Images available for EC2 to pull

**Image Details:**
- **Base:** python:3.12-slim
- **Size:** ~500MB
- **Includes:** FastAPI, SQLAlchemy, Anthropic SDK, all dependencies
- **Location:** ghcr.io/asifetv/tradeflow-api

---

### 4️⃣ Build & Push Frontend Docker (`docker-frontend.yml`)

**Triggers:** Every push to main/develop (ONLY if frontend-ci.yml passes)

**Duration:** ~2-3 minutes

**What It Does:**
1. Builds Dockerfile from frontend/
2. Runs multi-stage build:
   - Stage 1: Node 20 + build (npm run build)
   - Stage 2: Minimal production image with standalone output
3. Tags with:
   - `latest` (always points to newest)
   - `main-abc123def` (specific commit SHA)
4. Logs into ghcr.io
5. Pushes both tags
6. Images available for EC2 to pull

**Image Details:**
- **Base:** node:20-alpine (with Next.js standalone)
- **Size:** ~150MB (optimized with standalone mode)
- **Includes:** Next.js production server, optimized bundles
- **Location:** ghcr.io/asifetv/tradeflow-web

---

### 5️⃣ Deploy to Production (`deploy-production.yml`)

**Triggers:**
- Manual: Click "Run workflow" in GitHub Actions
- Automatic: After all 4 workflows complete successfully

**Current Status:** Shows deployment instructions (semi-manual)

**What It Can Do:**
1. SSH into EC2
2. Pull latest code: `git pull origin main`
3. Pull latest Docker images: `docker compose pull`
4. Restart services: `docker compose up -d`
5. Run database migrations: `docker compose exec api alembic upgrade head`
6. Verify health checks
7. Send success/failure notification

---

## How Deployments Work - Step by Step

### Example: You Fix a Bug in the Backend

```
1. Local:
   $ git checkout -b fix/deal-calculation
   $ nano backend/app/services/deal.py  (fix the calculation)
   $ git add backend/app/services/deal.py
   $ git commit -m "fix: Correct deal margin calculation"
   $ git push origin main

2. GitHub receives the push
   → Webhook triggers GitHub Actions

3. Backend Tests workflow starts:
   ├─ Python 3.12 installed
   ├─ PostgreSQL service started
   ├─ Dependencies installed
   ├─ pytest runs all 164 tests
   │  ├─ Your fix includes new test in test_deal.py
   │  ├─ Existing tests still pass
   │  └─ ✅ All 164 PASS
   └─ Job completes successfully

4. Frontend Tests workflow starts (parallel):
   ├─ Node 20 installed
   ├─ npm dependencies installed
   ├─ ESLint checks
   ├─ TypeScript checks
   ├─ Jest tests
   ├─ Next.js build
   └─ ✅ All PASS

5. Docker Backend workflow starts:
   ├─ Builds backend/Dockerfile
   ├─ Creates image with your fix
   ├─ Tags: ghcr.io/asifetv/tradeflow-api:latest
   ├─ Tags: ghcr.io/asifetv/tradeflow-api:main-abc123def
   ├─ Pushes to GHCR
   └─ ✅ Complete

6. Docker Frontend workflow runs:
   ├─ Builds frontend/Dockerfile
   ├─ Pushes to GHCR
   └─ ✅ Complete

7. GitHub Actions shows: ✅ All workflows PASSED

8. Deploy workflow notices all 4 workflows passed:
   └─ Displays deployment instructions OR auto-deploys

9. EC2 receives new code:
   ├─ git pull origin main (gets your fix)
   ├─ docker compose pull (pulls latest images from GHCR)
   ├─ docker compose up -d (restarts services with new images)
   ├─ docker compose exec api alembic upgrade head (runs any migrations)
   └─ ✅ Your fix is live!

10. Verify the fix:
    ├─ Open http://44.222.94.206:3000
    ├─ Test the deal calculation
    └─ ✅ Works correctly!
```

---

## Key Points

### ✅ What Gets Deployed Automatically
- Code changes from main branch
- Docker images (when tests pass)
- Database migrations (when EC2 is updated)

### ❌ What Blocks Deployment
- Any failing test (backend or frontend)
- TypeScript errors
- ESLint errors
- Docker build failures
- GitHub Actions will show ❌ red X

### 🔐 Security
- Tests must pass before Docker builds
- Docker builds must succeed before deployment
- GitHub secrets protect EC2 credentials
- Environment variables loaded from .env.production on EC2

### ⚡ Workflow Timing
- Backend tests: ~45 seconds
- Frontend tests: ~3-5 minutes
- Docker builds: ~2-3 minutes each (4-6 min total)
- **Total time from push to deployed:** ~10-15 minutes

### 🎯 Best Practices
1. Always test locally before pushing
2. Run `npm run build` locally before pushing frontend
3. Run `pytest tests/` locally before pushing backend
4. Write tests for new features
5. Keep commits focused on one change

---

## Docker Images & Versioning

### Image Locations

```
Backend API:
  - ghcr.io/asifetv/tradeflow-api:latest         (newest)
  - ghcr.io/asifetv/tradeflow-api:main-abc123def (specific commit)

Frontend Web:
  - ghcr.io/asifetv/tradeflow-web:latest         (newest)
  - ghcr.io/asifetv/tradeflow-web:main-abc123def (specific commit)
```

### Tag Meanings

```
:latest     = Always points to the newest build
            = Used for production deployments
            = Updates every push to main

:main-abc123def = Specific git commit (commit SHA)
                = Used for rollbacks
                = Pinned version (never changes)
```

### EC2 docker-compose.yml

```yaml
api:
  image: ghcr.io/asifetv/tradeflow-api:latest
  # ↑ Always pulls newest image when you run:
  # docker compose pull

frontend:
  image: ghcr.io/asifetv/tradeflow-web:latest
  # ↑ Always pulls newest image
```

When you run `docker compose pull` on EC2, it checks GHCR and downloads the newest `latest` image.

---

## Current EC2 Deployment Status

**Instance:** AWS t2.micro (free tier)
**IP:** 44.222.94.206
**OS:** Amazon Linux 2
**Location:** /opt/tradeflow-os

**Running Services:**
```bash
$ docker compose ps

NAME                     IMAGE                                    STATUS
tradeflow-postgres       postgres:15                             Up 3 hours
tradeflow-minio          minio/minio:latest                      Up 3 hours
tradeflow-api            ghcr.io/asifetv/tradeflow-api:latest    Up 2 hours
tradeflow-web            ghcr.io/asifetv/tradeflow-web:latest    Up 2 hours
tradeflow-nginx          nginx:alpine                            Up 3 hours
```

**Latest Deployment:** 2026-02-26
**Docker Images Version:** Latest from main branch

---

## Next Steps

### Option 1: Enable Automatic SSH Deployment (Recommended)
Would you like me to enable automatic EC2 deployment? This would:
- Automatically SSH into EC2 on successful tests
- Pull latest code and Docker images
- Restart services with zero downtime
- Run migrations
- Send deployment status notifications

Requires setting 3 GitHub Secrets:
- `VPS_HOST`: 44.222.94.206
- `VPS_USER`: ec2-user
- `VPS_SSH_KEY`: Your EC2 SSH private key

### Option 2: Keep Manual Deployment
Deploy manually when ready using deploy-production.yml instructions.

### Option 3: Monitor Current Deployments
Watch GitHub Actions → Deploy to Production tab for deployment status.

---

**Last Updated:** 2026-02-27
**Status:** 🟢 Live and operational
