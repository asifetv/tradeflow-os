# SSH Key Security & Storage Explanation

**TL;DR:** The SSH key is stored in GitHub Secrets (encrypted), NOT in your repository or on disk.

---

## Where Does the SSH Key Go?

### ✅ The Key Goes to: GitHub Secrets (Encrypted)

```
Your Local Machine
    ↓ (You copy & paste once)
GitHub Secrets Vault
    ↓ (Encrypted storage)
    ↓ (Only used during GitHub Actions)
GitHub Actions Runner (temporary VM)
    ↓ (Uses key to SSH into EC2)
Your EC2 Instance
    ↓ (Deployment happens)
```

### NOT Stored Here:
- ❌ Your local disk (after initial setup)
- ❌ GitHub repository code
- ❌ GitHub Actions logs
- ❌ Any commit history
- ❌ Environment files (.env)

---

## Security Architecture

### 1. GitHub Secrets Encryption

**Where:** GitHub's encrypted vault (AWS KMS encryption)

**What GitHub Protects:**
```
VPS_SSH_KEY = "-----BEGIN RSA PRIVATE KEY-----
               MIIEpAIBAAKCAQEA1234567890..."

GitHub encrypts this value:
- At rest (stored encrypted in database)
- In transit (HTTPS only)
- In logs (masked as ****)
```

**What You See in GitHub Actions:**
```
✓ Deploy to EC2
  📥 Pulling latest code from GitHub... ✓
  🐳 Pulling latest Docker images... ✓
  Running: ssh -i ${{ secrets.VPS_SSH_KEY }} ...
           ssh -i **** ...  ← MASKED! Not visible
```

---

### 2. How GitHub Uses the Key During Deployment

**Workflow Execution:**

```
GitHub Actions Starts
  ↓
Load Secrets (encrypted) → Decrypt in memory
  ↓
Create temporary Ubuntu VM (GitHub runner)
  ↓
Mount decrypted secrets as environment variables
  VPS_SSH_KEY = (decrypted value in memory)
  ↓
Run deployment script:
  appleboy/ssh-action@master
    └─ Uses ${{ secrets.VPS_SSH_KEY }}
    └─ Connects to EC2 via SSH
    └─ Runs deployment commands
  ↓
Workflow completes
  ↓
VM is destroyed
  ↓
Secrets are removed from memory
```

**Important:** The key only exists in memory during the workflow, never written to disk.

---

### 3. Key Lifecycle

**Timeline:**

```
Day 1: Setup (you do once)
├─ Get your .pem file from AWS
├─ Copy its content to GitHub Secrets
└─ Done! (key stays in GitHub vault)

Day 2+: Each Time You Push
├─ GitHub Actions loads encrypted secret
├─ Creates temporary runner VM
├─ Decrypts key in memory
├─ Uses key to SSH into EC2
├─ Runs deployment
├─ Destroys runner VM
└─ Key removed from memory
```

**Key Point:** You only paste the key ONCE when setting up secrets. After that, GitHub handles it automatically.

---

## Three Locations Explained

### Location 1: Your Local Machine (AWS-Provided)

**File:** `~/Downloads/tradeflow-key.pem` (or wherever AWS gave you)

**What It Is:**
- Your private EC2 SSH key
- File on your local machine
- Used when YOU manually SSH into EC2

**Do NOT:**
- ❌ Commit to GitHub
- ❌ Send in emails
- ❌ Share in Slack/Discord
- ❌ Upload anywhere public

**Protection:**
- Keep it on your machine
- Set permissions: `chmod 400 tradeflow-key.pem`
- Only you can read it

**Used When:**
```bash
ssh -i ~/Downloads/tradeflow-key.pem ec2-user@44.222.94.206
```

---

### Location 2: GitHub Secrets (Safe Storage)

**Where:** GitHub.com → Your Repo → Settings → Secrets

**What It Is:**
- Encrypted copy of your SSH key
- Stored in GitHub's secure vault
- Only accessible during GitHub Actions workflows

**Protection:**
- ✅ Encrypted at rest (GitHub uses AWS KMS)
- ✅ Encrypted in transit (HTTPS)
- ✅ Masked in logs (shows as ***)
- ✅ Only accessible to workflows
- ✅ Can't see the value after saving
- ✅ Only you can modify it

**How It Works:**
```
You paste the key once:
  "-----BEGIN RSA PRIVATE KEY-----
   MIIEpAIBAAKCAQEA..."

GitHub encrypts it automatically and stores:
  encrypted_value_abc123xyz... (in database)

When workflow runs:
  GitHub decrypts in memory
  Makes available as ${{ secrets.VPS_SSH_KEY }}
  Masks it in logs as ****
```

**Can't See It Again:**
- After you save, you can't view it
- If you forget what you saved, you'd have to replace it
- This is intentional (security best practice)

---

### Location 3: GitHub Actions Runner (Temporary)

**Where:** Temporary Ubuntu VM that GitHub spins up

**What It Is:**
- GitHub-hosted runner machine
- Exists only during workflow execution
- Automatically destroyed when workflow completes

**Protection:**
- ✅ Isolated VM (only for this workflow)
- ✅ Network isolated from internet
- ✅ Key only in memory (not on disk)
- ✅ Destroyed immediately after use
- ✅ No trace left behind

**Timeline:**
```
12:00:00 - GitHub spins up Ubuntu VM
12:00:05 - Mounts encrypted secrets
12:00:10 - Decrypts VPS_SSH_KEY in memory
12:00:15 - Uses SSH key to connect to EC2
12:00:45 - Deployment complete
12:00:50 - Destroys VM
         - Key erased from memory
         - No trace remains
```

---

## Security Comparison

### Your Options:

**Option 1: GitHub Secrets (Recommended)**
```
Pro:
  ✅ Encrypted storage
  ✅ Automatic handling
  ✅ Masked in logs
  ✅ No local disk risk
  ✅ Team can share access
  ✅ Easy to rotate

Con:
  ❌ Can't see value after saving
  ❌ Requires GitHub account
```

**Option 2: Local File + Manual SSH**
```
Pro:
  ✅ Full control
  ✅ Can view anytime

Con:
  ❌ Key on disk (loss/theft risk)
  ❌ Manual deployment every time
  ❌ No automation
  ❌ Hard to share with team
  ❌ Easy to accidentally commit
```

**Option 3: Hard-Code in Workflow (⚠️ NEVER DO THIS)**
```
Pro:
  ✅ Easy setup

Con:
  ❌ Key visible in GitHub code
  ❌ Key in commit history (permanent!)
  ❌ Security nightmare
  ❌ Anyone on team can see it
  ❌ If repo goes public: compromised!
```

---

## Key Safety Checklist

### ✅ DO These Things

- ✅ Use GitHub Secrets (encrypted)
- ✅ Set file permissions on local key: `chmod 400 tradeflow-key.pem`
- ✅ Keep local copy safe (like a password)
- ✅ Use unique SSH key for EC2 (not shared with others)
- ✅ Rotate keys periodically (security best practice)
- ✅ Keep AWS account secure (2FA enabled)

### ❌ DON'T Do These Things

- ❌ Commit .pem file to GitHub
- ❌ Paste SSH key in chat (Slack, Teams, etc.)
- ❌ Email SSH key to yourself or others
- ❌ Hard-code key in workflow files
- ❌ Share SSH key with team members
- ❌ Upload key to file sharing services
- ❌ Use default/weak SSH keys
- ❌ Leave .pem file unprotected on disk

---

## What Happens If Key Is Compromised?

### Scenario 1: SSH Key Leaked

**If someone gets your SSH key:**

```
They could:
  ✅ SSH into your EC2 instance
  ✅ Access your database
  ✅ Modify/delete your data
  ✅ Deploy malicious code

What to do immediately:
  1. Go to AWS Console
  2. Stop the instance (or terminate)
  3. Generate new key pair
  4. Delete old key from GitHub Secrets
  5. Launch new instance with new key
  6. Update GitHub Secrets with new key
  7. Redeploy
```

### Scenario 2: GitHub Account Compromised

**If someone gets your GitHub account:**

```
They could:
  ✅ Read GitHub Secrets (decrypt them)
  ✅ Modify your workflows
  ✅ Deploy malicious code to EC2
  ✅ Access your repository

What to do immediately:
  1. Change GitHub password (from different device)
  2. Enable GitHub 2FA (two-factor authentication)
  3. Rotate SSH keys (delete old, create new)
  4. Review recent actions in GitHub
  5. Check EC2 logs for unauthorized access
```

---

## GitHub Secrets - Technical Details

### How GitHub Encrypts Secrets

```
When you save a secret:

1. GitHub receives plaintext SSH key
   "-----BEGIN RSA PRIVATE KEY-----"

2. GitHub encrypts using:
   - Algorithm: AES-256-GCM (military-grade)
   - Key: AWS KMS managed key
   - Unique IV (initialization vector)

3. Stores encrypted blob in database:
   encrypted_abc123xyz...

4. Only GitHub can decrypt (has the KMS key)
```

### When Decrypted

```
During GitHub Actions workflow:

1. Workflow requests secret: ${{ secrets.VPS_SSH_KEY }}

2. GitHub:
   - Loads encrypted value from database
   - Decrypts using AWS KMS
   - Returns plaintext value
   - Injects into runner VM memory

3. Runner process:
   - Receives decrypted value
   - Available as environment variable
   - Used for SSH connection
   - Masked in logs (replaced with ***)

4. After workflow:
   - Runner destroyed
   - Memory cleared
   - No trace remains
```

---

## Access Control

### Who Can View Your Secrets?

**Repository Owners/Admins:**
- ✅ Can create/modify/delete secrets
- ❌ Can't view existing secret values (GitHub doesn't show them)
- ✅ Can replace/rotate secrets

**Team Members with Access:**
- ✅ Workflows can use secrets
- ❌ Can't view the actual values
- ✅ See that a secret exists (e.g., "VPS_SSH_KEY")

**GitHub (Company):**
- ✅ Has technical access to encrypted data
- ✅ Can't view without AWS KMS access
- ✅ Bound by GitHub Security Policy

**Public:**
- ❌ Can't view secrets at all
- ✅ Public repos still have private secrets!

---

## Migration/Rotation

### If You Need to Rotate SSH Keys

**Steps:**

1. Generate new SSH key in AWS
   ```
   AWS Console → EC2 → Key Pairs → Create Key Pair
   Download new .pem file
   ```

2. Launch new EC2 instance with new key (or update existing)

3. Update GitHub Secret
   ```
   GitHub → Settings → Secrets → VPS_SSH_KEY → Update
   Paste new .pem file content
   ```

4. Delete old key from AWS
   ```
   AWS Console → Key Pairs → Delete old key
   ```

5. Test deployment
   ```
   Push to main (triggers workflow)
   Watch deployment use new key
   ```

---

## Summary Table

| Aspect | GitHub Secrets | Local File | Workflow Code |
|--------|---|---|---|
| **Storage** | GitHub vault (encrypted) | Your disk | GitHub repo |
| **Encryption** | ✅ AES-256 | ❌ No | ❌ No |
| **Visibility** | Masked in logs | You can see | Public/visible |
| **Automatic** | ✅ Yes | ❌ Manual | N/A |
| **Safe** | ✅ Yes | ⚠️ Maybe | ❌ Never |
| **Rotation Easy** | ✅ Yes | ⚠️ Maybe | ❌ No |
| **Team Share** | ✅ Yes | ❌ No | ❌ No |
| **Recommended** | ✅ YES | ⚠️ Local use only | ❌ Never |

---

## Final Answer: Where Is Your SSH Key?

```
Your SSH Key Storage Locations:

1. Your Local Machine (temporary)
   ~/Downloads/tradeflow-key.pem
   └─ Only you have this file
   └─ Used when you manually SSH
   └─ Keep it safe!

2. GitHub Secrets (permanent, encrypted)
   GitHub.com → Settings → Secrets → VPS_SSH_KEY
   └─ GitHub's encrypted vault
   └─ Only used by workflows
   └─ Safe and automatic
   └─ Can't be viewed after saved

3. GitHub Runner VM (temporary)
   Decrypted in memory during workflow
   ├─ Only exists for ~2 minutes
   ├─ Only in memory (not on disk)
   ├─ Destroyed after workflow
   └─ No trace remains

The key NEVER goes to:
  ❌ .env file
  ❌ GitHub code
  ❌ Commit history
  ❌ Logs (masked as ***)
  ❌ Public internet
```

---

**Confidence Level:** 🟢 Very Safe

The SSH key is protected by:
1. GitHub's encryption (AES-256)
2. Temporary runner VM isolation
3. In-memory only (not on disk)
4. Automatic cleanup
5. Masked in logs

This is the industry-standard way to store secrets in CI/CD pipelines.

---

**Questions About Security?**

If you're concerned about any aspect:
- GitHub Secrets are safer than local files
- GitHub is trusted by millions of projects
- Even large enterprises use this method
- Key is never exposed during deployment
