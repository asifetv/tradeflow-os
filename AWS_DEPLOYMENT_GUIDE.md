# TradeFlow OS - AWS Free Tier Deployment Guide

**Target:** Deploy on AWS EC2 free tier
**Estimated Cost:** $0/month (first 12 months)
**Time to Deploy:** 1-2 hours
**Status:** Step-by-step guide for beginners

---

## Prerequisites

- AWS account (create at https://aws.amazon.com/free)
- GitHub account with your repository
- Domain name (optional, can use IP initially)
- Terminal/SSH client (built-in on Mac/Linux, use PuTTY on Windows)

---

## Step 1: Create AWS Account & Verify Free Tier Eligibility

### 1.1 Sign Up for AWS Free Tier

1. Go to https://aws.amazon.com/free
2. Click **"Create a free account"**
3. Enter email and password
4. Choose **"Personal"** account type
5. Enter billing information (won't be charged for free tier)
6. Verify phone number
7. Choose **"Basic support plan"** (free)
8. Wait for account activation (usually instant)

### 1.2 Verify Free Tier Eligibility

1. Sign in to AWS Console: https://console.aws.amazon.com
2. Go to **Billing & Cost Management** → **Billing Dashboard**
3. Look for "Free Tier Usage" section
4. Confirm you have 12 months free tier access

---

## Step 2: Launch EC2 Instance (Free Tier Eligible)

### 2.1 Create EC2 Instance

1. Go to **EC2 Dashboard**: https://console.aws.amazon.com/ec2
2. Click **"Instances"** in left menu
3. Click **"Launch instances"**

### 2.2 Configure Instance Details

**Name:** `tradeflow-prod` (or any name)

**AMI Selection:**
1. Click on **Amazon Linux 2** AMI (Free tier eligible)
   - Or choose **Ubuntu Server 22.04 LTS** (also free tier)
   - Click **"Select"**

**Instance Type:**
1. Make sure **`t2.micro`** is selected (Free tier eligible)
   - This is 1 GB RAM, 1 vCPU
   - Sufficient for MVP
2. Click **"Review and Launch"**

### 2.3 Create Key Pair

1. You'll see a warning about security groups - click **"Edit security groups"** first

2. **Security Group Configuration:**
   - Name: `tradeflow-sg` (or any name)
   - Click **"Add rule"** and add:

   | Type | Protocol | Port Range | Source |
   |------|----------|-----------|--------|
   | SSH | TCP | 22 | 0.0.0.0/0 |
   | HTTP | TCP | 80 | 0.0.0.0/0 |
   | HTTPS | TCP | 443 | 0.0.0.0/0 |

3. Click **"Review and Launch"**

4. **Create Key Pair:**
   - Click **"Select an existing key pair"** or **"Create new key pair"**
   - Choose **"Create new key pair"**
   - Name: `tradeflow-key` (or any name)
   - Format: **PEM** (Mac/Linux) or **PPK** (Windows with PuTTY)
   - Click **"Create key pair"**
   - **IMPORTANT:** Save the file somewhere safe (you'll need it to SSH)
   - Example: `~/.ssh/tradeflow-key.pem`

5. Click **"Launch Instances"**

### 2.4 Get Your Instance IP Address

1. Click **"View Instances"**
2. Wait for instance state to turn green ("running") - usually 30 seconds
3. Copy the **Public IPv4 address** (e.g., `54.123.45.67`)
4. This is your server IP - you'll use it to access your app

---

## Step 3: Connect to Your EC2 Instance via SSH

### 3.1 SSH Connection (Mac/Linux)

```bash
# Make key file readable only by you
chmod 600 ~/.ssh/tradeflow-key.pem

# Connect to your instance
ssh -i ~/.ssh/tradeflow-key.pem ec2-user@YOUR_PUBLIC_IP

# Example:
ssh -i ~/.ssh/tradeflow-key.pem ec2-user@54.123.45.67
```

If prompted "Are you sure you want to continue connecting?", type `yes`

### 3.2 SSH Connection (Windows with PuTTY)

1. Download PuTTY from https://www.putty.org
2. Download PuTTYgen (comes with PuTTY)
3. Convert your .ppk key:
   - Open PuTTYgen
   - Click "Load" and select your `tradeflow-key.ppk`
   - Click "Save private key"
   - Save as `tradeflow-key.ppk`

4. Open PuTTY:
   - Host name: `ec2-user@YOUR_PUBLIC_IP`
   - Connection → SSH → Auth → Browse and select `tradeflow-key.ppk`
   - Click "Open"

**You should now see a terminal prompt:**
```
[ec2-user@ip-172-31-xx-xx ~]$
```

---

## Step 4: Initial Server Setup

### 4.1 Update System

```bash
sudo yum update -y
sudo yum upgrade -y
```

(Amazon Linux) OR

```bash
sudo apt update && sudo apt upgrade -y
```

(Ubuntu)

### 4.2 Install Docker

**Amazon Linux:**
```bash
sudo yum install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user
newgrp docker
```

**Ubuntu:**
```bash
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu
newgrp docker
```

### 4.3 Install Docker Compose v2

**Amazon Linux:**
```bash
sudo yum install -y docker-compose-plugin
```

**Ubuntu:**
```bash
sudo apt install -y docker-compose-plugin
```

### 4.4 Verify Installation

```bash
docker --version
docker compose version
```

Expected output:
```
Docker version 20.x.x
Docker Compose version v2.x.x
```

### 4.5 Install Other Dependencies

```bash
sudo yum install -y git nginx certbot python3-certbot-nginx curl htop
# OR for Ubuntu:
sudo apt install -y git nginx certbot python3-certbot-nginx curl htop
```

---

## Step 5: Clone Repository

### 5.1 Create Application Directory

```bash
sudo mkdir -p /opt/tradeflow
sudo chown -R $(whoami):$(whoami) /opt/tradeflow
cd /opt/tradeflow
```

### 5.2 Clone Your Repository

```bash
git clone https://github.com/YOUR_USERNAME/tradeflow-os.git .
cd /opt/tradeflow
```

Replace `YOUR_USERNAME` with your GitHub username.

### 5.3 Verify Repository

```bash
ls -la
# Should show: backend/ frontend/ docker-compose.yml docker-compose.prod.yml etc.

ls -la .github/workflows/
# Should show all 5 workflow files
```

---

## Step 6: Configure Production Environment

### 6.1 Create .env.production File

```bash
cp .env.production.example .env.production
nano .env.production
```

**Edit the file and change these critical values:**

```bash
# Database (use default localhost since postgres runs in same docker-compose)
DATABASE_URL=postgresql+asyncpg://tradeflow:CHANGE_ME@postgres:5432/tradeflow

# Generate a secure secret key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy output and paste below:
JWT_SECRET_KEY=<paste-generated-secret-here>

# MinIO (for document storage)
MINIO_ROOT_PASSWORD=<generate-another-secret>

# Anthropic API Key (get from https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-<your-api-key>

# CORS Origins (replace with your domain or IP)
CORS_ORIGINS=http://54.123.45.67,https://yourdomain.com

# Admin password (change this!)
ADMIN_PASSWORD=<secure-password>
```

**Save and exit (Ctrl+X, then Y, then Enter in nano)**

### 6.2 Verify Configuration

```bash
grep "CHANGE_ME" .env.production
# Should return nothing if all values updated
```

### 6.3 Create Data Directories

```bash
mkdir -p data/postgres data/minio logs backups
chmod 755 data logs backups
ls -la data/
```

---

## Step 7: Test Local Docker Deployment

### 7.1 Pull and Build Images

```bash
# Pull latest images (or build locally)
export GITHUB_REPO_OWNER=YOUR_USERNAME

# Validate docker-compose files
docker compose -f docker-compose.yml -f docker-compose.prod.yml config

# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 7.2 Wait for Services to Start

```bash
sleep 30

# Check status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Expected output: all containers showing "Up"
```

### 7.3 Run Database Migrations

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head
```

### 7.4 Test Health Endpoints

```bash
# From local machine (not on EC2)
curl http://54.123.45.67:8000/healthz
# Expected: {"status":"ok"}

curl http://54.123.45.67:3000
# Expected: HTML response (Next.js app)
```

If this works, great! Services are running. If not, check logs:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs frontend
```

---

## Step 8: Configure Nginx Reverse Proxy

### 8.1 Copy Nginx Config

```bash
sudo cp nginx.conf /etc/nginx/sites-available/tradeflow
sudo ln -sf /etc/nginx/sites-available/tradeflow /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 8.2 Update Nginx Config with Your IP

**Edit the config to use your IP:**

```bash
sudo nano /etc/nginx/sites-available/tradeflow
```

**Find these lines and update YOUR_IP (lines ~13, ~17, ~30):**

```nginx
server_name YOUR_IP;  # Change 0.0.0.0 to your IP like 54.123.45.67
```

**Also update the domain name (if you have one):**
```nginx
server_name 54.123.45.67;  # Add your domain here too
```

**Save file (Ctrl+X, Y, Enter)**

### 8.3 Test Nginx Configuration

```bash
sudo nginx -t

# Expected: "syntax is ok" and "test is successful"
```

### 8.4 Start Nginx (HTTP only for now)

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl reload nginx
```

### 8.5 Test via Browser (Without HTTPS)

Open your browser and go to:
```
http://54.123.45.67
```

You should see the TradeFlow OS login page!

---

## Step 9: Setup SSL Certificate (Optional but Recommended)

### 9.1 Get Free SSL Certificate from Let's Encrypt

**If you have a domain name:**

```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Follow prompts and enter your email
```

**If using IP address only:**
- Skip SSL for now (not possible with Let's Encrypt for IP addresses)
- You can add it later when you get a domain

### 9.2 Update Nginx for HTTPS

```bash
sudo nano /etc/nginx/sites-available/tradeflow
```

**Uncomment SSL lines if you have a certificate:**

```nginx
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

**Test and reload:**
```bash
sudo nginx -t
sudo systemctl start nginx
```

---

## Step 10: Configure GitHub Secrets (For Auto-Deployment)

### 10.1 Generate SSH Key for Deployments

```bash
# On EC2 instance
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github-deploy -N ""

# Display and copy the public key
cat ~/.ssh/github-deploy.pub
```

### 10.2 Add Public Key to Authorized Keys

```bash
cat ~/.ssh/github-deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 10.3 Get Private Key

```bash
# On EC2 instance
cat ~/.ssh/github-deploy

# Copy the entire output including:
# -----BEGIN RSA PRIVATE KEY-----
# ... (many lines)
# -----END RSA PRIVATE KEY-----
```

### 10.4 Add Secrets to GitHub

1. Go to: **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add three secrets:

```
Name: VPS_HOST
Value: 54.123.45.67

Name: VPS_USER
Value: ec2-user

Name: VPS_SSH_KEY
Value: (paste the entire private key from step 10.3)
```

4. Click **"Add secret"** for each

---

## Step 11: Access Your Application

### 11.1 Access via IP Address

```
Frontend:    http://54.123.45.67
API Docs:    http://54.123.45.67/api/docs
API:         http://54.123.45.67/api
```

Replace `54.123.45.67` with your actual instance IP.

### 11.2 Access via Domain (Optional)

1. **Update your domain's DNS** to point to your EC2 IP:
   - DNS Provider (Namecheap, Route53, etc.)
   - Create `A` record: `yourdomain.com` → `54.123.45.67`
   - Create `A` record: `app.yourdomain.com` → `54.123.45.67`
   - Wait 10-30 minutes for DNS to propagate

2. **Then access via:**
   ```
   https://app.yourdomain.com
   https://api.yourdomain.com
   ```

### 11.3 Test Login

1. Go to **http://54.123.45.67**
2. You should see login page
3. Login with test credentials (check your backend seeding)

---

## Step 12: Test CI/CD Automatic Deployment

### 12.1 Make a Code Change

```bash
# On your local machine
git pull origin main
# Edit a file
git commit -am "test: test deployment"
git push origin main
```

### 12.2 Monitor GitHub Actions

1. Go to **GitHub Repository** → **Actions**
2. You should see workflow running:
   - ✅ Backend Tests
   - ✅ Frontend Tests & Build
   - ✅ Build Backend Docker Image
   - ✅ Build Frontend Docker Image
   - ✅ Deploy to Production

3. **Wait 15-20 minutes** for all to complete

### 12.3 Verify Deployment

```bash
# From your local machine
curl http://54.123.45.67/api/healthz
# Should return: {"status":"ok"}

curl http://54.123.45.67/api/readyz
# Should return: {"status":"ready",...}
```

---

## Step 13: Database Backups

### 13.1 Create First Backup

```bash
mkdir -p /opt/tradeflow/backups

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U tradeflow tradeflow | \
  gzip > /opt/tradeflow/backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz

ls -lh /opt/tradeflow/backups/
```

### 13.2 Automate Daily Backups

```bash
# Create backup script
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

# Add to crontab (runs at 2 AM daily)
(crontab -l 2>/dev/null; echo "0 2 * * * /tmp/backup.sh") | crontab -

# Verify
crontab -l
```

---

## Step 14: Monitor and Maintain

### 14.1 View Application Logs

```bash
# API logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api

# Frontend logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f frontend

# All logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### 14.2 Check Service Status

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Check disk usage
df -h /opt/tradeflow
du -sh /opt/tradeflow/data/*
```

### 14.3 Restart Services

```bash
# Restart all
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart api
```

### 14.4 Update Docker Images

```bash
# Pull latest images
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Restart with new images
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run migrations if needed
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head
```

---

## Troubleshooting

### Issue: Can't SSH to Instance

```bash
# Check security group allows SSH
# Go to EC2 → Instances → Click instance → Security tab
# Make sure port 22 is open to 0.0.0.0/0

# Check key permissions
chmod 600 ~/.ssh/tradeflow-key.pem

# Try SSH with verbose output
ssh -i ~/.ssh/tradeflow-key.pem -v ec2-user@54.123.45.67
```

### Issue: Docker Compose Won't Start

```bash
# Check logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs

# Common issues:
# 1. Port already in use: stop other services
# 2. Not enough memory: check 'df -h' and 'free -h'
# 3. Environment variable missing: check .env.production
```

### Issue: API Returns 502 Bad Gateway

```bash
# Check if API container is running
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Check API logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api

# Check database connection
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic current
```

### Issue: Frontend Blank/Not Loading

```bash
# Check frontend logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs frontend

# Check frontend is responding
curl http://localhost:3000

# Rebuild frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml down frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d frontend
```

### Issue: Can't Access http://IP

```bash
# Check Nginx is running
sudo systemctl status nginx

# Check security group allows ports 80 and 443
# AWS EC2 Console → Instances → Click instance → Security tab

# Test Nginx locally
curl http://localhost

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Cost Summary (AWS Free Tier)

| Item | Free Tier Limit | Our Usage | Cost |
|------|-----------------|-----------|------|
| EC2 t2.micro | 750 hours/month | 730 hours/month | **$0** |
| Data transfer | 100 GB/month out | ~10 GB/month | **$0** |
| EBS Storage | 30 GB | 20 GB | **$0** |
| Total | | | **$0/month** |

**Important:** Free tier is only for first 12 months. After 12 months:
- t2.micro: ~$9/month
- Storage: ~$2/month
- Data transfer: ~$1-10/month

---

## Summary

You now have:

✅ TradeFlow OS running on AWS EC2 free tier
✅ Accessible at `http://YOUR_EC2_IP`
✅ Automatic deployment via GitHub Actions
✅ Database backups automated
✅ SSL (if you added a domain)
✅ Zero additional costs (first 12 months)

**Next steps:**
1. Add a domain name (Route53 or external provider)
2. Setup SSL certificate with Let's Encrypt
3. Monitor logs and backups
4. Invite team members
5. Start development

---

**Questions?**
- Check logs: `docker compose logs -f`
- View docs: `PRODUCTION_DEPLOYMENT.md`
- Check GitHub Actions: See workflow logs for deployment issues

**Created:** 2026-02-25
**Status:** Ready for production use
