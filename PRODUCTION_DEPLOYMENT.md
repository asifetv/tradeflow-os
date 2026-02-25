# TradeFlow OS - Production Deployment Guide

## Overview

This guide covers deploying TradeFlow OS to a production VPS using Docker Compose, with automated CI/CD pipelines via GitHub Actions.

**Architecture:**
```
GitHub (code push) → GitHub Actions (CI/CD) → Docker Registry (GHCR) → VPS → Nginx → API + Frontend
```

---

## Prerequisites

### Required
- GitHub repository with GitHub Actions enabled
- VPS with 4GB RAM, 2 CPU, 80GB storage (DigitalOcean, Linode, Hetzner, AWS EC2)
- Ubuntu 22.04 LTS or similar
- Domain name with DNS pointing to VPS IP
- Git installed locally

### Optional
- Slack workspace (for deployment notifications)
- Sentry account (for error tracking)
- AWS S3 or MinIO (for backup storage)

---

## Step 1: VPS Initial Setup

### 1.1 Provision Server

```bash
# DigitalOcean Example:
# - Create Droplet: $24/month (4GB RAM, 2 CPU, 80GB SSD)
# - OS: Ubuntu 22.04 LTS
# - Region: Closest to your users
# - Features: Enable IPv6, private networking
# - Initial password via email
```

### 1.2 Initial SSH Connection

```bash
# First login (change password immediately)
ssh root@YOUR_VPS_IP
passwd  # Change root password

# Create non-root user
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Setup SSH key authentication
mkdir -p /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh

# Copy your public key to authorized_keys
# Then test login: ssh deploy@YOUR_VPS_IP
```

### 1.3 Install Docker & Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add deploy user to docker group
sudo usermod -aG docker deploy
newgrp docker

# Verify Docker works
docker --version
docker run hello-world

# Install Docker Compose v2
sudo apt install -y docker-compose-plugin
docker compose version

# Install other utilities
sudo apt install -y nginx git certbot python3-certbot-nginx curl htop

# Enable services on startup
sudo systemctl enable docker
sudo systemctl enable nginx
```

### 1.4 Setup Application Directory

```bash
# Create application directory
sudo mkdir -p /opt/tradeflow
sudo chown -R deploy:deploy /opt/tradeflow
cd /opt/tradeflow

# Clone repository
git clone https://github.com/YOUR_USERNAME/tradeflow-os.git .
cd /opt/tradeflow

# Create directories for persistent data
mkdir -p data/postgres data/minio logs backups
chmod 755 data logs backups

# Verify structure
ls -la
# Should show: backend/ frontend/ docker-compose.yml docker-compose.prod.yml .env.example etc.
```

---

## Step 2: Configure Production Environment

### 2.1 Create Production Env File

```bash
cd /opt/tradeflow

# Copy environment template
cp .env.production.example .env.production

# Edit with actual values (use secure password generator)
nano .env.production
```

### 2.2 Update Required Values

**Critical settings to change:**

```bash
# Generate secure secrets (run in terminal)
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Update in .env.production:
JWT_SECRET_KEY=<generated-secret-above>
MINIO_ROOT_PASSWORD=<generated-secret>
ADMIN_PASSWORD=<generated-secret>
ANTHROPIC_API_KEY=sk-ant-...  # Get from Anthropic console
```

### 2.3 Validate Configuration

```bash
# Check for required environment variables
grep -E "CHANGE_ME|ADD_YOUR" .env.production

# Output should be empty if all values are filled
```

---

## Step 3: GitHub Secrets Configuration

### 3.1 Generate SSH Key for VPS Access

```bash
# On your local machine (NOT on VPS)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github-deploy

# Add public key to VPS authorized_keys
cat ~/.ssh/github-deploy.pub | ssh deploy@YOUR_VPS_IP "cat >> ~/.ssh/authorized_keys"

# Test connection
ssh -i ~/.ssh/github-deploy deploy@YOUR_VPS_IP "echo 'SSH key works'"

# Keep private key secure
chmod 600 ~/.ssh/github-deploy
```

### 3.2 Add GitHub Secrets

1. Go to: GitHub Repository → Settings → Secrets and variables → Actions
2. Create the following secrets:

```
VPS_HOST          = 123.45.67.89              (your VPS IP)
VPS_USER          = deploy                    (SSH username)
VPS_SSH_KEY       = (paste contents of ~/.ssh/github-deploy - PRIVATE KEY)
SLACK_WEBHOOK_URL = (optional, for Slack notifications)
```

### 3.3 Configure GITHUB_TOKEN Permissions

GitHub automatically creates `GITHUB_TOKEN` for Actions. Ensure it has package write permissions:

1. Go to: Settings → Actions → General
2. Under "Workflow permissions", select: "Read and write permissions"
3. Check: "Allow GitHub Actions to create and approve pull requests"

---

## Step 4: SSL Certificate Setup

### 4.1 Install Let's Encrypt Certificate

```bash
sudo systemctl start nginx

# Request certificate (replace with your domain)
sudo certbot --nginx -d tradeflow.com -d *.tradeflow.com -d api.tradeflow.com

# Interactive prompts:
# - Email: your@email.com
# - Agree to terms: Y
# - Share email with EFF: N
# - Redirect HTTP to HTTPS: Y
```

### 4.2 Verify Certificate

```bash
# Check expiry
sudo certbot certificates

# Auto-renewal test (should show "Cert not yet due for renewal")
sudo certbot renew --dry-run

# Setup auto-renewal cron
sudo certbot renew --quiet --noninteractive
```

### 4.3 Configure Nginx

```bash
# Copy Nginx config
sudo cp nginx.conf /etc/nginx/sites-available/tradeflow

# Enable site
sudo ln -sf /etc/nginx/sites-available/tradeflow /etc/nginx/sites-enabled/tradeflow

# Disable default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 5: Initial Deployment

### 5.1 Pull and Start Services

```bash
cd /opt/tradeflow

# Set environment variable for GitHub registry
export GITHUB_REPO_OWNER=YOUR_GITHUB_USERNAME

# Validate docker-compose files
docker compose -f docker-compose.yml -f docker-compose.prod.yml config

# Pull latest images from GHCR
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Start services (builds if needed)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services to initialize
sleep 30

# Check status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### 5.2 Run Database Migrations

```bash
# Create database and run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head

# Verify migration success
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic current
```

### 5.3 Verify Deployment

```bash
# Check API health
curl https://api.tradeflow.com/healthz
# Expected: {"status":"ok"}

# Check readiness
curl https://api.tradeflow.com/readyz
# Expected: {"status":"ready","checks":{"database":true,"minio":true}}

# Check frontend
curl https://app.tradeflow.com
# Expected: HTML response (Next.js app)

# View logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f frontend
```

---

## Step 6: Automated CI/CD Setup

### 6.1 How the CI/CD Pipeline Works

```
On git push to main:
  ↓
1. GitHub Actions Triggered
  ↓
2. Run Tests
  - Backend: pytest (164 tests)
  - Frontend: ESLint, TypeScript check, Jest tests
  ↓
3. Build Docker Images
  - Build backend image from backend/Dockerfile
  - Build frontend image from frontend/Dockerfile
  - Push to ghcr.io (GitHub Container Registry)
  - Tag with commit SHA and 'latest'
  ↓
4. Deploy to VPS (if push to main)
  - SSH into VPS
  - Pull latest Docker images from GHCR
  - Restart services: docker-compose up -d
  - Run migrations: alembic upgrade head
  - Health checks
  - Slack notification
```

### 6.2 Trigger First Deployment

```bash
# Push code to main
git push origin main

# Monitor workflow in GitHub
# Go to: Repository → Actions → Latest workflow

# Wait for all jobs to complete (5-10 minutes):
# ✅ Backend Tests
# ✅ Frontend Tests & Build
# ✅ Build & Push Backend Docker Image
# ✅ Build & Push Frontend Docker Image
# ✅ Deploy to Production

# Check deployment was successful
curl https://api.tradeflow.com/healthz
```

### 6.3 Workflow Triggers

**Automatic triggers:**
- Push to `main` branch → Run tests + deploy
- Push to `develop` branch → Run tests only
- Pull request to `main` → Run tests only

**Manual trigger:**
```bash
# Go to GitHub Actions → Deploy to Production → Run workflow
# Manually trigger deployment without code push
```

---

## Step 7: Backup & Disaster Recovery

### 7.1 Database Backups

```bash
# Create backup directory
mkdir -p /opt/tradeflow/backups
chmod 755 /opt/tradeflow/backups

# Manual backup
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U tradeflow tradeflow | \
  gzip > /opt/tradeflow/backups/tradeflow_$(date +%Y%m%d_%H%M%S).sql.gz

# Verify backup
ls -lh /opt/tradeflow/backups/

# Setup daily backup cron (runs at 2 AM)
cat > /tmp/backup.sh << 'EOF'
#!/bin/bash
cd /opt/tradeflow
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U tradeflow tradeflow | \
  gzip > /opt/tradeflow/backups/postgres_$(date +\%Y\%m\%d).sql.gz

# Keep only last 7 days
find /opt/tradeflow/backups -name "postgres_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /tmp/backup.sh

# Add to crontab
(crontab -l; echo "0 2 * * * /tmp/backup.sh") | crontab -

# Verify cron job
crontab -l
```

### 7.2 MinIO Backups (Documents)

```bash
# Backup MinIO data
tar -czf /opt/tradeflow/backups/minio_$(date +%Y%m%d).tar.gz \
  /opt/tradeflow/data/minio

# Automatic weekly backups
(crontab -l; echo "0 3 * * 0 tar -czf /opt/tradeflow/backups/minio_\$(date +\\%Y\\%m\\%d).tar.gz /opt/tradeflow/data/minio") | crontab -
```

### 7.3 Restore from Backup

**Restore database:**
```bash
# Extract backup
gunzip < /opt/tradeflow/backups/postgres_20260225.sql.gz > /tmp/restore.sql

# Stop API to close connections
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop api

# Drop old database
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
  psql -U tradeflow -c "DROP DATABASE tradeflow;"

# Restore from backup
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  psql -U tradeflow < /tmp/restore.sql

# Restart API
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d api
```

---

## Step 8: Monitoring & Maintenance

### 8.1 View Logs

```bash
# All services
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs

# Specific service (follow last 100 lines)
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=100 api

# With timestamps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --timestamps api
```

### 8.2 Check Service Health

```bash
# Container status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Resource usage
docker stats

# Disk usage
df -h /opt/tradeflow

# Database size
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
  psql -U tradeflow -c "\l+"
```

### 8.3 Restart Services

```bash
# Restart specific service
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart api

# Restart all services (with downtime)
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Full restart (nuclear option)
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 8.4 Update Services

```bash
# Pull latest images
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Restart with new images
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run migrations if needed
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head

# Verify health
curl https://api.tradeflow.com/readyz
```

### 8.5 Monitor Disk Space

```bash
# Check disk usage
du -sh /opt/tradeflow/data/*

# Cleanup old logs (keep 30 days)
find /opt/tradeflow/logs -name "*.log" -mtime +30 -delete

# Prune Docker system (removes unused images/containers)
docker system prune -a --volumes -f
```

---

## Step 9: Common Issues & Troubleshooting

### Issue: Deployment workflow fails

**Check logs:**
```bash
# View GitHub Actions logs:
# Repository → Actions → Failed workflow → Click job → Scroll to error
```

**Common causes:**
- GHCR authentication failed → Verify `GITHUB_TOKEN` permissions
- VPS SSH key invalid → Regenerate and update GitHub secret
- Database connection failed → Check `DATABASE_URL` in `.env.production`

### Issue: API returns 502 Bad Gateway

```bash
# Check if API container is running
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# If not running, view error logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api

# Restart API
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart api

# Check API health endpoint
curl http://localhost:8000/healthz
```

### Issue: Frontend blank/not loading

```bash
# Check if frontend is running
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps frontend

# Check logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs frontend

# Verify Next.js build was successful
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec frontend ls -la .next/standalone
```

### Issue: Document upload fails

```bash
# Check MinIO is running
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps minio

# Check MinIO logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs minio

# Check disk space
df -h /opt/tradeflow/data/minio
```

### Issue: Database migrations fail

```bash
# Check alembic status
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic current

# View migration history
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic history

# Rollback last migration (if needed)
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic downgrade -1
```

---

## Step 10: Security Hardening

### 10.1 Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Verify
sudo ufw status
```

### 10.2 Update SSL/TLS Settings

```bash
# Update Nginx to use strong ciphers (already in nginx.conf)
# But verify:
sudo openssl s_client -connect api.tradeflow.com:443 -tls1_3

# Test SSL quality
# Go to https://www.ssllabs.com/ssltest/ and test api.tradeflow.com
```

### 10.3 Protect Sensitive Files

```bash
# Ensure .env.production is not world-readable
chmod 600 /opt/tradeflow/.env.production

# Never commit .env.production to git
echo ".env.production" >> /opt/tradeflow/.gitignore

# Audit what files are publicly accessible
sudo grep -r "world-readable" /opt/tradeflow/ 2>/dev/null
```

### 10.4 Enable HTTPS Redirect

```bash
# Verify nginx.conf has HTTP → HTTPS redirect (already included)
sudo nginx -t
curl -I http://api.tradeflow.com  # Should redirect to HTTPS
```

---

## Operational Runbook

### Daily Checks

```bash
# 1. Check all services are running
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 2. Check disk usage
df -h /opt/tradeflow

# 3. View recent logs for errors
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=50 api | grep -i error
```

### Weekly Tasks

```bash
# 1. Backup database
cd /opt/tradeflow
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U tradeflow tradeflow | gzip > /opt/tradeflow/backups/backup_$(date +%Y%m%d).sql.gz

# 2. Test restore capability (don't actually restore)
# Just verify backup file exists and is non-empty
ls -lh backups/

# 3. Check for security updates
sudo apt update
sudo apt upgrade -y

# 4. Review Sentry for errors (if configured)
# Go to https://sentry.io dashboard
```

### Monthly Tasks

```bash
# 1. Review and optimize database
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres \
  psql -U tradeflow -c "VACUUM ANALYZE;"

# 2. Audit access logs for suspicious activity
sudo tail -100 /var/log/nginx/api_access.log | grep -v "200\|304"

# 3. Update Docker images to latest patches
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. Review SSL certificate expiry
sudo certbot certificates
```

---

## Metrics & Monitoring (Optional)

### Setup UptimeRobot (Free)

1. Go to https://uptimerobot.com
2. Sign up (free tier: 50 monitors)
3. Create monitor:
   - Type: HTTPS
   - URL: https://api.tradeflow.com/healthz
   - Interval: 5 minutes
   - Alert email: your@email.com
4. Get alerts when API is down

### Setup Sentry (Error Tracking)

1. Go to https://sentry.io and sign up
2. Create project: Python (backend) + Next.js (frontend)
3. Get DSN keys
4. Update `.env.production`:
   ```
   SENTRY_DSN=https://YOUR_KEY@sentry.io/YOUR_PROJECT
   ```
5. Errors automatically reported to dashboard

---

## Scaling & Advanced Topics

### When to Scale

- **API:** CPU > 70% consistently → Add more API replicas
- **Database:** Memory > 80% → Upgrade to managed RDS
- **Storage:** Disk > 80% → Add volume or migrate to S3

### Horizontal Scaling (Multiple API Instances)

```yaml
# In docker-compose.prod.yml
api:
  deploy:
    replicas: 3  # Run 3 instances
    update_config:
      parallelism: 1  # Update one at a time
      delay: 10s      # Wait 10s between updates
```

### Use Managed Services

- **PostgreSQL:** AWS RDS (automatic backups, failover)
- **Documents:** AWS S3 (highly available)
- **Load Balancer:** AWS ALB (distribute traffic)

---

## Support & Documentation

- **GitHub Issues:** Report bugs at repo Issues
- **Documentation:** Check PRODUCTION_DEPLOYMENT.md (this file)
- **Status Page:** https://status.tradeflow.com (create one if public)
- **Emergency Rollback:** See git history for last known good commit

---

## Checklist: Ready for Production

- [ ] VPS provisioned with 4GB+ RAM
- [ ] GitHub secrets configured (VPS_HOST, VPS_USER, VPS_SSH_KEY)
- [ ] .env.production created with all required values
- [ ] SSL certificate installed and auto-renewal working
- [ ] Nginx configured and serving on :80 and :443
- [ ] Initial deployment successful
- [ ] Health endpoints responding (/healthz, /readyz)
- [ ] Database backups automated
- [ ] First CI/CD deployment completed
- [ ] Monitoring configured (UptimeRobot or similar)
- [ ] Firewall enabled and SSH key-based auth only
- [ ] Team access documented (how to SSH, deploy, etc.)

---

**Last Updated:** 2026-02-25
**Version:** 1.0 (Production Ready)
