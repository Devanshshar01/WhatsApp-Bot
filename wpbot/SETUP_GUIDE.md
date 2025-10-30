# 📖 Complete Setup Guide

This guide will walk you through setting up the WhatsApp bot step by step.

## 🎯 Quick Start (5 Minutes)

### 1. Install Node.js
If you don't have Node.js installed:

**Windows:**
- Download from [nodejs.org](https://nodejs.org)
- Run the installer
- Verify: Open CMD and type `node --version`

**Mac:**
```bash
brew install node
# Or download from nodejs.org
```

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Download the Bot
```bash
# Option 1: Using git
git clone <repository-url>
cd whatsapp-bot

# Option 2: Download ZIP
# Extract the ZIP file and navigate to the folder
```

### 3. Install Dependencies
```bash
npm install
```

**If you encounter errors:**
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install

# If still failing, install individually
npm install whatsapp-web.js qrcode-terminal dotenv axios moment fs-extra sharp fluent-ffmpeg better-sqlite3 chalk
```

### 4. Configure the Bot
```bash
# Copy environment file
cp .env.example .env

# Edit with your favorite editor
nano .env
# or
code .env
# or
notepad .env
```

**Required Configuration:**
```env
BOT_NAME=My WhatsApp Bot
PREFIX=/
OWNER_NUMBERS=919876543210  # Your WhatsApp number with country code
```

### 5. Start the Bot
```bash
npm start
```

### 6. Scan QR Code
1. A QR code will appear in your terminal
2. Open WhatsApp on your phone
3. Tap Menu (⋮) → Linked Devices
4. Tap "Link a Device"
5. Scan the QR code

**Done! Your bot is running!** 🎉

---

## 🔧 Detailed Configuration

### Environment Variables Explained

```env
# Bot Identity
BOT_NAME=WhatsApp Bot              # Name of your bot
PREFIX=/                           # Command prefix (/, !, ., etc.)

# Owner Numbers (comma-separated, with country code, no + or spaces)
OWNER_NUMBERS=919876543210,918765432109

# Database
DATABASE_PATH=./database/bot.db    # SQLite database location

# Features (true/false)
ENABLE_AUTO_RESPONSE=true          # Auto-reply to greetings
ENABLE_ANTI_SPAM=true              # Prevent spam messages
ENABLE_ANTI_LINK=true              # Block unauthorized links
ENABLE_PROFANITY_FILTER=true       # Filter bad words

# Rate Limiting
COMMAND_COOLDOWN=3000              # Cooldown between commands (ms)
MAX_MESSAGES_PER_MINUTE=10         # Max messages per user per minute

# Media
MEDIA_FOLDER=./media               # Where to store media files
MAX_MEDIA_SIZE=16777216            # Max file size (16MB in bytes)

# Logging
LOG_LEVEL=info                     # Log level (info, debug, error)
ENABLE_MESSAGE_LOGGING=true        # Log all messages
```

### Finding Your WhatsApp Number

Your owner number should be in this format:
- **Format:** `[country code][number]` (no + or spaces)
- **Example:** `919876543210` for +91 98765 43210
- **USA:** `12025551234` for +1 (202) 555-1234
- **UK:** `447911123456` for +44 7911 123456

**How to find it:**
1. Open WhatsApp
2. Go to Settings → Profile
3. Your number is displayed there
4. Remove + and spaces, keep country code

---

## 🚀 Running the Bot

### Method 1: Direct Run (Development)
```bash
npm start
```
- Simple and quick
- Stops when terminal closes
- Good for testing

### Method 2: Background Process (Production)
```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start index.js --name whatsapp-bot

# Other PM2 commands
pm2 status                 # Check status
pm2 logs whatsapp-bot      # View logs
pm2 restart whatsapp-bot   # Restart
pm2 stop whatsapp-bot      # Stop
pm2 delete whatsapp-bot    # Remove

# Auto-start on system boot
pm2 startup
pm2 save
```

### Method 3: Using Screen (Linux/Mac)
```bash
# Start a screen session
screen -S whatsapp-bot

# Run the bot
npm start

# Detach: Press Ctrl+A then D
# Reattach: screen -r whatsapp-bot
```

---

## 🌐 Deployment Guides

### Deploy on Railway.app

1. **Create Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Configure Environment**
   - Go to Variables tab
   - Add all variables from `.env`
   - Click "Add Variable" for each

4. **Deploy**
   - Railway will automatically deploy
   - Check logs for QR code
   - Scan QR code from logs

5. **Keep Alive**
   - Railway may sleep after inactivity
   - Use cron-job.org to ping your app

### Deploy on Replit

1. **Create Account**
   - Go to [replit.com](https://replit.com)
   - Sign up

2. **Create Repl**
   - Click "+ Create"
   - Select "Node.js"
   - Name it "whatsapp-bot"

3. **Upload Files**
   - Upload all project files
   - Or import from GitHub

4. **Add Secrets**
   - Click "Secrets" (lock icon)
   - Add each environment variable
   - Use same names as in `.env`

5. **Install Dependencies**
   - Replit auto-detects package.json
   - Or run: `npm install`

6. **Run**
   - Click "Run" button
   - QR code appears in console
   - Scan with WhatsApp

7. **Keep Alive**
   - Use UptimeRobot to ping your Repl
   - Or use Replit's "Always On" (paid)

### Deploy on VPS (DigitalOcean/Linode/AWS)

1. **Create VPS**
   - Choose Ubuntu 20.04 or later
   - Minimum: 1GB RAM, 1 CPU

2. **Connect via SSH**
   ```bash
   ssh root@your-server-ip
   ```

3. **Update System**
   ```bash
   apt update && apt upgrade -y
   ```

4. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt install -y nodejs
   ```

5. **Install Git**
   ```bash
   apt install -y git
   ```

6. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd whatsapp-bot
   ```

7. **Install Dependencies**
   ```bash
   npm install
   ```

8. **Configure**
   ```bash
   cp .env.example .env
   nano .env
   # Edit and save (Ctrl+X, Y, Enter)
   ```

9. **Install PM2**
   ```bash
   npm install -g pm2
   ```

10. **Start Bot**
    ```bash
    pm2 start index.js --name whatsapp-bot
    pm2 startup
    pm2 save
    ```

11. **Scan QR Code**
    ```bash
    pm2 logs whatsapp-bot
    # Scan the QR code
    # Press Ctrl+C to exit logs
    ```

---

## 🔐 Security Setup

### 1. Firewall Configuration (VPS)
```bash
# Allow SSH
ufw allow 22/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### 2. Create Non-Root User (VPS)
```bash
# Create user
adduser botuser

# Add to sudo group
usermod -aG sudo botuser

# Switch to user
su - botuser
```

### 3. Secure Environment Variables
- Never commit `.env` to git
- Use different credentials for production
- Rotate owner numbers if compromised

### 4. Regular Updates
```bash
# Update bot
git pull
npm install

# Restart
pm2 restart whatsapp-bot
```

---

## 🧪 Testing

### Test Basic Commands
```
/ping
/help
/about
/menu
```

### Test in Group (as admin)
```
/groupinfo
/tagall Test message
```

### Test Media
- Send image with `/sticker`
- Reply to media with `/download`

### Test Admin Features
```
/antilink on
/welcome set Welcome {user}!
```

---

## 📊 Monitoring

### View Logs
```bash
# PM2 logs
pm2 logs whatsapp-bot

# File logs
tail -f logs/bot-$(date +%Y-%m-%d).log

# Error logs only
pm2 logs whatsapp-bot --err
```

### Check Status
```bash
# PM2 status
pm2 status

# System resources
pm2 monit

# Detailed info
pm2 info whatsapp-bot
```

### Database Backup
```bash
# Backup database
cp database/bot.db database/bot.db.backup

# Automated backup (cron)
crontab -e
# Add: 0 2 * * * cp /path/to/database/bot.db /path/to/backups/bot-$(date +\%Y\%m\%d).db
```

---

## 🐛 Common Issues & Solutions

### Issue: QR Code Not Showing
**Solution:**
```bash
# Install qrcode-terminal
npm install qrcode-terminal

# Try different terminal
# Windows: Use Windows Terminal
# Mac: Use iTerm2
# Linux: Use GNOME Terminal
```

### Issue: Authentication Failed
**Solution:**
```bash
# Delete session
rm -rf .wwebjs_auth/
rm -rf .wwebjs_cache/

# Restart bot
npm start
```

### Issue: Module Not Found
**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port Already in Use
**Solution:**
```bash
# Find process
lsof -i :3000  # or your port

# Kill process
kill -9 <PID>
```

### Issue: Database Locked
**Solution:**
```bash
# Stop bot
pm2 stop whatsapp-bot

# Remove lock
rm database/bot.db-wal
rm database/bot.db-shm

# Start bot
pm2 start whatsapp-bot
```

### Issue: Sharp Installation Failed
**Solution:**
```bash
# Install build tools
# Ubuntu/Debian
apt install -y build-essential python3

# Mac
xcode-select --install

# Reinstall sharp
npm rebuild sharp
```

---

## 📱 Phone Setup

### Recommended Settings
1. **Keep WhatsApp Updated**
   - Latest version for best compatibility

2. **Stable Internet**
   - Bot needs phone to be online initially
   - After linking, phone can be offline

3. **Battery Optimization**
   - Disable battery optimization for WhatsApp
   - Prevents disconnection

4. **Notifications**
   - Keep WhatsApp notifications enabled
   - Helps maintain connection

---

## 🎓 Next Steps

After successful setup:

1. **Customize Commands**
   - Edit existing commands
   - Add new commands

2. **Configure Filters**
   - Set up anti-link domains
   - Add profanity words

3. **Test in Groups**
   - Add bot to test group
   - Try all commands

4. **Monitor Performance**
   - Check logs regularly
   - Monitor resource usage

5. **Backup Regularly**
   - Database backups
   - Configuration backups

---

## 💡 Tips & Tricks

### Performance Optimization
```javascript
// In config.js, adjust:
commandCooldown: 2000,        // Faster response
maxMessagesPerMinute: 15,     // More lenient
```

### Custom Prefix
```env
# In .env
PREFIX=!    # Use ! instead of /
PREFIX=.    # Use . instead of /
```

### Multiple Owners
```env
# In .env
OWNER_NUMBERS=919876543210,918765432109,447911123456
```

### Disable Features
```env
# In .env
ENABLE_AUTO_RESPONSE=false
ENABLE_ANTI_SPAM=false
```

---

## 📞 Getting Help

If you're stuck:

1. **Check README.md** - Comprehensive documentation
2. **Check Logs** - Error messages are helpful
3. **Search Issues** - Someone might have same problem
4. **Ask Community** - WhatsApp bot communities
5. **Create Issue** - With detailed information

---

**Happy Bot Building! 🚀**
