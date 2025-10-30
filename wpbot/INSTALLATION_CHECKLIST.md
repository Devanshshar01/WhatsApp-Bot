# ✅ Installation Checklist

Use this checklist to verify your WhatsApp bot is properly installed and configured.

## 📋 Pre-Installation

- [ ] Node.js v16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] WhatsApp account available
- [ ] Terminal/Command Prompt access

## 📦 Installation Steps

- [ ] Downloaded/cloned project files
- [ ] Navigated to project directory
- [ ] Ran `npm install` successfully
- [ ] All dependencies installed without errors

## ⚙️ Configuration

- [ ] Created `.env` file from `.env.example`
- [ ] Set `BOT_NAME` in `.env`
- [ ] Set `PREFIX` in `.env`
- [ ] **IMPORTANT:** Set `OWNER_NUMBERS` with your WhatsApp number
- [ ] Configured optional settings (anti-spam, anti-link, etc.)

### Owner Number Format Check
- [ ] Number includes country code
- [ ] No + symbol
- [ ] No spaces
- [ ] Example: `919876543210` for +91 98765 43210

## 📁 Directory Structure

- [ ] `commands/` directory exists with 20+ command files
- [ ] `database/` directory exists with database.js
- [ ] `events/` directory exists with handlers
- [ ] `utils/` directory exists with utilities
- [ ] `media/` directory created (auto-created on first run)
- [ ] `logs/` directory created (auto-created on first run)

## 🚀 First Run

- [ ] Started bot with `npm start` or `./start.sh`
- [ ] No error messages in console
- [ ] QR code displayed in terminal
- [ ] QR code is scannable (clear and visible)

## 📱 WhatsApp Connection

- [ ] Opened WhatsApp on phone
- [ ] Went to Settings → Linked Devices
- [ ] Tapped "Link a Device"
- [ ] Scanned QR code successfully
- [ ] Saw "Authentication successful" message
- [ ] Saw "Bot is ready" message

## ✅ Basic Testing

### Test in Private Chat

- [ ] Sent `/ping` - got response
- [ ] Sent `/help` - got command list
- [ ] Sent `/about` - got bot info
- [ ] Sent `/menu` - got menu
- [ ] Sent greeting (hi/hello) - got auto-response

### Test Media Commands

- [ ] Sent image with `/sticker` - got sticker
- [ ] Replied to image with `/download` - media downloaded

### Test in Group (as Admin)

- [ ] Added bot to test group
- [ ] Made bot admin in group
- [ ] Sent `/groupinfo` - got group details
- [ ] Sent `/tagall test` - tagged all members
- [ ] Enabled `/antilink on` - confirmed enabled
- [ ] Set welcome message - confirmed set

### Test Owner Commands

- [ ] Sent `/stats` - got statistics
- [ ] Verified owner number is recognized
- [ ] Owner commands are accessible

## 🗄️ Database Verification

- [ ] `database/bot.db` file created
- [ ] Database file has non-zero size
- [ ] No database errors in logs

## 📝 Logging Verification

- [ ] Log file created in `logs/` directory
- [ ] Log file name format: `bot-YYYY-MM-DD.log`
- [ ] Logs contain startup messages
- [ ] Logs contain command executions
- [ ] No error messages in logs (or errors are resolved)

## 🔒 Security Check

- [ ] `.env` file is NOT committed to git
- [ ] `.env` contains correct owner numbers
- [ ] `.gitignore` includes sensitive files
- [ ] Session files (`.wwebjs_auth/`) are private

## 🎨 Feature Testing

### Auto-Response
- [ ] Greeting messages trigger auto-response
- [ ] Help requests show command list

### Anti-Spam
- [ ] Enabled in config
- [ ] Rapid messages trigger warning
- [ ] Rate limiting works

### Anti-Link
- [ ] Enabled in group settings
- [ ] Links are detected
- [ ] Disallowed links are deleted
- [ ] Allowed domains work (youtube.com, etc.)

### Welcome/Goodbye
- [ ] Welcome message on member join
- [ ] Goodbye message on member leave
- [ ] Custom messages work
- [ ] Placeholders replaced correctly

### Cooldowns
- [ ] Commands have cooldown
- [ ] Cooldown message appears
- [ ] Can use command after cooldown expires

## 🔄 Session Management

- [ ] Bot reconnects after restart
- [ ] No need to scan QR code again
- [ ] Session persists across restarts
- [ ] `.wwebjs_auth/` directory exists

## 📊 Performance Check

- [ ] Bot responds quickly (< 2 seconds)
- [ ] No lag in message processing
- [ ] Memory usage reasonable (< 500MB)
- [ ] CPU usage low when idle (< 5%)

## 🐛 Error Handling

- [ ] Invalid commands show error message
- [ ] Missing permissions show error
- [ ] Media errors handled gracefully
- [ ] Database errors logged properly

## 📚 Documentation Access

- [ ] Can open and read README.md
- [ ] Can open and read SETUP_GUIDE.md
- [ ] Can open and read COMMANDS.md
- [ ] Can open and read QUICKSTART.md
- [ ] All documentation is clear and helpful

## 🌐 Deployment (Optional)

If deploying to production:

- [ ] Chosen deployment platform (VPS, Railway, Replit)
- [ ] Environment variables configured on platform
- [ ] Bot starts automatically
- [ ] Process manager configured (PM2 if applicable)
- [ ] Auto-restart on crash enabled
- [ ] Monitoring set up

## 🔧 Advanced Configuration (Optional)

- [ ] Custom prefix configured
- [ ] Multiple owners added
- [ ] Profanity words list customized
- [ ] Allowed domains list updated
- [ ] Rate limits adjusted
- [ ] Media folder configured

## 📱 Production Readiness

- [ ] Tested all commands thoroughly
- [ ] No critical errors in logs
- [ ] Database backup strategy in place
- [ ] Monitoring solution configured
- [ ] Documentation reviewed
- [ ] Emergency shutdown procedure known

## ✨ Final Verification

- [ ] Bot runs for at least 1 hour without issues
- [ ] All core features working
- [ ] No memory leaks observed
- [ ] Logs are clean
- [ ] Ready for production use

## 🎯 Post-Installation Tasks

- [ ] Bookmark important documentation
- [ ] Save backup of `.env` file (securely)
- [ ] Set up automated database backups
- [ ] Configure monitoring alerts
- [ ] Join support communities
- [ ] Star the repository (if applicable)

## 📝 Notes Section

Use this space to note any issues or customizations:

```
Date: _______________
Issues encountered: _______________________________________________
Solutions applied: ________________________________________________
Custom modifications: _____________________________________________
```

## 🆘 If Something Doesn't Work

1. **Check Logs**
   ```bash
   cat logs/bot-$(date +%Y-%m-%d).log
   ```

2. **Verify Configuration**
   ```bash
   cat .env
   ```

3. **Check Dependencies**
   ```bash
   npm list
   ```

4. **Restart Bot**
   ```bash
   npm start
   ```

5. **Clear Session (if needed)**
   ```bash
   rm -rf .wwebjs_auth/
   npm start
   ```

6. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## ✅ Success Criteria

Your installation is successful if:

✅ Bot starts without errors  
✅ QR code authentication works  
✅ Basic commands respond correctly  
✅ Group commands work (if admin)  
✅ Owner commands work (if owner)  
✅ Database operations succeed  
✅ Logs are being created  
✅ No critical errors in logs  
✅ Bot reconnects after restart  
✅ All features work as expected  

## 🎉 Congratulations!

If all items are checked, your WhatsApp bot is successfully installed and ready to use!

**Next Steps:**
1. Review COMMANDS.md for all available commands
2. Customize settings in config.js
3. Add custom commands if needed
4. Deploy to production (if applicable)
5. Monitor and maintain regularly

---

**Need Help?**
- Check README.md for detailed documentation
- Review SETUP_GUIDE.md for troubleshooting
- Check logs for error messages
- Create an issue with details

**Happy Automating! 🚀**
