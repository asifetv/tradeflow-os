# 🚀 Run This on Your EC2 Instance

**Last Updated:** 2026-02-25
**Status:** Ready for Production Deployment

---

## Quick Summary

All migration fixes have been verified locally. The following files are ready:
- ✅ MIGRATION_VERIFICATION_REPORT.md - Proof that all fixes are in place
- ✅ EC2_DEPLOYMENT_QUICK_START.sh - Automated test script
- ✅ CLEAN_MIGRATION_TEST.md - Manual step-by-step guide

---

## Option 1: Automated Test (Recommended)

Copy and run this entire command block on your EC2 instance:

```bash
# SSH into your EC2 instance
ssh -i ~/.ssh/tradeflow-key.pem ec2-user@YOUR_EC2_IP

# Clone or pull the repository
cd /opt/tradeflow
git pull origin main

# Make the script executable
chmod +x EC2_DEPLOYMENT_QUICK_START.sh

# Run the automated test
./EC2_DEPLOYMENT_QUICK_START.sh
```

**Expected Output:**
```
✅ Done: Old containers and volumes removed
✅ Done: Latest code pulled
✅ Done: Services started
✅ Done: Database ready
✅ Done: Migrations completed
✅ Done: Migration 005 is current (correct!)
✅ Done: All tables created
✅ Done: ID column is UUID type (correct!)
✅ Done: API is healthy
✅ Done: API is ready (database connected)
✅ Done: Frontend responding

🟢 READY FOR PRODUCTION DEPLOYMENT!

Your application is running at:
  Frontend:  http://YOUR_EC2_IP:3000
  API:       http://YOUR_EC2_IP:8000
  API Docs:  http://YOUR_EC2_IP:8000/docs
```

---

## Option 2: Manual Steps (If You Want to See Each Step)

If you prefer to run each step manually, follow CLEAN_MIGRATION_TEST.md:

```bash
cd /opt/tradeflow

# Step 1: Fresh start
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker volume rm tradeflow-os_postgres_data tradeflow-os_minio_data

# Step 2: Get latest code
git pull origin main

# Step 3: Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Step 4: Wait for database
sleep 30

# Step 5: Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head

# Step 6: Verify
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic current
# Should output: 005_add_document_management (head)

# Step 7: Check tables
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
  psql -U tradeflow -d tradeflow -c "\dt"
# Should show 11 tables

# Step 8: Verify UUID types
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
  psql -U tradeflow -d tradeflow -c "\d company"
# Should show: id | uuid

# Step 9-10: Health checks
curl http://localhost:8000/healthz
curl http://localhost:8000/readyz

# Step 11: Frontend check
curl http://localhost:3000 | head -c 100
```

---

## What Was Fixed

### 1. Docker Compose Version Warnings ✅
**Fixed:** Removed obsolete `version: '3.8'` attribute from compose files

### 2. Foreign Key Table Names ✅
**Fixed:** Changed `['companies.id']` → `['company.id']` in:
- Migration 003: vendor_proposals table (lines 74)
- Migration 005: documents table (line 44)

### 3. UUID/VARCHAR Type Mismatch ✅
**Fixed:** Changed all ID columns from `String(36)` → `UUID()` in:
- Migration 002: company.id, user.id, all company_id columns
- Migration 003: vendors.id, vendor_proposals.id, all FK columns
- Migration 005: documents.id, documents.company_id, entity_id

---

## Troubleshooting

### If Services Don't Start
```bash
# Check Docker logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f postgres

# Wait longer for database
sleep 60

# Try again
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head
```

### If Migrations Fail
```bash
# Check the exact error
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api | tail -50

# Common issues:
# 1. Database not ready - wait 30-60 seconds
# 2. Foreign key error - this has been fixed
# 3. Type mismatch - this has been fixed
```

### If Health Check Fails
```bash
# Check API logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api

# Restart API
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart api

# Wait and retry
sleep 10
curl http://localhost:8000/healthz
```

---

## After Successful Deployment

Once the test passes, your application is ready for use:

### Access the Application
- **Frontend:** http://YOUR_EC2_IP:3000
- **API:** http://YOUR_EC2_IP:8000
- **API Docs:** http://YOUR_EC2_IP:8000/docs
- **Health Check:** http://YOUR_EC2_IP:8000/healthz

### Set Up SSL (Optional but Recommended)
```bash
# Install Certbot and setup SSL
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Configure Nginx to use SSL
sudo nano /etc/nginx/sites-available/tradeflow
# Add SSL certificate paths and enable HTTPS
```

### Set Up Domain (Optional)
Update your DNS records to point to your EC2 instance:
```
yourdomain.com          → YOUR_EC2_IP
api.yourdomain.com      → YOUR_EC2_IP
app.yourdomain.com      → YOUR_EC2_IP
```

---

## Verification Checklist

After running the script or manual steps, verify:

- [ ] Docker containers are running (`docker ps`)
- [ ] Migration shows 005 as current (`alembic current`)
- [ ] All 11 tables created (`\dt` in psql)
- [ ] ID columns are UUID type (not VARCHAR)
- [ ] Health check passes (`curl /healthz`)
- [ ] Readiness check passes (`curl /readyz`)
- [ ] Frontend loads (`curl localhost:3000`)
- [ ] API docs load (`curl localhost:8000/docs`)

---

## Success Indicators

✅ **Green Light = Production Ready**

When all checks pass:
1. Database migrations complete without errors
2. All 11 tables created with correct types
3. No foreign key constraint errors
4. API health endpoints respond correctly
5. Frontend loads successfully
6. Services remain stable for 5+ minutes

---

## Support

If you encounter any issues:

1. **Check the logs:** `docker compose logs -f api`
2. **Read MIGRATION_TROUBLESHOOTING.md** for detailed explanations
3. **Review MIGRATION_VERIFICATION_REPORT.md** for what was fixed
4. **Manual troubleshooting in CLEAN_MIGRATION_TEST.md**

---

**Created:** 2026-02-25
**Last Updated:** 2026-02-25
**Status:** ✅ READY FOR PRODUCTION
