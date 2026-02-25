.PHONY: help dev down logs migrate test test-backend test-frontend build prod-status prod-health prod-deploy db-backup db-restore clean

# Variables
DOCKER_COMPOSE := docker-compose -f docker-compose.yml -f docker-compose.prod.yml

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

help:
	@echo "$(BLUE)TradeFlow OS - Makefile Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make dev              - Start development environment"
	@echo "  make down             - Stop containers"
	@echo "  make logs             - View container logs"
	@echo ""
	@echo "$(GREEN)Testing:$(NC)"
	@echo "  make test             - Run all tests"
	@echo "  make test-backend     - Run backend pytest tests"
	@echo "  make test-frontend    - Run frontend tests"
	@echo ""
	@echo "$(GREEN)Building:$(NC)"
	@echo "  make build            - Build Docker images locally"
	@echo "  make migrate          - Run database migrations"
	@echo ""
	@echo "$(GREEN)Production:$(NC)"
	@echo "  make prod-status      - Check production service status"
	@echo "  make prod-health      - Check API health endpoints"
	@echo "  make prod-deploy      - Manual deploy to VPS"
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@echo "  make db-backup        - Create database backup"
	@echo "  make db-restore       - Restore from backup (FILE=path)"
	@echo ""
	@echo "$(GREEN)Maintenance:$(NC)"
	@echo "  make clean            - Clean build artifacts"

# ============================================================================
# Development Commands
# ============================================================================

dev:
	@echo "$(GREEN)Starting development environment...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Services started$(NC)"
	@echo "  API:      $(BLUE)http://localhost:8000$(NC)"
	@echo "  Frontend: $(BLUE)http://localhost:3000$(NC)"
	@echo "  API Docs: $(BLUE)http://localhost:8000/docs$(NC)"

down:
	@echo "$(YELLOW)Stopping containers...$(NC)"
	docker-compose down

logs:
	docker-compose logs -f

# ============================================================================
# Testing Commands
# ============================================================================

test: test-backend test-frontend
	@echo "$(GREEN)✓ All tests passed$(NC)"

test-backend:
	@echo "$(GREEN)Running backend tests...$(NC)"
	cd backend && pytest tests/ -v

test-frontend:
	@echo "$(GREEN)Running frontend tests...$(NC)"
	cd frontend && npm run test -- --passWithNoTests

# ============================================================================
# Build Commands
# ============================================================================

build:
	@echo "$(GREEN)Building Docker images...$(NC)"
	docker build -t tradeflow-api:latest backend/
	docker build -t tradeflow-web:latest frontend/
	@echo "$(GREEN)✓ Images built$(NC)"

migrate:
	@echo "$(GREEN)Running database migrations...$(NC)"
	docker-compose exec api alembic upgrade head
	@echo "$(GREEN)✓ Migrations complete$(NC)"

# ============================================================================
# Production Commands (VPS)
# ============================================================================

prod-status:
	@echo "$(BLUE)Checking production services...$(NC)"
	@curl -s https://api.tradeflow.com/healthz | python3 -m json.tool 2>/dev/null || echo "$(RED)API unreachable$(NC)"

prod-health:
	@echo "$(BLUE)Production Health Check$(NC)"
	@echo "Liveness:"
	@curl -s https://api.tradeflow.com/healthz | python3 -m json.tool
	@echo "\nReadiness:"
	@curl -s https://api.tradeflow.com/readyz | python3 -m json.tool

prod-deploy:
	@echo "$(YELLOW)Manual production deployment (normally automatic via GitHub Actions)$(NC)"
	@read -p "Continue? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		ssh deploy@$${VPS_HOST} "cd /opt/tradeflow && git pull origin main && docker-compose pull && docker-compose up -d && docker-compose exec -T api alembic upgrade head"; \
		echo "$(GREEN)✓ Deployment complete$(NC)"; \
		$(MAKE) prod-health; \
	fi

# ============================================================================
# Database Commands
# ============================================================================

db-backup:
	@echo "$(GREEN)Creating database backup...$(NC)"
	@mkdir -p data/backups
	docker-compose exec -T postgres pg_dump -U tradeflow tradeflow | gzip > data/backups/backup_$(shell date +%Y%m%d_%H%M%S).sql.gz
	@echo "$(GREEN)✓ Backup created$(NC)"

db-restore:
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)Error: FILE required. Usage: make db-restore FILE=data/backups/backup.sql.gz$(NC)"; \
		exit 1; \
	fi
	@echo "$(RED)WARNING: Will overwrite current database!$(NC)"
	@read -p "Continue? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose stop api; \
		docker-compose exec -T postgres psql -U tradeflow -c "DROP DATABASE tradeflow;"; \
		gunzip < $(FILE) | docker-compose exec -T postgres psql -U tradeflow; \
		docker-compose up -d api; \
		echo "$(GREEN)✓ Database restored$(NC)"; \
	fi

# ============================================================================
# Maintenance Commands
# ============================================================================

clean:
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	rm -rf backend/__pycache__ backend/.pytest_cache
	rm -rf frontend/.next frontend/node_modules
	docker-compose down -v
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

.DEFAULT_GOAL := help
