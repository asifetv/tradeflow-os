# Testing Automatic Deployment

**Status:** Deployment test triggered! 🚀
**Test Commit:** `4f1bbd3` - test: Trigger automatic deployment pipeline
**Time Started:** Now!

---

## Watch the Deployment Pipeline

### Step 1: Go to GitHub Actions

**Click this link:**
```
https://github.com/asifetv/tradeflow-os/actions
```

Or manually:
1. Go to: https://github.com/asifetv/tradeflow-os
2. Click **Actions** tab (top navigation)

You should see a workflow in progress!

---

### Step 2: Watch Each Workflow Complete

You'll see workflows run in this order:

#### 1️⃣ **Backend Tests** (running now)
- Duration: ~45 seconds
- What it does: Runs 164 pytest tests
- Status: Should show green ✅
- Look for: "164 passed" in the logs

#### 2️⃣ **Frontend Tests & Build** (starts after backend)
- Duration: ~3-5 minutes
- What it does: ESLint, TypeScript, Jest, Next.js build
- Status: Should show green ✅
- Look for: All checks pass, build completes

#### 3️⃣ **Build & Push Backend Docker** (starts after frontend)
- Duration: ~2-3 minutes
- What it does: Builds API Docker image, pushes to GHCR
- Status: Should show green ✅
- Look for: "Successfully pushed image"

#### 4️⃣ **Build & Push Frontend Docker** (parallel with backend)
- Duration: ~2-3 minutes
- What it does: Builds web Docker image, pushes to GHCR
- Status: Should show green ✅
- Look for: "Successfully pushed image"

#### 5️⃣ **🎯 Deploy to Production** (starts after docker builds)
- Duration: ~2-3 minutes
- What it does: SSHes into EC2, deploys code
- Status: Should show green ✅
- Look for: Success messages + deployment complete

---

## Expected Workflow Output

### ✅ Success Indicators

**In the Deploy to Production logs, you should see:**

```
🚀 Starting deployment on EC2...
📍 Current directory: ...

📥 Pulling latest code from GitHub...
   [new commit hash]

🐳 Pulling latest Docker images...
   tradeflow-api: Pulling digest...
   tradeflow-web: Pulling digest...

♻️  Restarting services with new images...
   Creating tradeflow-postgres ... done
   Creating tradeflow-minio ... done
   Creating tradeflow-api ... done
   Creating tradeflow-web ... done

⏳ Waiting for services to start...

🗄️  Running database migrations...
   INFO [alembic.runtime.migration] Context impl PostgreSQLImpl.
   INFO [alembic.runtime.migration] Will assume transactional DDL is supported
   INFO [alembic.runtime.migration] Running upgrade...

✅ Deployment complete! Running services:
   tradeflow-postgres ✓
   tradeflow-minio ✓
   tradeflow-api ✓
   tradeflow-web ✓

🏥 Verifying health endpoints...
   {"status":"ok"}

✅ API is responding!

🎉 Deployment successful!
```

---

## Total Time Expected

| Phase | Duration |
|-------|----------|
| Backend Tests | ~45 sec |
| Frontend Tests | ~3-5 min |
| Docker Builds | ~4-6 min |
| **Deploy to EC2** | **~2-3 min** |
| **TOTAL** | **~10-15 min** |

---

## What Changed on EC2

After deployment completes:

### 1. Code Updated
```bash
# EC2 now has latest code
cd /opt/tradeflow-os
git log --oneline -1
# Should show: 4f1bbd3 test: Trigger automatic deployment pipeline
```

### 2. Docker Images Updated
```bash
# EC2 pulled newest images
docker compose images
# Should show latest images from GHCR
```

### 3. Services Restarted
```bash
# All services running fresh
docker compose ps
# Should show all containers UP
```

### 4. Migrations Ran
```bash
# Database schema updated (if any new migrations)
docker compose exec api alembic current
# Shows current migration version
```

---

## Verify Live Deployment

After deployment completes, your code is LIVE! ✅

### Test Frontend
```
http://44.222.94.206:3000
```

### Test API
```
curl http://44.222.94.206:8000/healthz
# Should return: {"status":"ok"}
```

### View API Docs
```
http://44.222.94.206:8000/docs
```

### SSH Into EC2 to Verify
```bash
ssh -i ~/.ssh/tradeflow-key.pem ec2-user@44.222.94.206

# Check deployment
cd /opt/tradeflow-os
docker compose ps
git log --oneline -1
```

---

## Troubleshooting

### ❌ Deploy Fails: "SSH connection refused"
**Problem:** SSH key or host not configured correctly

**Solution:**
1. Check GitHub Secrets are set:
   - VPS_HOST = 44.222.94.206
   - VPS_USER = ec2-user
   - VPS_SSH_KEY = full key content
2. Verify EC2 is running: AWS Console → EC2 → Instances

### ❌ Deploy Fails: "Permission denied"
**Problem:** SSH key might be wrong or corrupted

**Solution:**
1. Verify SSH works locally:
   ```bash
   ssh -i ~/.ssh/tradeflow-key.pem ec2-user@44.222.94.206
   ```
2. If it works, re-add VPS_SSH_KEY secret to GitHub

### ❌ Deploy Fails: "docker compose command not found"
**Problem:** Docker not installed on EC2

**Solution:**
1. SSH into EC2
2. Install Docker:
   ```bash
   sudo yum update -y
   sudo yum install -y docker
   sudo systemctl start docker
   ```

### ❌ Tests Fail
**Problem:** Tests are failing (red X on Backend or Frontend)

**Solution:**
1. Check the test logs in GitHub Actions
2. Fix the failing test locally
3. Commit and push again
4. Deployment will only happen if ALL tests pass

### ❌ Docker Build Fails
**Problem:** Docker image build failed

**Solution:**
1. Check build logs in GitHub Actions
2. Usually due to missing dependencies in requirements.txt or package.json
3. Fix locally, commit, push again

---

## Success Checklist

After deployment completes, verify:

- [ ] GitHub Actions shows ✅ all workflows passed
- [ ] All 5 workflows completed (Backend, Frontend, Docker Backend, Docker Frontend, Deploy)
- [ ] Deploy logs show "🎉 Deployment successful!"
- [ ] EC2 shows new code: `git log --oneline -1` shows `4f1bbd3`
- [ ] Services running: `docker compose ps` shows all UP
- [ ] API responds: `curl http://44.222.94.206:8000/healthz` returns ok
- [ ] Frontend loads: http://44.222.94.206:3000 works
- [ ] Can login and create deals

---

## What This Proves

✅ **Full Automation is Working:**
1. Code pushed to GitHub
2. Tests ran automatically
3. Docker images built automatically
4. EC2 deployed automatically
5. No manual steps needed!

---

## Next Steps

Once you verify deployment succeeded:

1. **Code → GitHub** (you do this)
2. **Tests run** (GitHub Actions does this automatically)
3. **Docker builds** (GitHub Actions does this automatically)
4. **EC2 deploys** (GitHub Actions does this automatically)
5. **🟢 You're LIVE!** (no manual work needed!)

This is the power of CI/CD! 🚀

---

## Monitoring Logs

### Real-Time Logs
Click the "Deploy to Production" workflow to see logs in real-time

### Key Sections to Look For
1. **Build Summary** - Shows what's being deployed
2. **Deploy to EC2** - The SSH connection and deployment
3. **Deployment Success** - Confirms all steps completed
4. **Deployment Failed** (if applicable) - Shows what went wrong

---

## Timeline

- **Commit sent:** Now
- **Tests start:** ~1 minute
- **Docker builds:** ~5 minutes total
- **EC2 deployment:** ~13 minutes total
- **🟢 LIVE:** ~15 minutes from now

Go watch it! 👀

https://github.com/asifetv/tradeflow-os/actions
