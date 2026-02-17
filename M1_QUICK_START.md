# M1 (Deal Hub) - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL (configured in backend)
- Docker (optional, for running services)

### Environment Setup

#### Backend
```bash
cd backend

# Create .env file (if not exists)
cp ../.env.example .env

# Key variables needed:
# DATABASE_URL=postgresql+asyncpg://tradeflow:tradeflow@localhost:5432/tradeflow
# JWT_SECRET_KEY=your-secret-key
```

#### Frontend
```bash
cd frontend

# Create .env.local file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
```

---

## 🏃 Running the Application

### Option 1: Docker Compose (Recommended)

```bash
# From project root
docker-compose up -d

# Wait for services to be ready (30-60 seconds)
docker-compose logs -f
```

**Services started:**
- Backend API: http://localhost:8000
- Frontend: http://localhost:3000
- PostgreSQL: localhost:5432
- (Optional) Redis, MinIO, etc.

### Option 2: Local Development

#### Terminal 1 - Backend
```bash
cd backend

# Install dependencies (if not done)
pip install -r requirements.txt

# Run migrations (if needed)
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

**Backend ready:** http://localhost:8000

#### Terminal 2 - Frontend
```bash
cd frontend

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

**Frontend ready:** http://localhost:3000

---

## 🧪 Testing the Implementation

### Test Sequence (5-10 minutes)

#### 1. Check Backend Health
```bash
curl http://localhost:8000/healthz
# Response: {"status": "ok"}
```

#### 2. View Swagger Documentation
- Open http://localhost:8000/docs
- Interactive endpoint testing interface

#### 3. Create First Deal
```bash
curl -X POST http://localhost:8000/api/deals \
  -H "Content-Type: application/json" \
  -d '{
    "deal_number": "DEAL-001",
    "description": "First test deal",
    "customer_rfq_ref": "RFQ-2024-001",
    "total_value": 50000,
    "line_items": [
      {
        "description": "Steel Pipe",
        "material_spec": "API 5L X52",
        "quantity": 100,
        "unit": "MT",
        "required_delivery_date": "2024-03-15"
      }
    ]
  }'
```

**Response:** Deal object with ID and `status: "rfq_received"`

#### 4. Access Frontend
- Open http://localhost:3000
- Click "Go to Deals"

#### 5. Test Kanban View
- Should see deal in "RFQ Received" column
- Click deal card to view details

#### 6. Create Deal via UI
- Click "+ New Deal" button
- Fill form:
  - Deal Number: DEAL-002
  - Description: Test via frontend
  - Click "Create Deal"
- Should redirect to detail page with Activity showing "created" log

#### 7. Test Status Transition
- On detail page, click status dropdown
- Only valid transitions shown (Sourcing, Quoted, Cancelled)
- Select "Sourcing"
- Verify:
  - Status badge updates
  - Activity tab shows "status_changed" entry

#### 8. Test Line Items
- Click "Line Items" tab
- Should see items from creation

#### 9. Test Edit
- Click "Edit" button
- Modify description
- Click "Update Deal"
- Verify Activity tab shows "updated" entry with field changes

#### 10. Toggle Views
- On deals list page
- Click "Table" button
- Should see table view with all deals
- Click "Kanban" to return

---

## 📊 Verifying Key Features

### ✅ State Machine Validation
```bash
# Try invalid transition (CLOSED → RFQ_RECEIVED)
curl -X PATCH http://localhost:8000/api/deals/{deal_id}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "rfq_received"}'

# Expected: 400 Bad Request with error message
```

### ✅ Activity Logging
```bash
# Get activity logs for deal
curl http://localhost:8000/api/deals/{deal_id}/activity

# Should show:
# - "created" action with no changes
# - "status_changed" action with old/new values
# - "updated" action with field changes
```

### ✅ Soft Delete
```bash
# Delete deal
curl -X DELETE http://localhost:8000/api/deals/{deal_id}

# Response: 204 No Content

# Try to fetch deleted deal
curl http://localhost:8000/api/deals/{deal_id}

# Response: 404 Not Found
```

---

## 🐛 Troubleshooting

### Backend Issues

**"Cannot connect to database"**
- Check DATABASE_URL in .env
- Verify PostgreSQL is running: `psql -U tradeflow -d tradeflow`
- Run migrations: `alembic upgrade head`

**"ModuleNotFoundError"**
- Install requirements: `pip install -r requirements.txt`
- Check Python version: `python --version` (should be 3.9+)

**Port 8000 already in use**
```bash
# Use different port
uvicorn app.main:app --reload --port 8001
```

### Frontend Issues

**"Cannot find module"**
- Install dependencies: `npm install --legacy-peer-deps`
- Clear node_modules: `rm -rf node_modules && npm install`

**CORS error connecting to backend**
- Check `NEXT_PUBLIC_API_URL` in .env.local
- Verify backend CORS_ORIGINS setting includes frontend URL
- Restart frontend after .env changes

**TypeScript errors**
- Run type check: `npm run type-check`
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run build`

---

## 📈 Performance Verification

### Check Build Sizes
```bash
npm run build
# View "Route" table for page sizes
```

**Expected:**
- Root page: ~106 kB first load JS
- Deals list: ~153 kB
- Deals detail: ~170 kB

### Check API Response Times
```bash
# Time a deal fetch
time curl http://localhost:8000/api/deals

# Should complete in <100ms on local machine
```

---

## 🎯 Feature Checklist

- [ ] Deals list page loads (Kanban + Table views)
- [ ] Can create new deal
- [ ] Can view deal details
- [ ] Can update deal (edit form)
- [ ] Can change deal status (with validation)
- [ ] Activity logs show all actions
- [ ] Status transitions are validated (invalid ones rejected)
- [ ] Soft delete works (deleted deals disappear)
- [ ] Filter by status works
- [ ] Pagination works
- [ ] Line items display correctly
- [ ] Form validation works
- [ ] Relative timestamps display correctly

---

## 📚 Key Files Reference

### Important Backend Files
- **Database models:** `backend/app/models/deal.py`, `activity_log.py`
- **API endpoints:** `backend/app/api/deals.py`
- **Business logic:** `backend/app/services/deal.py`
- **Validation:** `backend/app/schemas/deal.py`

### Important Frontend Files
- **Pages:** `frontend/app/deals/page.tsx` (and subdirectories)
- **Components:** `frontend/components/deals/`
- **Hooks:** `frontend/lib/hooks/use-deals.ts`
- **Types:** `frontend/lib/types/deal.ts`

---

## 🔗 Integration Points

| Action | Backend | Frontend |
|--------|---------|----------|
| Create Deal | POST /api/deals | useCreateDeal() |
| List Deals | GET /api/deals | useDeals() |
| Get Deal Detail | GET /api/deals/{id} | useDeal() |
| Update Deal | PATCH /api/deals/{id} | useUpdateDeal() |
| Change Status | PATCH /api/deals/{id}/status | useUpdateDealStatus() |
| Delete Deal | DELETE /api/deals/{id} | useDeleteDeal() |
| Get Activity | GET /api/deals/{id}/activity | useDealActivity() |

---

## 🚀 Next Steps

1. **Deploy Backend**
   - Set production environment variables
   - Configure database
   - Run migrations
   - Use production WSGI server (gunicorn)

2. **Deploy Frontend**
   - Build: `npm run build`
   - Deploy to Vercel, CloudFront, or your hosting
   - Update API_URL environment variable

3. **Monitoring**
   - Set up Sentry (if configured)
   - Configure application logging
   - Monitor API response times

4. **Testing**
   - Write unit tests for services
   - Write E2E tests for critical flows
   - Load test the API

---

## 📞 Support

For issues or questions:
1. Check this Quick Start guide
2. Review M1_IMPLEMENTATION_SUMMARY.md
3. Check backend API docs: http://localhost:8000/docs
4. Review code comments in source files

---

**Ready to test!** 🎉

Start with the [Testing the Implementation](#testing-the-implementation) section above.
