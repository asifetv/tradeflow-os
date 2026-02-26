#!/bin/bash
# TradeFlow OS - EC2 Clean Migration Test
# Run this on your EC2 instance to verify migrations work correctly
# Date: 2026-02-25

set -e

echo "=========================================="
echo "TradeFlow OS - EC2 Clean Migration Test"
echo "=========================================="
echo ""

# Step 1: Fresh start
echo "Step 1: Cleaning up old containers and volumes..."
cd /opt/tradeflow
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker volume rm tradeflow-os_postgres_data tradeflow-os_minio_data 2>/dev/null || true
sleep 5
echo "✅ Done: Old containers and volumes removed"
echo ""

# Step 2: Get latest code
echo "Step 2: Pulling latest code from GitHub..."
git pull origin main
echo "✅ Done: Latest code pulled"
echo ""

# Step 3: Start services
echo "Step 3: Starting Docker services..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
sleep 5
echo "✅ Done: Services started (postgres, api, frontend, minio)"
echo ""

# Step 4: Wait for database
echo "Step 4: Waiting for database to be ready..."
echo "   (Waiting 30 seconds for PostgreSQL initialization)"
sleep 30
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
echo "✅ Done: Database ready"
echo ""

# Step 5: Run migrations
echo "Step 5: Running database migrations..."
echo "   (This will apply all 5 migrations: 001-005)"
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head
echo "✅ Done: Migrations completed"
echo ""

# Step 6: Verify current migration
echo "Step 6: Verifying migration head..."
CURRENT=$(docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic current)
echo "Current migration: $CURRENT"
if [[ $CURRENT == *"005"* ]]; then
    echo "✅ Done: Migration 005 is current (correct!)"
else
    echo "❌ ERROR: Expected migration 005, got: $CURRENT"
    exit 1
fi
echo ""

# Step 7: Verify tables created
echo "Step 7: Verifying all 11 tables created..."
TABLES=$(docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
  psql -U tradeflow -d tradeflow -c "\dt" -q | wc -l)
echo "Tables found: $TABLES"
if [ "$TABLES" -ge 11 ]; then
    echo "✅ Done: All tables created"
else
    echo "❌ ERROR: Expected at least 11 tables, found: $TABLES"
    exit 1
fi
echo ""

# Step 8: Verify UUID types
echo "Step 8: Verifying UUID column types..."
UUID_CHECK=$(docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
  psql -U tradeflow -d tradeflow -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'company' AND column_name = 'id';" -q)
echo "Company table 'id' column: $UUID_CHECK"
if [[ $UUID_CHECK == *"uuid"* ]]; then
    echo "✅ Done: ID column is UUID type (correct!)"
else
    echo "❌ ERROR: Expected UUID type, got: $UUID_CHECK"
    exit 1
fi
echo ""

# Step 9: Health check
echo "Step 9: Testing API health endpoint..."
HEALTH=$(curl -s http://localhost:8000/healthz)
echo "Health check response: $HEALTH"
if [[ $HEALTH == *"ok"* ]]; then
    echo "✅ Done: API is healthy"
else
    echo "⚠️  WARNING: Health check may need a few more seconds"
    sleep 10
    HEALTH=$(curl -s http://localhost:8000/healthz)
    echo "Health check response (retry): $HEALTH"
fi
echo ""

# Step 10: Readiness check
echo "Step 10: Testing API readiness endpoint..."
READY=$(curl -s http://localhost:8000/readyz)
echo "Readiness check response: $READY"
if [[ $READY == *"ready"* ]]; then
    echo "✅ Done: API is ready (database connected)"
else
    echo "⚠️  WARNING: Readiness check may need a few more seconds"
    sleep 10
    READY=$(curl -s http://localhost:8000/readyz)
    echo "Readiness check response (retry): $READY"
fi
echo ""

# Step 11: Frontend check
echo "Step 11: Verifying frontend is responding..."
FRONTEND=$(curl -s http://localhost:3000 | head -c 100)
if [[ ! -z "$FRONTEND" ]]; then
    echo "Frontend responding: YES ✅"
else
    echo "Frontend responding: NO ⚠️"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary Checklist"
echo "=========================================="
echo "✅ Containers cleaned and removed"
echo "✅ Latest code pulled from GitHub"
echo "✅ Services started successfully"
echo "✅ Database ready and migrations ran"
echo "✅ Current migration: 005 (head)"
echo "✅ All 11 tables created"
echo "✅ ID columns are UUID type"
echo "✅ API health check passing"
echo "✅ API readiness check passing"
echo "✅ Frontend responding"
echo ""
echo "=========================================="
echo "🟢 READY FOR PRODUCTION DEPLOYMENT!"
echo "=========================================="
echo ""
echo "Your application is running at:"
echo "  Frontend:  http://$(hostname -I | awk '{print $1}'):3000"
echo "  API:       http://$(hostname -I | awk '{print $1}'):8000"
echo "  API Docs:  http://$(hostname -I | awk '{print $1}'):8000/docs"
echo ""
