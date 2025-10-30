# ⚡ Quick Start Guide

Get your WhatsApp bot running in 5 minutes!

## 🎯 Prerequisites

- **Node.js** v16 or higher ([Download](https://nodejs.org))
- **WhatsApp** account
- **Terminal** or Command Prompt

## 🚀 Installation (3 Steps)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Bot

```bash
# Copy environment file
cp .env.example .env

# Edit .env file
nano .env  # or use any text editor
```

**Required: Set your owner number**
```env
OWNER_NUMBERS=919205201448  # Replace with your number (country code + number, no spaces)
```

### Step 3: Start Bot

**Linux/Mac:**
```bash
./start.sh
```

**Windows:**
```bash
start.bat
```

**Or directly:**
```bash
npm start
```

## 📱 Scan QR Code

1. QR code appears in terminal
2. Open WhatsApp on your phone
3. Go to: **Settings → Linked Devices → Link a Device**
4. Scan the QR code

**Done! Bot is running!** 🎉

## ✅ Test Your Bot

Send these commands to your bot:

```
/ping       # Check if bot is responding
/help       # See all commands
/about      # Bot information
/menu       # Quick command menu
```

## 📋 Common Commands

### Everyone Can Use
- `/help` - Show all commands
- `/ping` - Check bot status
- `/sticker` - Convert image to sticker (reply to image)

### Group Admins
- `/tagall` - Tag all members
- `/groupinfo` - Group details
- `/antilink on` - Enable link filter
- `/welcome set Welcome @user!` - Set welcome message

### Bot Owners Only
- `/broadcast` - Send to all groups
- `/stats` - Bot statistics
- `/block` - Block user

## 🔧 Configuration

### Change Prefix
```env
PREFIX=/    # Default
PREFIX=!    # Use ! instead
PREFIX=.    # Use . instead
```

### Add More Owners
```env
OWNER_NUMBERS=919876543210,918765432109,447911123456
```

### Enable/Disable Features
```env
ENABLE_AUTO_RESPONSE=true
ENABLE_ANTI_SPAM=true
ENABLE_ANTI_LINK=true
```

## 🎨 Adding Custom Commands

1. Copy template:
```bash
cp commands/_template.js commands/mycommand.js
```

2. Edit the file:
```javascript
module.exports = {
    name: 'mycommand',
    description: 'My custom command',
    async execute(client, message, args) {
        await message.reply('Hello from my command!');
    }
};
```

3. Restart bot - command is automatically loaded!

## 🐛 Troubleshooting

### QR Code Not Showing
```bash
# Reinstall dependencies
npm install qrcode-terminal

# Try different terminal
```

### Authentication Failed
```bash
# Delete session and try again
rm -rf .wwebjs_auth/
npm start
```

### Command Not Working
- Check if prefix is correct (`/` by default)
- Verify you have permissions
- Check cooldown (wait a few seconds)

### Bot Crashed
```bash
# Check logs
cat logs/bot-$(date +%Y-%m-%d).log

# Restart bot
npm start
```

## 📊 Monitoring

### View Logs
```bash
# Real-time logs
tail -f logs/bot-$(date +%Y-%m-%d).log

# Search for errors
grep ERROR logs/*.log
```

### Using PM2 (Recommended for Production)
```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start index.js --name whatsapp-bot

# Monitor
pm2 status
pm2 logs whatsapp-bot
pm2 monit

# Restart
pm2 restart whatsapp-bot

# Stop
pm2 stop whatsapp-bot
```

## 🌐 Deployment

### Deploy on VPS
```bash
# Connect to server
ssh user@your-server-ip

# Clone/upload bot
git clone <your-repo>
cd whatsapp-bot

# Install dependencies
npm install

# Configure
cp .env.example .env
nano .env

# Start with PM2
pm2 start index.js --name whatsapp-bot
pm2 startup
pm2 save
```

### Deploy on Railway.app
1. Create account on [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add environment variables
4. Deploy!

### Deploy on Replit
1. Create account on [replit.com](https://replit.com)
2. New Repl → Import from GitHub
3. Add secrets (environment variables)
4. Click Run

## 📚 Documentation

- **README.md** - Complete documentation
- **SETUP_GUIDE.md** - Detailed setup instructions
- **COMMANDS.md** - All commands reference
- **PROJECT_STRUCTURE.md** - Code organization
- **CONTRIBUTING.md** - How to contribute

## 💡 Tips

1. **Keep bot running 24/7** - Use PM2 or deploy on VPS
2. **Backup regularly** - Database and session files
3. **Monitor logs** - Check for errors daily
4. **Update dependencies** - Run `npm update` monthly
5. **Test in private group** - Before using in main groups

## 🆘 Need Help?

1. Check **README.md** for detailed docs
2. Review **SETUP_GUIDE.md** for setup issues
3. Check logs for error messages
4. Search existing issues
5. Create new issue with details

## 🎯 Next Steps

After bot is running:

1. **Test all commands** in a test group
2. **Configure group settings** (antilink, welcome messages)
3. **Add custom commands** for your needs
4. **Set up monitoring** with PM2
5. **Deploy to production** server

## ⚠️ Important Notes

- **Keep `.env` file secure** - Contains sensitive data
- **Don't share session files** - Contains your WhatsApp session
- **Follow WhatsApp ToS** - Use responsibly
- **Backup database** - Contains all bot data
- **Monitor resource usage** - Especially on shared hosting

## 🎉 You're All Set!

Your WhatsApp bot is now running and ready to use!

**Enjoy automating your WhatsApp! 🚀**

---

**Quick Links:**
- [Full Documentation](README.md)
- [Command Reference](COMMANDS.md)
- [Setup Guide](SETUP_GUIDE.md)
- [Project Structure](PROJECT_STRUCTURE.md)

**Support:**
- Check logs: `logs/bot-YYYY-MM-DD.log`
- Test command: `/ping`
- Get help: `/help`
