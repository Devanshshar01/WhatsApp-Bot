# 🤖 WhatsApp Automation Suite

A production-ready WhatsApp bot powered by [Node.js](https://nodejs.org/) and [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js). It includes a modern command framework, group moderation tools, webhook integrations, and deployment guides so you can ship reliable automation fast.

---

## 📚 Table of Contents
1. [Highlights](#-highlights)
2. [Architecture Overview](#-architecture-overview)
3. [Quick Start](#-quick-start)
4. [Configuration](#-configuration)
5. [Command Catalogue](#-command-catalogue)
6. [Advanced Utilities](#-advanced-utilities)
7. [Deployment Playbook](#-deployment-playbook)
8. [Security Checklist](#-security-checklist)
9. [Troubleshooting](#-troubleshooting)
10. [Roadmap](#-roadmap)
11. [Contributing & License](#-contributing--license)

---

## ✨ Highlights
- Comprehensive command system with cooldowns, aliases, owner/admin gating, and user blocking.
- Group management suite: welcome/goodbye flows, anti-link & anti-spam filters, promotions/demotions, warning tracking.
- Media utilities: sticker conversion, safe media downloads with re-share, QR generation, URL shortener.
- Utility arsenal: translation, weather, reminders, polls, calculator, timer, dictionary definitions, currency conversion, profile analytics.
- Fun interactions: compliments, roasts, and 100+ flirty pickup lines (all rate limited).
- Express webhook server exposing `/health` and `/send` endpoints for integrations.
- JSON-backed persistence (`database/bot.json`) + structured logging for audits.
- React-enabled admin panel for live metrics, user/group management, command toggles, log viewer, and manual messaging.

---

## 🏗️ Architecture Overview

```
wpbot/
├── bot-server.js          # WhatsApp client & Express bootstrap
├── commands/              # Modular command implementations
├── database/
│   ├── bot.json           # Runtime data (users, groups, stats)
│   └── database.js        # Persistence helper
├── events/                # Message/group handlers
├── utils/                 # Helpers, logger, cooldown, command loader
├── media/                 # Downloads, temp files, generated stickers
├── logs/                  # Rotating logs
├── run.sh / ecosystem.config.js
├── DEPLOYMENT.md / TESTING.md / UTILITY_COMMANDS.md
└── README.md
```

- `bot-server.js` wires LocalAuth, QR handling, reconnect logic, and Express routes; delegates message processing to `events/messageHandler.js`.
- `utils/commandHandler.js` loads every `commands/*.js`, registers aliases, enforces permissions, tracks cooldowns, and logs usage via `database/database.js`.
- `database/bot.json` stores users, groups, warnings, command metrics, and config flags with zero external dependencies.
- Additional docs (`DEPLOYMENT.md`, `TESTING.md`, `UTILITY_COMMANDS.md`) cover hosting, QA, and reference usage.

---

## ⚡ Quick Start

> Requirements: Node.js 18+, npm, Git (optional), and a dedicated WhatsApp account that stays logged in on a phone.

```bash
# 1. Clone and install
git clone https://github.com/<your-username>/WhatsApp-Bot.git
cd WhatsApp-Bot/wpbot
npm install

# 2. Configure environment
cp .env.example .env
nano .env    # fill BOT_NAME, PREFIX, OWNER_NUMBERS, etc.

# (Optional) 3. Configure admin panel credentials
ADMIN_PASSWORD=super-secret
ADMIN_JWT_SECRET=generate-a-strong-secret

# 3. Launch & scan QR
npm start    # QR renders in terminal (WhatsApp > Linked Devices)

# Optional: auto-reload during development
npm run dev

# Optional: run admin panel locally (separate terminal)
npm run admin:dev
open http://localhost:5173

# Optional: auto-reload during development
npm run dev
```

Wait for **Client is ready!**, then interact from any WhatsApp account other than the one that scanned the QR.

---

## 🔧 Configuration

| Variable | Description |
|----------|-------------|
| `BOT_NAME` | Display name in responses/help panels |
| `PREFIX` | Command prefix (default `/`) |
| `OWNER_NUMBERS` | Comma-separated list of international numbers with owner privileges |
| `DATABASE_PATH` | JSON database path (defaults to `database/bot.json`) |
| `ENABLE_AUTO_RESPONSE`, `ENABLE_ANTI_SPAM`, `ENABLE_ANTI_LINK` | Feature flags |
| `MEDIA_MAX_SIZE`, `RATE_LIMIT_WINDOW`, etc. | Additional runtime tuning |

> Sensitive data (`.env`, `.wwebjs_auth/`, `database/*.json`, `logs/`, `media/`) is already gitignored. Keep it private.

---

## 🧰 Command Catalogue

### Basic
- `/help [command]` – detailed documentation.
- `/menu` – category overview.
- `/ping` – latency & uptime check.
- `/about` – bot metadata and stats.
- `/profile [@user|reply|number]` – user usage history.

### Utility
- `/translate <lang> <text>` – instant translation (Google).
- `/weather <city>` – weather snapshot (wttr.in).
- `/remind <time> <message>` – reminders from 1 minute to 7 days.
- `/poll question | opt1 | opt2` – create quick polls.
- `/calc <expression>` – math evaluation with functions.
- `/timer start|stop|check [duration]` – countdowns & stopwatch.
- `/define <word>` – dictionary lookups.
- `/currency <amount> <from> <to>` – exchange rates.
- `/qrcode <text>` – generate QR images.
- `/shorturl <url>` – shorten links (TinyURL API).

### Media
- `/sticker` – convert replied media into stickers.
- `/download` – save media and return the file.

### Fun
- `/compliment [target]` – wholesome compliments.
- `/insult [target]` – playful roasts.
- `/flirt [target]` – curated pickup lines.

### Group (Admin)
- `/tagall`, `/add`, `/remove`, `/promote`, `/demote`, `/groupinfo` – manage members.
- `/antilink`, `/antispam` – toggle group protections.
- `/welcome`, `/goodbye` – automate greetings.
- `/mute`, `/unmute` – temporary moderation.
- `/warn`, `/unwarn`, `/warnings` – warning lifecycle.
- `/clear <caseId>` – delete moderation log entry.

### Owner
- `/broadcast` – message every group.
- `/block`, `/unblock` – manage blocked users.
- `/leave` – force the bot to exit a group.
- `/stats` – overall bot analytics.

Commands are auto-loaded from `commands/`; use `_template.js` or any existing file as a reference and restart the bot to activate new modules.

---

## 🧪 Advanced Utilities
- **Profile analytics** – message counts, timestamps, blocked state tracked in `database/bot.json`.
- **Blocking system** – `/block` updates `is_blocked` to silently ignore users.
- **Auto-responses** – configure greeting/help replies via `config.autoResponses`.
- **Webhooks** – `GET /health`, `POST /send` handled by Express for monitoring/integrations.
- **Logging** – structured console output plus rotating text logs under `logs/`.

Full usage examples live in `UTILITY_COMMANDS.md`.

---

## 🚀 Deployment Playbook

### Local machine or VPS (Ubuntu 22.04+)
1. Install Node.js 18+, Chrome/Puppeteer dependencies (see DEPLOYMENT.md).
2. Clone project, configure `.env`, run `npm install`.
3. Start via PM2 for resilience:
   ```bash
   pm2 start bot-server.js --name whatsapp-bot
   pm2 save
   pm2 startup
   ```
4. Keep the paired phone online—WhatsApp Web sessions require it.

### Oracle Cloud Always Free (24/7 recommended)
- Provision Ampere A1 VM → install Node.js + Chromium deps → copy project → configure `.env` → run with PM2. Detailed steps in DEPLOYMENT.md.

### Alternative platforms
| Platform | Notes |
|----------|-------|
| **Railway.app** | Great DX, free 500 compute hours/month (~20 days); upgrade for full uptime. |
| **Render.com** | Free tier sleeps after 15 min idle; wakes on traffic. |
| **Fly.io** | Lightweight VM with limited free credits; CLI heavy. |
| **Google Cloud / Oracle Cloud** | Always-on VMs; requires manual security hardening. |

> Serverless hosts (Vercel, Netlify, etc.) are unsuitable—`whatsapp-web.js` requires a persistent process.

---

## 🔐 Security Checklist
1. Keep `.env`, `database/bot.json`, `.wwebjs_auth/` outside version control and with restricted access.
2. Limit `OWNER_NUMBERS` to trusted admins only.
3. Enable anti-spam/anti-link for public groups and audit warnings periodically.
4. Monitor `logs/` and command usage for anomalies.
5. Regularly update dependencies (`npm audit fix`) and patch the OS.
6. Back up `database/` and `.wwebjs_auth/` before migrating or redeploying servers.

---

## 🩺 Troubleshooting

| Symptom | Likely Cause | Resolution |
|---------|--------------|------------|
| QR code not visible | Terminal/SSH client incompatibility | Switch terminal, use `qr-image` output, check internet |
| Authentication fails | Stale session | Delete `.wwebjs_auth/` + `.wwebjs_cache/`, restart, re-scan |
| Bot unresponsive | Process crash, wrong prefix, or rate limit | Inspect console/PM2 logs; verify `PREFIX`; watch cooldowns |
| Admin command denied | Multi-device ID not recognized | Ensure user is admin/owner; `helpers.isGroupAdmin` handles `@lid` IDs |
| Media download error | File too large or missing dependencies | Respect `config.maxMediaSize`; install `sharp`/`ffmpeg` |

The TESTING.md guide walks through structured QA scenarios.

---

## 🛣️ Roadmap
- [ ] AI-assisted replies & summarization
- [ ] Multi-language localization
- [ ] Web dashboard & analytics
- [ ] Plugin ecosystem for third-party modules
- [ ] Scheduled & recurring messages
- [ ] Voice-to-text (Whisper) integration
- [ ] Advanced moderation (keyword monitors, throttling)

---

## 🤝 Contributing & License

Contributions are welcome!
1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/<idea>`).
3. Follow existing structure and style; add tests/docs when relevant.
4. Submit a PR with clear context and any supporting logs/screenshots.

Released under the **MIT License**. See `LICENSE` for details.

---

### 📬 Support
- Review this README plus DEPLOYMENT.md, TESTING.md, UTILITY_COMMANDS.md.
- Inspect `logs/` and real-time console output for diagnostics.
- Open a GitHub issue with reproduction steps if you get stuck.

### 🙏 Credits
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- Node.js ecosystem contributors (axios, express, puppeteer, sharp, qrcode-terminal, etc.)

Built with ❤️ to unlock reliable WhatsApp automation.

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
