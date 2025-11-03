# 🤖 WhatsApp Automation Suite

A production-ready WhatsApp bot powered by [Node.js](https://nodejs.org/) and [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js). It includes a modern command framework, group moderation tools, webhook integrations, and deployment guides so you can ship reliable automation fast.

---

## 📚 Table of Contents
1. [Features](#-features)
2. [Project Structure](#-project-structure)
3. [Getting Started](#-getting-started)
4. [Configuration](#-configuration)
5. [Usage](#-usage)
6. [Deployment](#-deployment)
7. [Security](#-security)
8. [Troubleshooting](#-troubleshooting)
9. [Contributing](#-contributing)
10. [License](#-license)

---

## ✨ Features

- **Comprehensive Command System**: Cooldowns, aliases, owner/admin gating, and user blocking.
- **Group Management**: Welcome/goodbye messages, anti-link and anti-spam filters, promotions/demotions, and a warning system.
- **Media Utilities**: Sticker conversion, media downloads, QR code generation, and URL shortening.
- **Utility Arsenal**: Translation, weather, reminders, polls, calculator, timer, dictionary, and currency conversion.
- **Fun Interactions**: Compliments, roasts, and a collection of flirty pickup lines.
- **Express Webhook Server**: Exposes `/health` and `/send` endpoints for integrations.
- **JSON-Backed Persistence**: `database/bot.json` for storing users, groups, warnings, and command metrics.
- **Admin Panel**: A React-based admin panel for live metrics, user/group management, command toggles, and a log viewer.

---

## 🏗️ Project Structure

```
wpbot/
├── admin/                 # Admin panel server
├── admin-panel/           # React-based admin panel
├── commands/              # Modular command implementations
├── database/              # Database files
│   └── database.js        # Persistence helper
├── events/                # Message and group event handlers
├── utils/                 # Helper functions, logger, cooldown, and command loader
├── media/                 # Downloaded media, temporary files, and generated stickers
├── logs/                  # Rotating logs
├── .env.example           # Example environment file
├── bot-server.js          # WhatsApp client and Express bootstrap
├── config.js              # Project configuration
├── index.js               # Main entry point
└── README.md              # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm
- Git (optional)
- A dedicated WhatsApp account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/WhatsApp-Bot.git
   cd WhatsApp-Bot/wpbot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your environment:**
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Open the `.env` file and fill in the required variables, such as `BOT_NAME`, `PREFIX`, and `OWNER_NUMBERS`.

4. **Start the bot:**
   ```bash
   npm start
   ```

5. **Scan the QR Code:**
   - A QR code will appear in your terminal.
   - Open WhatsApp on your phone, go to **Settings > Linked Devices > Link a Device**, and scan the QR code.

Once the client is ready, you can start interacting with the bot from any WhatsApp account other than the one you used to scan the QR code.

---

## 🔧 Configuration

The bot can be configured through the `.env` file. Here are some of the most important variables:

| Variable | Description |
|----------|-------------|
| `BOT_NAME` | The display name of the bot in responses and help panels. |
| `PREFIX` | The command prefix (default is `/`). |
| `OWNER_NUMBERS` | A comma-separated list of international numbers with owner privileges. |
| `DATABASE_PATH` | The path to the JSON database file (defaults to `database/bot.json`). |
| `ENABLE_AUTO_RESPONSE` | A feature flag to enable or disable auto-responses. |
| `ENABLE_ANTI_SPAM` | A feature flag to enable or disable the anti-spam filter. |
| `ENABLE_ANTI_LINK` | A feature flag to enable or disable the anti-link filter. |

---

## 📱 Usage

The bot comes with a variety of commands, which are organized into the following categories:

- **Basic**: `/help`, `/menu`, `/ping`, `/about`, `/profile`
- **Media**: `/sticker`, `/download`, `/qrcode`, `/shorturl`
- **Utility**: `/translate`, `/weather`, `/remind`, `/poll`, `/calc`, `/timer`, `/define`, `/currency`
- **Fun**: `/compliment`, `/insult`, `/flirt`
- **Group (Admin/Owner)**: `/tagall`, `/add`, `/remove`, `/promote`, `/demote`, `/groupinfo`, `/antilink`, `/antispam`, `/welcome`, `/goodbye`
- **Owner**: `/broadcast`, `/block`, `/unblock`, `/leave`

To see a full list of commands and their descriptions, use the `/help` command.

---

## 🚀 Deployment

The bot can be deployed to any server that supports Node.js. Here are a few options:

- **Local Machine/VPS**: The most straightforward way to deploy the bot. Use a process manager like PM2 to keep the bot running in the background.
- **Oracle Cloud Always Free**: A great option for a free, 24/7 server.
- **Railway.app**: A platform with a free tier and easy deployment from a GitHub repository.
- **Render.com**: A platform with a free tier that sleeps after 15 minutes of inactivity.
- **Fly.io**: A lightweight VM with limited free credits.

> **Note**: Serverless platforms like Vercel and Netlify are not suitable for this bot, as it requires a persistent process.

---

## 🔐 Security

- Keep your `.env` file, `database/bot.json`, and `.wwebjs_auth/` directory private and out of version control.
- Limit the `OWNER_NUMBERS` to trusted admins.
- Enable the anti-spam and anti-link filters for public groups.
- Regularly monitor the `logs/` directory for any suspicious activity.
- Keep the bot's dependencies up to date by running `npm audit fix`.

---

## 🩺 Troubleshooting

| Symptom | Likely Cause | Resolution |
|---------|--------------|------------|
| QR code not visible | Terminal/SSH client incompatibility | Switch to a different terminal, use the `qr-image` output, or check your internet connection. |
| Authentication fails | Stale session | Delete the `.wwebjs_auth/` and `.wwebjs_cache/` directories, restart the bot, and re-scan the QR code. |
| Bot unresponsive | Process crash, wrong prefix, or rate limit | Inspect the console or PM2 logs, verify the `PREFIX` in your `.env` file, and check the command cooldowns. |
| Admin command denied | Multi-device ID not recognized | Ensure the user is an admin or owner. The `helpers.isGroupAdmin` function handles `@lid` IDs. |
| Media download error | File too large or missing dependencies | Respect the `config.maxMediaSize` setting and install `sharp` and `ffmpeg`. |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/<idea>`).
3. Follow the existing code structure and style.
4. Add tests and documentation where relevant.
5. Submit a pull request with a clear description of your changes.

---

## 📄 License

This project is released under the MIT License. See the `LICENSE` file for details.
