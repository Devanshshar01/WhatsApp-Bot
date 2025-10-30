# 🤖 Advanced WhatsApp Bot

A fully functional WhatsApp bot built with Node.js and whatsapp-web.js, featuring comprehensive automation, group management, media handling, and advanced security features.

## ✨ Features

### Basic Features
- ✅ Auto-response to incoming messages (greetings, help menu)
- ✅ Command handler system with prefix-based commands
- ✅ Send, receive, and forward messages (text, images, audio, documents)
- ✅ Typing and online presence simulation
- ✅ Comprehensive logging system
- ✅ Tag all group members

### Advanced Features
- 🛡️ Owner/admin permission system
- 👥 Complete group management (add/remove/promote/demote)
- 📊 User information and profile management
- 🎨 Auto-sticker creator from images and videos
- 🚫 Anti-spam, anti-link, and profanity filters
- 💾 SQLite database for persistent storage
- ⏱️ Command cooldowns and rate limiting
- 👋 Custom welcome and goodbye messages
- 📥 Media download and storage
- 📡 Broadcast messages to all groups

## 📁 Project Structure

```
whatsapp-bot/
├── commands/           # Command files
│   ├── help.js
│   ├── ping.js
│   ├── about.js
│   ├── menu.js
│   ├── tagall.js
│   ├── add.js
│   ├── remove.js
│   ├── promote.js
│   ├── demote.js
│   ├── groupinfo.js
│   ├── sticker.js
│   ├── download.js
│   ├── antilink.js
│   ├── antispam.js
│   ├── welcome.js
│   ├── goodbye.js
│   ├── broadcast.js
│   ├── block.js
│   ├── unblock.js
│   ├── leave.js
│   └── stats.js
├── database/          # Database management
│   └── database.js
├── events/            # Event handlers
│   ├── messageHandler.js
│   └── groupHandler.js
├── utils/             # Utility functions
│   ├── logger.js
│   ├── helpers.js
│   ├── cooldown.js
│   └── commandHandler.js
├── media/             # Media storage
│   ├── downloads/
│   ├── temp/
│   └── stickers/
├── logs/              # Log files
├── index.js           # Main bot file
├── config.js          # Configuration
├── package.json       # Dependencies
├── .env.example       # Environment variables template
└── README.md          # This file
```

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- A WhatsApp account

### Step 1: Clone or Download

```bash
# If using git
git clone <repository-url>
cd whatsapp-bot

# Or download and extract the ZIP file
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- whatsapp-web.js (WhatsApp Web API)
- qrcode-terminal (QR code display)
- dotenv (Environment variables)
- axios (HTTP requests)
- moment (Date/time formatting)
- fs-extra (File system utilities)
- sharp (Image processing)
- fluent-ffmpeg (Video processing)
- better-sqlite3 (Database)
- chalk (Terminal colors)

### Step 3: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings
nano .env  # or use any text editor
```

**Important Configuration:**
```env
BOT_NAME=WhatsApp Bot
PREFIX=/
OWNER_NUMBERS=919876543210,918765432109  # Replace with your numbers
ENABLE_AUTO_RESPONSE=true
ENABLE_ANTI_SPAM=true
ENABLE_ANTI_LINK=true
```

### Step 4: Run the Bot

```bash
# Start the bot
npm start

# Or for development with auto-restart
npm run dev
```

### Step 5: Scan QR Code

1. When you run the bot, a QR code will appear in the terminal
2. Open WhatsApp on your phone
3. Go to Settings → Linked Devices → Link a Device
4. Scan the QR code displayed in the terminal
5. Wait for authentication to complete

**Success!** Your bot is now running! 🎉

## 📱 Usage

### Basic Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/help` | Show all commands | `/help` or `/help <command>` |
| `/menu` | Quick command menu | `/menu` |
| `/ping` | Check bot status | `/ping` |
| `/about` | Bot information | `/about` |

### Media Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/sticker` | Convert image/video to sticker | `/sticker` (reply to media) |
| `/download` | Download and save media | `/download` (reply to media) |

### Group Commands (Admin Only)

| Command | Description | Usage |
|---------|-------------|-------|
| `/tagall` | Tag all members | `/tagall [message]` |
| `/add` | Add member to group | `/add <number>` |
| `/remove` | Remove member | `/remove <@mention>` |
| `/promote` | Promote to admin | `/promote <@mention>` |
| `/demote` | Demote from admin | `/demote <@mention>` |
| `/groupinfo` | Show group details | `/groupinfo` |
| `/antilink` | Toggle anti-link filter | `/antilink <on\|off>` |
| `/antispam` | Toggle anti-spam filter | `/antispam <on\|off>` |
| `/welcome` | Manage welcome messages | `/welcome <on\|off\|set message>` |
| `/goodbye` | Manage goodbye messages | `/goodbye <on\|off\|set message>` |

### Owner Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/broadcast` | Send to all groups | `/broadcast <message>` |
| `/block` | Block user from bot | `/block <@mention>` |
| `/unblock` | Unblock user | `/unblock <@mention>` |
| `/leave` | Leave group | `/leave` |
| `/stats` | Bot statistics | `/stats` |

## 🔧 Adding New Commands

Creating a new command is easy! Follow this template:

```javascript
// commands/mycommand.js
module.exports = {
    name: 'mycommand',
    aliases: ['mc', 'mycmd'],
    description: 'Description of what the command does',
    usage: '/mycommand <args>',
    cooldown: 5000, // 5 seconds
    groupOnly: false, // Set true if only for groups
    adminOnly: false, // Set true if only for admins
    ownerOnly: false, // Set true if only for owners
    category: 'basic', // basic, media, group, admin, owner
    
    async execute(client, message, args) {
        try {
            // Your command logic here
            await message.reply('Hello from my command!');
        } catch (error) {
            console.error('Error:', error);
            await message.reply('❌ An error occurred.');
        }
    }
};
```

Save the file in the `commands/` directory and restart the bot. The command will be automatically loaded!

## 🌐 Deployment Options

### Option 1: Local Machine / VPS

**Advantages:**
- Full control
- No resource limitations
- Best performance

**Steps:**
1. Follow installation steps above
2. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start index.js --name whatsapp-bot
pm2 save
pm2 startup
```

### Option 2: Railway.app

**Advantages:**
- Free tier available
- Easy deployment
- Automatic restarts

**Steps:**
1. Create account on [railway.app](https://railway.app)
2. Create new project from GitHub
3. Add environment variables in Railway dashboard
4. Deploy!

**Note:** Railway may require credit card for verification.

### Option 3: Replit

**Advantages:**
- Free tier
- Browser-based IDE
- Easy to use

**Steps:**
1. Create account on [replit.com](https://replit.com)
2. Create new Node.js Repl
3. Upload all files
4. Add secrets (environment variables)
5. Click Run

**Important:** Keep the Repl alive using UptimeRobot or similar service.

### Option 4: VPS (DigitalOcean, Linode, AWS)

**Advantages:**
- Professional hosting
- Scalable
- Reliable

**Steps:**
1. Create a VPS instance
2. SSH into your server
3. Install Node.js and dependencies
4. Clone/upload bot files
5. Use PM2 or systemd for process management
6. Set up firewall and security

## 🔒 Security Best Practices

1. **Never share your `.env` file** - It contains sensitive information
2. **Keep owner numbers private** - Only trusted numbers should be owners
3. **Regular updates** - Keep dependencies updated
4. **Monitor logs** - Check logs regularly for suspicious activity
5. **Use strong filters** - Enable anti-spam and anti-link in public groups
6. **Backup database** - Regularly backup your `bot.db` file

## 🐛 Troubleshooting

### QR Code Not Appearing
- Make sure terminal supports QR code display
- Try running in a different terminal
- Check internet connection

### Authentication Failed
- Delete `.wwebjs_auth` folder and try again
- Make sure WhatsApp is not logged in on another device
- Check if WhatsApp Web is working in browser

### Bot Not Responding
- Check if bot is running (`pm2 status` if using PM2)
- Check logs in `logs/` directory
- Verify environment variables are set correctly
- Ensure owner numbers are in correct format

### Commands Not Working
- Verify prefix is correct in `.env`
- Check command cooldowns
- Ensure user has required permissions
- Check logs for error messages

### Database Errors
- Ensure `database/` directory exists and is writable
- Check SQLite installation
- Backup and recreate database if corrupted

### Media Download Issues
- Ensure `media/` directories exist
- Check file size limits
- Verify sharp and ffmpeg are installed correctly

## 📊 Database Schema

The bot uses SQLite with the following tables:

- **users** - User information and blocking
- **groups** - Group settings and configuration
- **group_settings** - Custom messages and preferences
- **warnings** - User warnings and violations
- **command_stats** - Command usage statistics

## 🔄 Session Management

The bot uses `LocalAuth` strategy which:
- Stores session in `.wwebjs_auth/` directory
- Persists across restarts
- Handles reconnection automatically
- No need to scan QR code every time

**To reset session:**
```bash
rm -rf .wwebjs_auth/
rm -rf .wwebjs_cache/
```

## 📝 Logging

Logs are stored in `logs/` directory:
- Daily log files: `bot-YYYY-MM-DD.log`
- Includes all events, commands, and errors
- Automatic log rotation

## 🤝 Contributing

Want to add features or fix bugs?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - Feel free to use and modify!

## 🆘 Support

Having issues? Here's how to get help:

1. Check this README thoroughly
2. Review the troubleshooting section
3. Check logs for error messages
4. Search for similar issues online
5. Create an issue with detailed information

## 🎯 Roadmap

Future features planned:
- [ ] AI-powered responses
- [ ] Multi-language support
- [ ] Web dashboard
- [ ] Advanced analytics
- [ ] Plugin system
- [ ] Voice message handling
- [ ] Scheduled messages
- [ ] Auto-reply templates

## ⚠️ Disclaimer

This bot is for educational purposes. Use responsibly and follow WhatsApp's Terms of Service. The developers are not responsible for any misuse or violations.

## 🌟 Credits

Built with:
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- Node.js
- SQLite
- And many other amazing open-source libraries

---

**Made with ❤️ for the WhatsApp automation community**

For questions or suggestions, feel free to reach out!
