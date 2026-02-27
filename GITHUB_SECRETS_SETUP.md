# Setting Up GitHub Secrets for Automatic Deployment

**Purpose:** Store EC2 credentials securely so GitHub Actions can automatically SSH and deploy

**Time Required:** ~5 minutes

---

## What You Need

You need 3 pieces of information about your EC2 instance:

1. **VPS_HOST**: Your EC2 IP address (44.222.94.206)
2. **VPS_USER**: SSH username (ec2-user for Amazon Linux, ubuntu for Ubuntu)
3. **VPS_SSH_KEY**: Your EC2 private SSH key (the .pem file)

---

## Step 1: Find Your EC2 SSH Key

### Option A: You Already Have the .pem File
```bash
# Look for a file like:
ls -la ~/Downloads/tradeflow*.pem
ls -la ~/keys/*.pem
ls -la ~/.ssh/*.pem

# Example output:
# /Users/asifetv/Downloads/tradeflow-key.pem
```

If you find it, go to **Step 2**.

### Option B: You Need to Get the Key from AWS

If you lost the key or can't find it:

1. **Log into AWS Console**
   - Go to https://console.aws.amazon.com
   - Sign in with your AWS account

2. **Go to EC2 Dashboard**
   - Search for "EC2" in the search bar
   - Click "EC2"

3. **Find Your Key Pair**
   - Left sidebar → **Key Pairs** (under "Network & Security")
   - Look for your key (e.g., "tradeflow-key")
   - **Important:** If it's not listed, you'll need to create a new key pair and relaunch the instance

4. **Download the Key** (if available)
   - Click on your key pair
   - Click "Download key pair" (if you lost it)
   - Save as `.pem` file (usually auto-downloads)

5. **Set File Permissions** (important!)
   ```bash
   chmod 400 ~/Downloads/tradeflow-key.pem
   # or wherever you saved it
   ```

6. **Verify You Can SSH Into EC2**
   ```bash
   ssh -i ~/Downloads/tradeflow-key.pem ec2-user@44.222.94.206
   # Should connect without errors
   # Type: exit (to close connection)
   ```

---

## Step 2: Prepare the SSH Key for GitHub Secrets

**Get the full private key content:**

```bash
# Display the key (you'll copy this)
cat ~/Downloads/tradeflow-key.pem

# Output will look like:
# -----BEGIN RSA PRIVATE KEY-----
# MIIEpAIBAAKCAQEA1234567890abcdef...
# ...many lines...
# -----END RSA PRIVATE KEY-----

# Copy the ENTIRE content (from BEGIN to END, inclusive)
```

**On macOS:** Copy to clipboard easily:
```bash
cat ~/Downloads/tradeflow-key.pem | pbcopy
# Now the key is in your clipboard
```

---

## Step 3: Add GitHub Secrets

### Go to GitHub Secrets Settings

1. **Open Your Repository on GitHub**
   - Go to: https://github.com/asifetv/tradeflow-os
   - (Or your fork if using a different URL)

2. **Access Settings**
   - Click **Settings** tab at the top
   - Left sidebar → **Secrets and variables**
   - Click **Actions**

3. **Create New Secrets**
   - Click **New repository secret** button
   - Repeat for each secret below

---

### Secret 1: VPS_HOST

**Name:** `VPS_HOST`
**Value:** `44.222.94.206`

```
Name:  VPS_HOST
Value: 44.222.94.206
       (your EC2 IP address)
```

Click **Add secret**

---

### Secret 2: VPS_USER

**Name:** `VPS_USER`
**Value:** `ec2-user` (for Amazon Linux 2)

```
Name:  VPS_USER
Value: ec2-user
       (for Amazon Linux 2; use 'ubuntu' if Ubuntu instance)
```

Click **Add secret**

---

### Secret 3: VPS_SSH_KEY

**Name:** `VPS_SSH_KEY`
**Value:** (Your entire .pem file content)

```
Name:  VPS_SSH_KEY
Value: -----BEGIN RSA PRIVATE KEY-----
       MIIEpAIBAAKCAQEA1234567890abcdef...
       ...many lines...
       -----END RSA PRIVATE KEY-----
       (IMPORTANT: Include the BEGIN and END lines)
```

**How to paste:**
1. Open your .pem file in a text editor
2. Select all content (Ctrl+A or Cmd+A)
3. Copy (Ctrl+C or Cmd+C)
4. Paste into GitHub Secrets (Cmd+V)
5. Make sure it includes `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`

Click **Add secret**

---

## Step 4: Verify Secrets Are Saved

After adding all 3 secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see:
   ```
   ✓ VPS_HOST       (Updated recently)
   ✓ VPS_USER       (Updated recently)
   ✓ VPS_SSH_KEY    (Updated recently)
   ```

3. Secrets are now **masked** in logs (you won't see the actual values)

---

## Step 5: Test the Deployment

Now that secrets are set up, automatic deployment is ready!

### Option A: Auto-Test on Next Push
```bash
# Make a small change
echo "# Test deployment" >> README.md

# Commit and push
git add README.md
git commit -m "test: Trigger automatic deployment"
git push origin main

# Watch GitHub Actions tab:
# 1. Backend Tests workflow runs (~45 sec)
# 2. Frontend Tests workflow runs (~5 min)
# 3. Docker Backend builds (~2 min)
# 4. Docker Frontend builds (~2 min)
# 5. Deploy to EC2 starts automatically (~2 min)
#    - Connects via SSH ✓
#    - Pulls latest code ✓
#    - Pulls Docker images ✓
#    - Restarts services ✓
#    - Runs migrations ✓
```

### Option B: Manual Test Trigger
1. Go to **Actions** tab in GitHub
2. Click **Deploy to Production** workflow on left
3. Click **Run workflow** → **Run workflow** button
4. Watch it deploy in real-time

---

## Verifying Deployment Worked

After workflow completes:

**Check GitHub Actions Output:**
```
✅ Deploy to EC2
   📥 Pulling latest code from GitHub...
   🐳 Pulling latest Docker images...
   ♻️  Restarting services...
   ⏳ Waiting for services...
   🗄️  Running database migrations...
   ✅ Deployment complete!
   🏥 Verifying health endpoints...
   ✅ API is responding!
```

**Check Your Live Site:**
```bash
# Frontend
http://44.222.94.206:3000

# API Docs
http://44.222.94.206:8000/docs

# Health Check
curl http://44.222.94.206:8000/healthz
# Should return: {"status":"ok"}
```

**SSH Into EC2 to Verify:**
```bash
ssh -i ~/Downloads/tradeflow-key.pem ec2-user@44.222.94.206

# On EC2, check services:
cd /opt/tradeflow-os
docker compose ps

# Should show all services running:
# postgres  ✓
# minio     ✓
# api       ✓
# frontend  ✓
# nginx     ✓
```

---

## Troubleshooting

### ❌ "Permission denied (publickey)"
**Problem:** SSH key is wrong or permissions incorrect

**Solution:**
```bash
# Check permissions are 400
ls -la ~/Downloads/tradeflow-key.pem
# Should show: -r--------

# If not, fix permissions
chmod 400 ~/Downloads/tradeflow-key.pem

# Test SSH manually
ssh -i ~/Downloads/tradeflow-key.pem ec2-user@44.222.94.206
```

### ❌ "No such host or network unreachable"
**Problem:** EC2 IP address is wrong or instance is stopped

**Solution:**
1. Check AWS Console → EC2 → Instances
2. Verify IP address matches VPS_HOST secret
3. Verify instance is "Running" (green status)
4. Update VPS_HOST secret if IP changed

### ❌ "Timeout connecting to server"
**Problem:** EC2 security group doesn't allow SSH (port 22)

**Solution:**
1. Go to AWS Console → EC2 → Security Groups
2. Find your security group
3. Check inbound rules include "SSH port 22" from "0.0.0.0/0"

### ❌ Workflow Shows Red X on Deploy Step
**Problem:** One of the secrets is wrong

**Solution:**
1. Re-check all 3 secrets in GitHub Settings
2. Verify VPS_HOST is correct IP
3. Verify VPS_USER is correct (ec2-user or ubuntu)
4. Verify VPS_SSH_KEY includes full .pem content with BEGIN/END lines
5. Re-run workflow with fixed secrets

### ❌ "Secrets not found"
**Problem:** Secrets not created yet

**Solution:**
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Make sure you see all 3 secrets listed
3. If missing, create them using Step 3 above

---

## How It Works Now

**After secrets are set:**

```
1. You make a commit and push to main
        ↓
2. GitHub Actions automatically:
   - Runs backend tests (164 tests)
   - Runs frontend tests (lint, type-check, jest, build)
   - Builds Docker images
   - Pushes to GitHub Container Registry
        ↓
3. Deploy workflow automatically:
   - SSHes into 44.222.94.206
   - Pulls latest code: git pull origin main
   - Pulls latest images: docker compose pull
   - Restarts services: docker compose up -d
   - Runs migrations: alembic upgrade head
        ↓
4. Your code is LIVE in ~10-15 minutes
   - No manual steps needed
   - Fully automated
```

---

## Security Notes

✅ **What GitHub Secrets Protects:**
- Values are encrypted and masked in logs
- Only visible to you and workflows
- Not shown in GitHub Actions output
- Safe to store SSH keys here

✅ **Best Practices:**
- Never commit .pem file to GitHub
- Never paste SSH key in chat/email
- Keep SSH key safe (like a password)
- Rotate keys periodically

❌ **Don't Do This:**
- Don't add .pem files to git (add to .gitignore)
- Don't share SSH keys
- Don't hardcode secrets in workflow files
- Don't use weak/default SSH keys

---

## What's Next?

Once secrets are set:

1. ✅ Make a code change
2. ✅ Push to main
3. ✅ GitHub Actions runs automatically
4. ✅ Tests pass
5. ✅ Docker images build
6. ✅ **EC2 automatically deploys** ← This is new!
7. ✅ Your code is LIVE

**Your deployment is now fully automated!** 🎉

---

**Questions?**

If secrets still don't work after following these steps:
1. Verify EC2 is running: AWS Console → EC2 → Instances
2. Verify you can SSH manually: `ssh -i key.pem ec2-user@44.222.94.206`
3. Check GitHub Actions logs for detailed error messages
4. All 3 secrets must be set correctly for deployment to work
