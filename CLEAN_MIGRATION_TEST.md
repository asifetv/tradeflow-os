# Clean Migration Test Guide

**Purpose:** Test all migrations on a completely fresh database to ensure production deployment works

**Expected Time:** ~5 minutes
**Environment:** EC2 Instance (or any fresh deployment)

---

## Step 1: Fresh Start (Delete Everything)

```bash
cd /opt/tradeflow

# Stop all containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# Remove ALL volumes (database, data, everything)
docker volume rm tradeflow-os_postgres_data
docker volume rm tradeflow-os_minio_data

# Verify nothing is left
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
# Should show no containers
```

✅ **Expected:** All containers and volumes removed

---

## Step 2: Get Latest Code

```bash
cd /opt/tradeflow
git pull origin main

# Verify you have the latest migration fixes
ls -lah backend/alembic/versions/
# Should show 5 migrations (001-005)

cat backend/alembic/versions/002_add_multitenancy.py | grep "sa.UUID()"
# Should show multiple UUID references (not String(36))
```

✅ **Expected:** Latest code with UUID fixes

---

## Step 3: Start Fresh Services

```bash
# Remove old Docker images (optional, for truly fresh start)
# docker image rm tradeflow-postgres tradeflow-api tradeflow-frontend

# Start services from scratch
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Watch the startup
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f postgres
# Wait for: "database system is ready to accept connections"
# Then Ctrl+C to exit logs
```

✅ **Expected:** PostgreSQL starts successfully

---

## Step 4: Wait for Database Readiness

```bash
# Wait 30 seconds for database to fully initialize
sleep 30

# Check status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Expected output:
# NAME                  STATUS
# postgres              Up X seconds (healthy)
# api                   Up X seconds
# frontend              Up X seconds
# minio                 Up X seconds
```

✅ **Expected:** All services running and healthy

---

## Step 5: Run Migrations

```bash
# Execute migration command
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head

# You should see output like:
# INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
# INFO  [alembic.runtime.migration] Will assume transactional DDL.
# INFO  [alembic.runtime.migration] Running upgrade  -> 001_add_deal_models, add_multitenancy
# ...continuing for migrations 002-005...
# INFO  [alembic.runtime.migration] Running upgrade 004_make_email_globally_unique -> 005_add_document_management
```

✅ **Expected:** All migrations succeed without errors

---

## Step 6: Verify Migration Completed

```bash
# Check current migration state
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic current

# Expected output:
# 005_add_document_management (head)
```

✅ **Expected:** Shows migration 005 as current head

---

## Step 7: Verify All Tables Created

```bash
# Connect to database and list tables
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
  psql -U tradeflow -d tradeflow -c "\dt"

# Expected output (11 tables):
#              List of relations
# Schema |        Name        | Type  |  Owner
# --------+--------------------+-------+----------
#  public | activity_log       | table | tradeflow
#  public | alembic_version    | table | tradeflow
#  public | company            | table | tradeflow
#  public | customer           | table | tradeflow
#  public | customer_po        | table | tradeflow
#  public | deal               | table | tradeflow
#  public | document           | table | tradeflow
#  public | quote              | table | tradeflow
#  public | user               | table | tradeflow
#  public | vendor             | table | tradeflow
#  public | vendor_proposal    | table | tradeflow
```

✅ **Expected:** All 11 tables created

---

## Step 8: Verify Table Structure (UUID Types)

```bash
# Check company table ID type
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
  psql -U tradeflow -d tradeflow -c "\d company"

# Expected output:
#              Table "public.company"
# Column        |           Type            | Collation | Nullable | Default
# ---------------+---------------------------+-----------+----------+---------
#  id            | uuid                      |           | not null |
#  company_name  | character varying(200)    |           | not null |
#  subdomain     | character varying(50)     |           | not null |
#  ...

# IMPORTANT: id should be "uuid" NOT "character varying"

# Check vendors table
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
  psql -U tradeflow -d tradeflow -c "\d vendors"

# Expected: id, company_id, vendor_id, deal_id should all be UUID type
```

✅ **Expected:** All ID columns are UUID type (not VARCHAR)

---

## Step 9: Test API Health Checks

```bash
# Test liveness probe
curl http://localhost:8000/healthz
# Expected: {"status":"ok"}

# Test readiness probe
curl http://localhost:8000/readyz
# Expected: {"status":"ready","checks":{"database":true,"minio":true}}

# If readiness returns database:false, wait 10 seconds and try again
```

✅ **Expected:** Both health checks pass

---

## Step 10: Verify Frontend Loads

```bash
# Check frontend is responding
curl http://localhost:3000
# Expected: HTML response (Next.js app)

# Check API docs
curl http://localhost:8000/docs
# Expected: OpenAPI documentation page
```

✅ **Expected:** Frontend and API docs load

---

## Step 11: Test API Endpoints (Optional)

```bash
# Create test company (if you have seed data)
curl -X POST http://localhost:8000/api/companies \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Test Co","subdomain":"testco"}'

# List companies
curl http://localhost:8000/api/companies

# List deals
curl http://localhost:8000/api/deals
```

✅ **Expected:** API endpoints respond (may be empty data, but no errors)

---

## Summary Checklist

- [ ] Docker containers cleaned (down -v)
- [ ] Latest code pulled (git pull)
- [ ] Services started (docker compose up -d)
- [ ] Database ready (waited 30 seconds)
- [ ] Migrations ran successfully (alembic upgrade head)
- [ ] Current migration is 005 (alembic current)
- [ ] All 11 tables created (\dt shows tables)
- [ ] All IDs are UUID type (not VARCHAR)
- [ ] Health check passes (curl /healthz)
- [ ] Readiness check passes (curl /readyz)
- [ ] Frontend loads (curl localhost:3000)
- [ ] API docs load (curl localhost:8000/docs)

---

## If Any Test Fails

### Migration Failed
```bash
# Check the error message
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api | tail -100

# Common issues:
# 1. Type mismatch: Check if migrations use UUID() everywhere
# 2. Table not found: Check if migrations are in correct order (001-005)
# 3. Foreign key error: Check table names match (company vs companies)
```

### Tables Not Created
```bash
# Check if migrations actually ran
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic history

# If no history, migrations didn't run
# Check database logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs postgres | tail -50
```

### API Health Check Fails
```bash
# Check API logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api | tail -50

# Restart API
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart api

# Wait 10 seconds and test again
sleep 10
curl http://localhost:8000/healthz
```

---

## Success Indicators

✅ **Green Light = Ready for Production**

When all 12 steps pass, you're ready to deploy to production because:
- All migrations run on fresh database ✅
- All tables created with correct types ✅
- No foreign key errors ✅
- API health checks pass ✅
- Frontend loads successfully ✅

🚀 **You can now confidently push to production!**

---

## For EC2 Deployment

After testing locally, run the same steps on your EC2 instance:

```bash
# SSH to EC2
ssh -i ~/.ssh/tradeflow-key.pem ec2-user@YOUR_EC2_IP

# Run the clean migration test
cd /opt/tradeflow

# Steps 1-5 from above
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
sleep 30
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head

# Verify
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic current
curl http://localhost:8000/healthz
```

✅ **If all pass on EC2, deployment is complete!**

---

**Created:** 2026-02-25
**Status:** Ready for Testing
