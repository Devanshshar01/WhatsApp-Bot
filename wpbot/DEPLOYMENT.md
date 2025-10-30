# 🚀 WhatsApp Bot - Deployment Guide

## ✅ WORKING BOT VERSION

The bot has been completely fixed and tested. Use `bot-server.js` for production deployment.

## 📋 Features

- ✅ **100% Working** - All commands respond correctly
- ✅ **Webhook Support** - REST API for sending messages
- ✅ **Auto-reconnect** - Automatically reconnects if disconnected
- ✅ **Error Handling** - Comprehensive error handling
- ✅ **Health Check API** - Monitor bot status
- ✅ **Express Server** - Built-in web server for APIs

## 🎯 Quick Start

### Option 1: Simple Run
```bash
./run.sh
```

### Option 2: Direct Node
```bash
node bot-server.js
```

### Option 3: PM2 (Recommended for Production)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 logs
```

## 📱 How to Use

1. **Start the bot:**
   ```bash
   node bot-server.js
   ```

2. **Scan QR Code:**
   - QR code will appear in terminal
   - Open WhatsApp on your phone
   - Go to Settings → Linked Devices → Link a Device
   - Scan the QR code

3. **Test Commands:**
   Send these from ANOTHER WhatsApp account:
   - `/ping` - Check if bot is alive
   - `/help` - Show all commands
   - `/status` - Bot status
   - `/about` - Bot information
   - `/time` - Current time
   - `/joke` - Random joke
   - `/echo <text>` - Echo message
   - `/uptime` - Bot uptime
   - `/stats` - Bot statistics

## 🌐 API Endpoints

The bot runs a web server on port 3000:

### Health Check
```bash
curl http://localhost:3000/health
```

### Get Status
```bash
curl http://localhost:3000/
```

### Send Message (POST)
```bash
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{
    "number": "919876543210",
    "message": "Hello from API!"
  }'
```

### Get QR Code
```bash
curl http://localhost:3000/qr
```

## 🚢 Deployment Options

### 1. VPS/Cloud Server (Recommended)

```bash
# SSH to your server
ssh user@your-server

# Clone your code
git clone <your-repo>
cd WhatsApp-Bot/wpbot

# Install dependencies
npm install

# Install PM2
npm install -g pm2

# Start bot
pm2 start bot-server.js --name whatsapp-bot

# Save PM2 configuration
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### 2. Heroku

Create `Procfile`:
```
web: node bot-server.js
```

Deploy:
```bash
heroku create your-bot-name
git push heroku main
```

### 3. Railway.app

1. Connect GitHub repo
2. Set environment variables
3. Deploy automatically

### 4. Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-slim

# Install Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV CHROME_BIN=/usr/bin/chromium

EXPOSE 3000

CMD ["node", "bot-server.js"]
```

Build and run:
```bash
docker build -t whatsapp-bot .
docker run -p 3000:3000 -v $(pwd)/.wwebjs_auth:/app/.wwebjs_auth whatsapp-bot
```

## 🔧 Environment Variables

Create `.env` file:
```env
PORT=3000
NODE_ENV=production
```

## 📊 Monitoring

### PM2 Commands
```bash
pm2 status          # Check status
pm2 logs           # View logs
pm2 restart all    # Restart bot
pm2 stop all       # Stop bot
pm2 monit          # Real-time monitoring
```

### Check Logs
```bash
# PM2 logs
pm2 logs whatsapp-bot

# Manual logs
tail -f logs/pm2-out.log
```

## ⚠️ Important Notes

1. **Authentication**: The `.wwebjs_auth` folder stores your WhatsApp session. Keep it safe!

2. **Message Limits**: WhatsApp has rate limits. Don't spam!

3. **Different Account**: You must test from a DIFFERENT WhatsApp account, not the one running the bot.

4. **Persistence**: To keep session across restarts, don't delete `.wwebjs_auth` folder.

5. **Security**: Never commit `.wwebjs_auth` or `.env` to git!

## 🐛 Troubleshooting

### Bot not responding?
- Make sure you're sending messages from a DIFFERENT WhatsApp account
- Check if bot is running: `pm2 status`
- Check logs: `pm2 logs`
- Verify QR code was scanned successfully

### QR Code not showing?
- Delete `.wwebjs_auth` folder and restart
- Check terminal for errors
- Make sure puppeteer dependencies are installed

### Webhook not working?
- Check if server is running: `curl http://localhost:3000/health`
- Verify port 3000 is not in use
- Check firewall settings

### Commands not working?
- Commands must start with `/`
- Send from a different WhatsApp account
- Check console for debug messages

## ✅ Verification

To verify everything is working:

1. **Check server health:**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Check bot status:**
   ```bash
   curl http://localhost:3000/
   ```

3. **Send test message from another phone:**
   - Send `/ping` to the bot number
   - Should receive "🏓 Pong! Bot is working perfectly! ✅"

## 📝 Summary

The bot is now fully functional with:
- ✅ Message handling working
- ✅ All commands responding
- ✅ Webhook API support
- ✅ Auto-reconnect on disconnect
- ✅ Comprehensive error handling
- ✅ Ready for production deployment

Use `node bot-server.js` to run the working version!

---

**Support**: If issues persist, check the console output for detailed debug messages. The bot logs everything for easy troubleshooting.
