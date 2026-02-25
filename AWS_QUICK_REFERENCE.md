# AWS Free Tier Deployment - Quick Reference Card

## 🚀 Quick Start (Copy-Paste Commands)

### On Your Local Machine

```bash
# 1. Create AWS account
# Go to https://aws.amazon.com/free
# Sign up and verify email

# 2. Generate SSH key (save it!)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/tradeflow-key.pem

# Keep this key safe, you'll use it to access your server
```

### On AWS Console

```
1. Go to EC2 Dashboard: https://console.aws.amazon.com/ec2
2. Click "Launch instances"
3. Select: Amazon Linux 2 (free tier eligible)
4. Instance type: t2.micro (free tier)
5. Security group: Allow SSH (22), HTTP (80), HTTPS (443)
6. Create key pair: "tradeflow-key" (PEM format)
7. Launch!
8. Copy your Public IPv4 address (e.g., 54.123.45.67)
```

### Back on Your Local Machine (SSH)

```bash
# Connect to your server
chmod 600 ~/.ssh/tradeflow-key.pem
ssh -i ~/.ssh/tradeflow-key.pem ec2-user@YOUR_EC2_IP

# Example:
ssh -i ~/.ssh/tradeflow-key.pem ec2-user@54.123.45.67
```

### On EC2 Instance (Inside Server Terminal)

```bash
# 1. Update system
sudo yum update -y && sudo yum upgrade -y

# 2. Install Docker
sudo yum install -y docker docker-compose-plugin git nginx certbot python3-certbot-nginx curl
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user
newgrp docker

# 3. Create app directory
sudo mkdir -p /opt/tradeflow
sudo chown -R $(whoami):$(whoami) /opt/tradeflow
cd /opt/tradeflow

# 4. Clone your repository
git clone https://github.com/YOUR_USERNAME/tradeflow-os.git .

# 5. Create production environment file
cp .env.production.example .env.production
nano .env.production
# Edit these critical values:
#   JWT_SECRET_KEY=<run: python3 -c "import secrets; print(secrets.token_urlsafe(32))">
#   MINIO_ROOT_PASSWORD=<generate-another-secret>
#   ANTHROPIC_API_KEY=sk-ant-<your-key>
#   CORS_ORIGINS=http://YOUR_EC2_IP,https://yourdomain.com
# Save: Ctrl+X, Y, Enter

# 6. Create data directories
mkdir -p data/postgres data/minio logs backups
chmod 755 data logs backups

# 7. Start services
export GITHUB_REPO_OWNER=YOUR_USERNAME
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 8. Wait 30 seconds, then run migrations
sleep 30
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head

# 9. Setup Nginx reverse proxy
sudo cp nginx.conf /etc/nginx/sites-available/tradeflow
sudo ln -sf /etc/nginx/sites-available/tradeflow /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl reload nginx

# 10. Generate SSH key for auto-deployment
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github-deploy -N ""
cat ~/.ssh/github-deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 11. Display private key for GitHub secrets
cat ~/.ssh/github-deploy
```

### Back on GitHub

```
1. Go to Repository Settings → Secrets and variables → Actions
2. Add three secrets:
   - VPS_HOST = 54.123.45.67 (your EC2 IP)
   - VPS_USER = ec2-user
   - VPS_SSH_KEY = (paste entire private key from previous cat command)
3. Click "Add secret" for each
```

### Test Your Deployment

```bash
# In your browser, go to:
http://YOUR_EC2_IP
# Example: http://54.123.45.67

# You should see the TradeFlow OS login page!

# API health check:
curl http://54.123.45.67/api/healthz
# Should return: {"status":"ok"}

# Check all services:
curl http://54.123.45.67/api/readyz
# Should return database and MinIO status
```

---

## 📋 Common Commands (Run on EC2 Instance)

```bash
# View all running containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api

# Restart all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Create database backup
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U tradeflow tradeflow | gzip > /opt/tradeflow/backups/backup_$(date +%Y%m%d).sql.gz

# Check disk usage
df -h /opt/tradeflow

# Update and restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api alembic upgrade head
```

---

## 🔗 Important URLs

| Item | URL |
|------|-----|
| **Frontend** | `http://54.123.45.67` |
| **API Docs** | `http://54.123.45.67/api/docs` |
| **API Health** | `http://54.123.45.67/api/healthz` |
| **AWS EC2 Console** | https://console.aws.amazon.com/ec2 |
| **GitHub Actions** | https://github.com/YOUR_USERNAME/tradeflow-os/actions |

Replace `54.123.45.67` with your actual EC2 IP and `YOUR_USERNAME` with your GitHub username.

---

## 🚨 Important Notes

- **Free Tier:** Only for 12 months (~$0/month)
- **After 12 months:** ~$12-15/month
- **Keep backups:** Automated daily to `/opt/tradeflow/backups/`
- **Security:** Keep `~/.ssh/tradeflow-key.pem` safe - never share it!
- **SSH key:** Copy the private key output to GitHub secrets exactly (all lines including BEGIN/END)

---

## ⚠️ If Something Goes Wrong

### Can't SSH?
```bash
# Make sure port 22 is open in EC2 security group
# Check key permissions: chmod 600 ~/.ssh/tradeflow-key.pem
# Check IP address is correct in your EC2 console
```

### Services won't start?
```bash
# Check logs
docker compose logs
# Check disk space: df -h
# Check memory: free -h
# Check .env.production values are correct
```

### Website shows blank?
```bash
# Check frontend logs
docker compose logs frontend
# Check Nginx is running: sudo systemctl status nginx
# Check security group allows port 80
```

### API returns error?
```bash
# Check API logs
docker compose logs api
# Check database: docker compose exec api alembic current
# Restart: docker compose restart api
```

---

## 📞 Get Help

See detailed guides:
- **Full guide:** `AWS_DEPLOYMENT_GUIDE.md` (this repository)
- **Production ops:** `PRODUCTION_DEPLOYMENT.md`
- **CI/CD:** `CI_CD_GUIDE.md`

---

**Estimated Time:**
- AWS setup: 10 minutes
- Instance launch: 5 minutes
- Server setup: 20 minutes
- Clone & configure: 10 minutes
- Deploy services: 10 minutes
- **Total: ~60 minutes**

**Estimated Cost (12 months): $0 (Free Tier)**
**Estimated Cost (13+ months): $12-15/month**

Good luck! 🚀
