# TradeFlow OS - CI/CD Pipeline Guide

## Overview

TradeFlow OS uses GitHub Actions for automated testing, building, and deployment.

**Pipeline Summary:**
```
Code Push → GitHub Actions
  ├── Backend Tests (pytest)
  ├── Frontend Tests & Build (ESLint, TypeScript, Jest)
  ├── Build Docker Images (backend + frontend)
  └── Deploy to Production (if main branch)
```

---

## Workflow Files

All workflows are in `.github/workflows/`:

| File | Trigger | Purpose |
|------|---------|---------|
| `backend-ci.yml` | Push/PR to main, develop | Run 164 backend tests |
| `frontend-ci.yml` | Push/PR to main, develop | ESLint, TypeScript check, Jest tests, build |
| `docker-backend.yml` | Push to main, develop | Build & push backend image to GHCR |
| `docker-frontend.yml` | Push to main, develop | Build & push frontend image to GHCR |
| `deploy-production.yml` | Manual trigger or push to main | SSH deploy to VPS, run migrations |

---

## How Each Workflow Works

### 1. Backend CI (`backend-ci.yml`)

**Trigger:** Push or PR to `main` or `develop` branches (when backend files change)

**Steps:**
1. Checkout code
2. Setup Python 3.12
3. Install dependencies (`pip install -r requirements.txt`)
4. Start PostgreSQL 15 container
5. Wait for database readiness
6. Run tests: `pytest tests/ -v`
7. Upload test results

**Success Criteria:**
- ✅ All 164 tests pass (or 89% if document parsing tests skipped)
- ✅ No Python errors

**If PR to main:**
- Tests MUST pass before PR can be merged (branch protection rule)
- Merge automatically after approval + tests pass

**Time:** ~2-3 minutes

---

### 2. Frontend CI (`frontend-ci.yml`)

**Trigger:** Push or PR to `main` or `develop` branches (when frontend files change)

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Cache `node_modules`
4. Install dependencies: `npm ci`
5. Lint code: `npm run lint`
6. Type check: `npm run type-check`
7. Run tests: `npm run test`
8. Build production bundle: `npm run build`
9. Upload build artifacts

**Success Criteria:**
- ✅ ESLint passes (no linting errors)
- ✅ TypeScript type checking passes
- ✅ Jest tests pass
- ✅ Next.js production build succeeds
- ✅ Next.js output is in standalone mode (required for Docker)

**If PR to main:**
- Tests MUST pass before merge

**Time:** ~3-4 minutes

---

### 3. Docker Backend Build (`docker-backend.yml`)

**Trigger:** Push to `main` or `develop` (when backend files or Dockerfile changes)

**Steps:**
1. Checkout code
2. Setup Docker Buildx (multi-platform builds)
3. Login to GHCR (GitHub Container Registry)
4. Extract metadata (version tags, branches)
5. Build backend image from `backend/Dockerfile`
6. Push to `ghcr.io/YOUR_USERNAME/tradeflow-api`

**Image Tags:**
- `latest` - Always newest on main
- `develop` - Newest on develop branch
- `abc123d` - Commit SHA (specific version)
- `v1.2.3` - Semantic version (if tagged)

**Example:** After push to main:
```
ghcr.io/asifetv/tradeflow-api:latest          ← Latest build
ghcr.io/asifetv/tradeflow-api:main-abc123d    ← This commit
ghcr.io/asifetv/tradeflow-api:v1.0.0         ← If tagged
```

**Requires:** `GITHUB_TOKEN` (automatic, but needs write:packages permission)

**Time:** ~2-3 minutes

---

### 4. Docker Frontend Build (`docker-frontend.yml`)

**Trigger:** Push to `main` or `develop` (when frontend files or Dockerfile changes)

**Steps:**
1. Checkout code
2. Setup Docker Buildx
3. Login to GHCR
4. Build frontend image from `frontend/Dockerfile`
5. Push to `ghcr.io/YOUR_USERNAME/tradeflow-web`

**Critical Requirement:** `frontend/next.config.js` must have `output: 'standalone'`

**Image Size:**
- Without `output: 'standalone'`: 500MB+ (includes all node_modules)
- With `output: 'standalone'`: ~150MB (minimal dependencies only)

**Note:** Already fixed in this deployment setup

**Time:** ~3-4 minutes

---

### 5. Deploy to Production (`deploy-production.yml`)

**Trigger:**
- Push to `main` branch (automatic)
- Manual trigger (Actions tab → Run workflow)

**Prerequisites:**
- All tests passing on main
- Docker images built and pushed to GHCR
- GitHub secrets configured (VPS_HOST, VPS_USER, VPS_SSH_KEY)

**Steps:**
1. SSH into VPS as deploy user
2. Pull latest code: `git pull origin main`
3. Pull Docker images: `docker-compose pull`
4. Start services: `docker-compose up -d`
5. Wait 10 seconds for startup
6. Run migrations: `alembic upgrade head`
7. Health checks (API + Frontend)
8. Display container status
9. Slack notification (optional)

**Post-Deployment Verification:**
- API health: `curl https://api.tradeflow.com/healthz`
- API readiness: `curl https://api.tradeflow.com/readyz`
- Frontend: `curl https://app.tradeflow.com`

**Zero-Downtime:**
- Old containers keep serving requests during pull
- New images start and pass health checks before old ones stop
- Nginx automatically routes to healthy containers

**Time:** ~5-10 minutes total

---

## GitHub Secrets Configuration

### Required Secrets for Deployment

1. **VPS_HOST**
   - Your VPS IP address (e.g., 123.45.67.89)
   - Find in: VPS provider dashboard

2. **VPS_USER**
   - SSH username (e.g., deploy, ubuntu, root)
   - Created during VPS setup

3. **VPS_SSH_KEY**
   - Private SSH key for authentication
   - Format:
     ```
     -----BEGIN RSA PRIVATE KEY-----
     MIIEpAIBAAKCAQEA...
     ...
     -----END RSA PRIVATE KEY-----
     ```
   - Generate with: `ssh-keygen -t rsa -b 4096 -f ~/.ssh/github-deploy`

### Optional Secrets

4. **SLACK_WEBHOOK_URL** (for deployment notifications)
   - Get from Slack: Workspace → Apps → Incoming Webhooks
   - Format: `https://hooks.slack.com/services/T.../B.../...`

### How to Add Secrets

1. Go to GitHub: Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Enter Name and Value
4. Click "Add secret"

**Example:**
```
Name: VPS_HOST
Value: 203.0.113.42
```

---

## Common Workflows

### Scenario 1: Regular Feature Development

```
1. Create feature branch
   git checkout -b feature/document-upload

2. Make changes
   # Edit backend/frontend files

3. Push to GitHub
   git push origin feature/document-upload

4. Tests run automatically
   ✅ Backend tests pass
   ✅ Frontend tests pass
   (Docker images NOT built for feature branches)

5. Create Pull Request
   # Request review

6. Merge when approved
   # Triggers deploy to production
```

### Scenario 2: Fix Production Bug

```
1. Create hotfix branch
   git checkout -b hotfix/critical-bug main

2. Fix bug
   # Small, focused changes

3. Push to GitHub
   git push origin hotfix/critical-bug

4. Create PR to main
   ✅ All tests pass

5. Approve and merge
   # GitHub Actions automatically:
   # 1. Runs full CI
   # 2. Builds Docker images
   # 3. Deploys to production
   # 4. Sends Slack notification

6. Monitor production
   curl https://api.tradeflow.com/healthz
```

### Scenario 3: Manual Deployment

```
1. All code already on main (no new commits)

2. Go to GitHub Actions tab

3. Click "Deploy to Production" workflow

4. Click "Run workflow" button

5. Confirm and wait for deployment
   # Same as automatic deployment
```

### Scenario 4: Rollback to Previous Version

```
1. Find previous working commit
   git log --oneline | head -10

2. Create hotfix branch from that commit
   git checkout -b rollback abc123d  # Old commit

3. Push and create PR
   git push origin rollback

4. Merge to main
   # Automatic deployment with old version

5. Verify health
   curl https://api.tradeflow.com/readyz
```

---

## Monitoring Workflows

### View Workflow Status

1. Go to: GitHub Repository → Actions tab
2. Select workflow (e.g., "Backend Tests")
3. View all runs

### View Detailed Logs

1. Click on workflow run (e.g., "Merged PR #42")
2. Click on job (e.g., "test")
3. Expand step to see logs
4. Search for "error" or "failed"

### Common Log Locations

**Backend Tests Failure:**
```
Backend Tests → test → Run tests → Shows pytest output
```

**Docker Build Failure:**
```
Build & Push Backend Image → build → Build and push → Shows Docker error
```

**Deployment Failure:**
```
Deploy to Production → deploy → Deploy to VPS → Shows SSH error
```

---

## Troubleshooting

### Workflow Doesn't Trigger

**Problem:** Pushed code but workflow not running

**Causes:**
1. File changes don't match workflow path filters
2. Workflow file has syntax error
3. Branch is not main or develop

**Fix:**
```bash
# Check workflow syntax
# Use: https://github.com/rhysd/actionlint

# Or manually verify:
# backend-ci.yml triggers on paths: backend/**
# So pushing to frontend/ won't trigger it

# Trigger manually:
# Actions tab → Backend Tests → Run workflow
```

### Tests Fail

**Backend Tests:**
```
# Check logs for specific error
Actions → Backend Tests → test → Run tests

# Common issues:
# - Database connection timeout → Check PostgreSQL health check
# - Import error → Check requirements.txt updated
# - Assertion fail → Check test logic

# Run tests locally to debug
cd backend
pytest tests/test_auth.py -v
```

**Frontend Tests:**
```
# Common issues:
# - Module not found → npm install locally
# - Type error → npm run type-check locally
# - Build failure → Check next.config.js has output: 'standalone'
```

### Docker Build Fails

```
# Check logs:
# Actions → Docker Backend → build → Build and push

# Common causes:
# - Dockerfile syntax error
# - GHCR login failed → Check GITHUB_TOKEN permissions
# - Image too large → Check output: 'standalone' in next.config.js
```

### Deploy Fails

```
# Check logs:
# Actions → Deploy to Production → deploy → Deploy to VPS

# Common causes:
# - SSH key invalid → Regenerate and update secret
# - VPS_HOST wrong → Verify IP address in secret
# - Migrations failed → Check database health, migration code
# - Images won't pull → Check image names, tags in docker-compose

# SSH into VPS and debug:
ssh deploy@YOUR_VPS_IP
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api
```

---

## Best Practices

### 1. Run Tests Locally First

```bash
# Before pushing
cd backend && pytest tests/
cd ../frontend && npm run test

# If all pass locally, they'll pass in CI
```

### 2. Write Meaningful Commit Messages

```
✅ Good:
feat: Add document upload to deals

✅ Good:
fix: Fix database migration for customer code

❌ Bad:
fix stuff
fixed
update
```

### 3. Create Feature Branches

```bash
# Always develop on branches
git checkout -b feature/your-feature

# Don't push directly to main
git push origin feature/your-feature

# Create PR for review
```

### 4. Monitor Deployments

```bash
# Don't assume deployment succeeded
# Always check health endpoints
curl https://api.tradeflow.com/readyz

# Check logs if anything looks wrong
ssh deploy@YOUR_VPS_IP
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api
```

### 5. Protect Main Branch

**Recommended Branch Protection Rules:**
- Require PR reviews before merge
- Require status checks to pass
- Require branches to be up to date
- Dismiss stale PR approvals
- Require code review from CODEOWNERS

---

## Performance Optimization

### Speed Up Docker Builds

```yaml
# Already optimized in workflows:
- Uses buildx for caching
- Caches dependencies between builds
- Pushes to GitHub Actions Cache automatically

# Result:
# First build: 3 minutes
# Subsequent builds: 1-2 minutes
```

### Speed Up Frontend Tests

```
# Already optimized:
- npm ci (instead of npm install)
- Node modules cached
- Parallel test execution (if configured)

# Time: ~2 minutes
```

### Speed Up Database Tests

```
# Already optimized:
- PostgreSQL runs in service container
- Health checks ensure readiness
- Tests run in parallel (pytest-xdist capable)

# Time: ~2 minutes
```

---

## Advanced: Custom Workflows

If you want to extend CI/CD:

### Example: Run Security Scan

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Snyk security scan
        uses: snyk/actions/python@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Example: Deploy to Staging

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging
on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGING_HOST }}
          # ... deploy to staging VPS
```

---

## Summary

| Phase | Workflow | Trigger | Time | Auto? |
|-------|----------|---------|------|-------|
| **Test** | backend-ci.yml | Push/PR | 2-3m | ✅ |
| **Test** | frontend-ci.yml | Push/PR | 3-4m | ✅ |
| **Build** | docker-backend.yml | Push main | 2-3m | ✅ |
| **Build** | docker-frontend.yml | Push main | 3-4m | ✅ |
| **Deploy** | deploy-production.yml | Push main | 5-10m | ✅ |

**Total Time:** Code push → Production deploy = ~15-20 minutes

---

**Last Updated:** 2026-02-25
**Version:** 1.0
