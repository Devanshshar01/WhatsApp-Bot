# 🤖 Advanced WhatsApp Bot

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![WhatsApp](https://img.shields.io/badge/WhatsApp_Web.js-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)

</div>

A powerful, feature-rich WhatsApp automation bot built with **Node.js** and **whatsapp-web.js**. This bot is designed for groups and personal use, offering comprehensive moderation, utility tools, media handling, and a full-stack **Admin Dashboard**.

---

## ✨ Features

### 🛡️ Moderation & Safety
*   **Kick/Ban/Mute**: Powerful commands to manage unruly users (`/kick`, `/ban`, `/mute`).
*   **Anti-Spam**: Intelligent rate limiting and spam detection.
*   **Anti-Link**: Automatically delete links from non-admins.
*   **Profanity Filter**: Keep your chat clean.
*   **Log System**: Detailed event logging.
*   **Mute Info**: Check mute status and expiry (`/muteinfo`).

### 👥 Group Management
*   **Tag All**: Mention everyone in the group with one command.
*   **Welcome/Goodbye**: Customizable automated messages for join/leave events.
*   **Promote/Demote**: Manage group admins easily.
*   **Group Info**: Get detailed statistics about the group.

### 🛠️ Utilities
*   **AI Chat**: Chat with Google Gemini AI (`/ai tell me a joke`).
*   **Translate**: Multi-language translation.
*   **Define**: Dictionary definitions.
*   **Math**: Advanced calculator (powered by `expr-eval`).
*   **Reminders**: Set persistent reminders (`/remind 10m check oven`).
*   **Weather**: Real-time weather updates.
*   **Conversion**: Currency, Polls, and more.

### 🤖 Automation (NEW!)
*   **AFK System**: Set away status, auto-notify when mentioned (`/afk`).
*   **Command Aliases**: Create personal shortcuts (`/alias add gm broadcast Good morning!`).
*   **Auto-Reply Rules**: Custom triggers with exact/contains/regex matching (`/autoreply`).
*   **Scheduled Messages**: Automated timed messages with cron support (`/schedule`).

### 🎬 Media
*   **Stickers**: Convert Images/Videos to stickers instantly (`/sticker`).
*   **Download**: Download 'View Once' media and status updates (`/download`).

### 📊 Admin Dashboard
*   A modern **web interface** to manage your bot (located in `admin-panel/`).
*   View logs, manage users, and configure settings visually.
*   Real-time analytics.

---

## 🚀 Getting Started

### Prerequisites

*   **Node.js** (v18 or higher recommended)
*   **Git**
*   **WhatsApp Account** (on a phone)

### 📥 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/whatsapp-bot.git
    cd whatsapp-bot/wpbot
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    npm install expr-eval  # Required for calculator
    ```

3.  **Configuration**
    *   Rename `.env.example` to `.env`.
    *   Open `.env` and configure your settings:
        ```env
        PREFIX=/
        OWNER_NUMBERS=1234567890
        DEFAULT_COUNTRY_CODE=1
        DEBUG_MODE=false
        
        # Optional: Get free API key from https://ai.google.dev/
        GEMINI_API_KEY=your_api_key_here
        ```

---

## 🖥️ Running the Bot

1.  **Start the Bot**
    ```bash
    npm start
    ```
    *First run will generate a QR Code in the terminal.*

2.  **Authenticate**
    *   Open WhatsApp on your phone.
    *   Go to **Linked Devices** > **Link a Device**.
    *   Scan the QR code shown in your terminal.

3.  **Ready!**
    *   The bot will log `✅ WhatsApp Bot is ready!`.

---

## 🎛️ Admin Panel Setup

The bot comes with a beautiful web dashboard located in `admin-panel/`.

### Option 1: Development Mode (Recommended for testing)
Open a new terminal and run:
```bash
cd admin-panel
npm install
npm run dev
```
Visit `http://localhost:5173` (or the port shown).

### Option 2: Production Build (Integrated)
To serve the admin panel directly from the bot server:
1.  **Build the panel:**
    ```bash
    npm run admin:build
    ```
2.  **Start the bot:**
    ```bash
    npm start
    ```
3.  Access the panel at `http://localhost:4000/admin` (default port).

---

## 📚 Command List

### 👮 Moderation
| Command | Alias | Description | Usage |
| :--- | :--- | :--- | :--- |
| `/kick` | `remove` | Remove user from group | `/kick @user [reason]` |
| `/block` | `ban` | Block user from bot | `/block @user` |
| `/unblock` | `unban` | Unblock user | `/unblock @user` |
| `/mute` | `tempmute` | Mute user temporarily | `/mute @user 30m [reason]` |
| `/unmute` | - | Unmute user | `/unmute @user` |
| `/muteinfo` | - | Check mute status | `/muteinfo @user` |
| `/warn` | - | Warn a user | `/warn @user [reason]` |
| `/unwarn` | - | Remove warnings | `/unwarn @user` |
| `/warnings` | `warns` | Check user warnings | `/warnings @user` |
| `/clear` | - | Clear specific case | `/clear CASE-001` |

### 👥 Group Admin
| Command | Alias | Description | Usage |
| :--- | :--- | :--- | :--- |
| `/tagall` | `everyone` | Mention all members | `/tagall [message]` |
| `/promote` | `admin` | Make user admin | `/promote @user` |
| `/demote` | `unadmin` | Dismiss admin | `/demote @user` |
| `/welcome` | - | Manage welcome msg | `/welcome [on/off/set]` |
| `/goodbye` | - | Manage goodbye msg | `/goodbye [on/off/set]` |
| `/link` | `invite` | Get group link/QR | `/link` |
| `/groupinfo` | `stats` | Group statistics | `/groupinfo` |

### 🛠️ Tools & Utility
| Command | Alias | Description | Usage |
| :--- | :--- | :--- | :--- |
| `/ai` | `ask`, `chat` | Chat with AI | `/ai What is 2+2?` |
| `/sticker` | `s` | Create sticker from image/video | Reply with `/s` |
| `/translate` | `tr` | Translate text | `/tr es Hello` |
| `/define` | `dict` | Get word definition | `/define serendipity` |
| `/remind` | - | Set a reminder | `/remind 10m check food` |
| `/calc` | - | Calculate math expression | `/calc 5 * 10` |
| `/weather` | - | Get weather info | `/weather London` |
| `/shorturl` | - | Shorten long links | `/shorturl <link>` |
| `/download` | - | Download view-once/status | `/download` (Reply to media) |

### 🤖 Automation
| Command | Alias | Description | Usage |
| :--- | :--- | :--- | :--- |
| `/afk` | `away` | Set AFK status | `/afk lunch break` |
| `/alias` | - | Create command shortcuts | `/alias add gm broadcast Good morning` |
| `/autoreply` | `ar` | Custom auto-reply rules | `/autoreply add "hi" -> "Hello!"` |
| `/schedule` | `cron` | Schedule timed messages | `/schedule 9:00 daily Good morning!` |

### ⚙️ General
| Command | Alias | Description | Usage |
| :--- | :--- | :--- | :--- |
| `/help` | `menu` | Show all commands | `/help` |
| `/ping` | - | Check bot latency | `/ping` |
| `/about` | - | Bot information | `/about` |
| `/profile` | - | Your user profile | `/profile` |

---

## ⚙️ Deployment (PM2)

For 24/7 hosting, use **PM2**:

1.  Install PM2:
    ```bash
    npm install pm2 -g
    ```
2.  Start with ecosystem file:
    ```bash
    pm2 start ecosystem.config.js
    ```
3.  Monitor:
    ```bash
    pm2 monit
    ```

---

## ❓ Troubleshooting

*   **Puppeteer Issues?**
    If the browser doesn't start, try installing Chrome manually or checking `.wwebjs_auth` folder permissions.
*   **FFmpeg Missing?**
    For stickers/audio to work, ensure FFmpeg is installed on your system and added to PATH.

---

made with ❤️
