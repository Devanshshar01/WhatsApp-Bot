# 📂 Project Structure

Complete overview of the WhatsApp Bot project structure and file organization.

## 🌳 Directory Tree

```
whatsapp-bot/
│
├── 📁 commands/                    # All bot commands
│   ├── _template.js               # Template for creating new commands
│   ├── help.js                    # Help command
│   ├── ping.js                    # Ping/status command
│   ├── about.js                   # Bot information
│   ├── menu.js                    # Quick menu
│   ├── tagall.js                  # Tag all members
│   ├── add.js                     # Add member to group
│   ├── remove.js                  # Remove member from group
│   ├── promote.js                 # Promote to admin
│   ├── demote.js                  # Demote from admin
│   ├── groupinfo.js               # Group information
│   ├── sticker.js                 # Create stickers
│   ├── download.js                # Download media
│   ├── antilink.js                # Anti-link filter
│   ├── antispam.js                # Anti-spam filter
│   ├── welcome.js                 # Welcome messages
│   ├── goodbye.js                 # Goodbye messages
│   ├── broadcast.js               # Broadcast to all groups
│   ├── block.js                   # Block user
│   ├── unblock.js                 # Unblock user
│   ├── leave.js                   # Leave group
│   └── stats.js                   # Bot statistics
│
├── 📁 database/                    # Database management
│   └── database.js                # SQLite database handler
│
├── 📁 events/                      # Event handlers
│   ├── messageHandler.js          # Message processing
│   └── groupHandler.js            # Group events (join/leave)
│
├── 📁 utils/                       # Utility functions
│   ├── logger.js                  # Logging system
│   ├── helpers.js                 # Helper functions
│   ├── cooldown.js                # Cooldown manager
│   └── commandHandler.js          # Command loader and executor
│
├── 📁 media/                       # Media storage
│   ├── downloads/                 # Downloaded media files
│   ├── temp/                      # Temporary files
│   └── stickers/                  # Generated stickers
│
├── 📁 logs/                        # Log files
│   └── bot-YYYY-MM-DD.log        # Daily log files
│
├── 📁 .wwebjs_auth/               # WhatsApp session (auto-generated)
│   └── session-*/                 # Session data
│
├── 📁 .wwebjs_cache/              # WhatsApp cache (auto-generated)
│
├── 📄 index.js                     # Main bot entry point
├── 📄 config.js                    # Configuration file
├── 📄 package.json                 # Dependencies and scripts
├── 📄 .env                         # Environment variables (create from .env.example)
├── 📄 .env.example                 # Environment template
├── 📄 .gitignore                   # Git ignore rules
│
├── 📄 README.md                    # Main documentation
├── 📄 SETUP_GUIDE.md              # Detailed setup instructions
├── 📄 COMMANDS.md                  # Command reference
├── 📄 CONTRIBUTING.md              # Contribution guidelines
├── 📄 PROJECT_STRUCTURE.md         # This file
│
├── 📄 start.sh                     # Linux/Mac startup script
└── 📄 start.bat                    # Windows startup script
```

## 📋 File Descriptions

### Core Files

#### `index.js`
**Purpose:** Main entry point of the bot  
**Responsibilities:**
- Initialize WhatsApp client
- Handle QR code authentication
- Set up event listeners
- Manage reconnection
- Graceful shutdown

**Key Features:**
- Session management with LocalAuth
- QR code display
- Event routing
- Error handling
- Process management

---

#### `config.js`
**Purpose:** Central configuration  
**Contains:**
- Bot settings (name, prefix, owners)
- Feature toggles
- Rate limiting settings
- Auto-response messages
- Filter configurations

**Usage:**
```javascript
const config = require('./config');
console.log(config.botName);
console.log(config.prefix);
```

---

#### `package.json`
**Purpose:** Project metadata and dependencies  
**Contains:**
- Project information
- Dependencies list
- NPM scripts
- Version information

**Scripts:**
- `npm start` - Start bot
- `npm run dev` - Start with nodemon (auto-restart)

---

### Commands Directory

All command files follow this structure:

```javascript
module.exports = {
    name: 'commandname',
    aliases: ['alias1'],
    description: 'Description',
    usage: '/commandname <args>',
    cooldown: 5000,
    groupOnly: false,
    adminOnly: false,
    ownerOnly: false,
    category: 'basic',
    async execute(client, message, args) {
        // Command logic
    }
};
```

**Command Categories:**
- **Basic:** help, ping, about, menu
- **Media:** sticker, download
- **Group:** tagall, add, remove, promote, demote, groupinfo
- **Admin:** antilink, antispam, welcome, goodbye
- **Owner:** broadcast, block, unblock, leave, stats

---

### Database Directory

#### `database/database.js`
**Purpose:** Database operations  
**Features:**
- SQLite database management
- User tracking
- Group settings
- Warning system
- Command statistics

**Tables:**
- `users` - User information
- `groups` - Group settings
- `group_settings` - Custom messages
- `warnings` - User warnings
- `command_stats` - Usage statistics

**Usage:**
```javascript
const database = require('./database/database');
database.init();
const user = database.getUser(userId);
```

---

### Events Directory

#### `events/messageHandler.js`
**Purpose:** Process incoming messages  
**Handles:**
- Command detection
- Auto-responses
- Group filters (anti-link, anti-spam)
- User tracking
- Spam detection

**Flow:**
1. Receive message
2. Check if blocked
3. Update user database
4. Check for spam
5. Apply group filters
6. Process commands
7. Handle auto-responses

---

#### `events/groupHandler.js`
**Purpose:** Handle group events  
**Handles:**
- Member join events
- Member leave events
- Welcome messages
- Goodbye messages

**Features:**
- Custom message support
- Placeholder replacement
- Database integration

---

### Utils Directory

#### `utils/logger.js`
**Purpose:** Logging system  
**Features:**
- Console logging with colors
- File logging
- Daily log rotation
- Multiple log levels

**Methods:**
```javascript
logger.info('Information');
logger.success('Success message');
logger.warn('Warning');
logger.error('Error', error);
logger.debug('Debug info');
logger.command(user, command, chat);
```

---

#### `utils/helpers.js`
**Purpose:** Helper functions  
**Functions:**
- `isOwner(userId)` - Check if user is owner
- `isGroupAdmin(message)` - Check if user is admin
- `isBotGroupAdmin(message)` - Check if bot is admin
- `formatPhone(phone)` - Format phone number
- `sleep(ms)` - Delay execution
- `containsURL(text)` - Check for URLs
- `containsProfanity(text)` - Check for profanity
- `formatDuration(ms)` - Format time duration

---

#### `utils/cooldown.js`
**Purpose:** Command cooldown management  
**Features:**
- Per-user cooldowns
- Per-command cooldowns
- Spam detection
- Rate limiting

**Methods:**
```javascript
cooldown.isOnCooldown(userId, command);
cooldown.setCooldown(userId, command, duration);
cooldown.getRemainingTime(userId, command);
cooldown.isSpamming(userId);
```

---

#### `utils/commandHandler.js`
**Purpose:** Command management  
**Features:**
- Load commands from files
- Execute commands
- Permission checking
- Cooldown enforcement
- Error handling

**Methods:**
```javascript
commandHandler.loadCommands();
commandHandler.execute(client, message, command, args);
commandHandler.getCommand(name);
commandHandler.getAllCommands();
```

---

### Media Directory

#### `media/downloads/`
**Purpose:** Store downloaded media  
**Contents:** Images, videos, audio, documents downloaded via `/download` command

#### `media/temp/`
**Purpose:** Temporary file storage  
**Contents:** Temporary files during processing

#### `media/stickers/`
**Purpose:** Store generated stickers  
**Contents:** Sticker files created via `/sticker` command

---

### Logs Directory

#### `logs/bot-YYYY-MM-DD.log`
**Purpose:** Daily log files  
**Contains:**
- All bot activities
- Command executions
- Errors and warnings
- Message logs (if enabled)

**Format:**
```
[2024-01-15 10:30:45] [INFO] Bot started
[2024-01-15 10:31:12] [COMMAND] Command: help | User: 919876543210@c.us
[2024-01-15 10:32:05] [ERROR] Error in command: ...
```

---

## 🔄 Data Flow

### Message Processing Flow

```
Incoming Message
    ↓
messageHandler.handle()
    ↓
Check if blocked → [YES] → Ignore
    ↓ [NO]
Update user database
    ↓
Check for spam → [YES] → Send warning
    ↓ [NO]
Apply group filters
    ↓
Check for command prefix → [YES] → Execute command
    ↓ [NO]
Check for auto-response → [YES] → Send response
    ↓ [NO]
End
```

### Command Execution Flow

```
Command Detected
    ↓
commandHandler.execute()
    ↓
Check if command exists → [NO] → Ignore
    ↓ [YES]
Check if user blocked → [YES] → Send error
    ↓ [NO]
Check permissions → [FAIL] → Send error
    ↓ [PASS]
Check cooldown → [ON COOLDOWN] → Send warning
    ↓ [READY]
Execute command
    ↓
Set cooldown
    ↓
Log to database
    ↓
End
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    is_blocked INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    last_seen INTEGER,
    created_at INTEGER
);
```

### Groups Table
```sql
CREATE TABLE groups (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    welcome_enabled INTEGER DEFAULT 1,
    goodbye_enabled INTEGER DEFAULT 1,
    anti_link INTEGER DEFAULT 0,
    anti_spam INTEGER DEFAULT 0,
    profanity_filter INTEGER DEFAULT 0,
    created_at INTEGER
);
```

### Group Settings Table
```sql
CREATE TABLE group_settings (
    group_id TEXT PRIMARY KEY,
    welcome_message TEXT,
    goodbye_message TEXT,
    settings TEXT,
    FOREIGN KEY (group_id) REFERENCES groups(id)
);
```

### Warnings Table
```sql
CREATE TABLE warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    group_id TEXT,
    reason TEXT,
    warned_by TEXT,
    created_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
);
```

### Command Stats Table
```sql
CREATE TABLE command_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    command TEXT,
    user_id TEXT,
    group_id TEXT,
    executed_at INTEGER
);
```

---

## 🔧 Configuration Files

### `.env`
Environment-specific configuration:
```env
BOT_NAME=WhatsApp Bot
PREFIX=/
OWNER_NUMBERS=919876543210
DATABASE_PATH=./database/bot.db
ENABLE_AUTO_RESPONSE=true
COMMAND_COOLDOWN=3000
```

### `.gitignore`
Files to ignore in git:
```
node_modules/
.env
.wwebjs_auth/
database/*.db
media/downloads/*
logs/*.log
```

---

## 📦 Dependencies

### Production Dependencies
- **whatsapp-web.js** - WhatsApp Web API
- **qrcode-terminal** - QR code display
- **dotenv** - Environment variables
- **axios** - HTTP requests
- **moment** - Date/time formatting
- **fs-extra** - File system utilities
- **sharp** - Image processing
- **fluent-ffmpeg** - Video processing
- **better-sqlite3** - SQLite database
- **chalk** - Terminal colors

### Development Dependencies
- **nodemon** - Auto-restart on changes

---

## 🚀 Startup Process

1. **Load environment variables** from `.env`
2. **Initialize directories** (database, media, logs)
3. **Create WhatsApp client** with LocalAuth
4. **Set up event listeners**
5. **Initialize database** and create tables
6. **Load commands** from commands directory
7. **Display QR code** for authentication
8. **Wait for ready event**
9. **Start processing messages**

---

## 🔐 Security Considerations

### Sensitive Files
- `.env` - Contains owner numbers and settings
- `.wwebjs_auth/` - Contains session data
- `database/bot.db` - Contains user data

### Best Practices
- Never commit `.env` to git
- Keep session files secure
- Regular database backups
- Use strong owner verification
- Validate all user input

---

## 📊 Performance Considerations

### Memory Usage
- Session data: ~50-100MB
- Database: ~10-50MB
- Media cache: Variable
- Total: ~200-500MB typical

### CPU Usage
- Idle: ~1-5%
- Processing messages: ~10-30%
- Media processing: ~30-60%

### Disk Usage
- Code: ~50MB
- Dependencies: ~200MB
- Session: ~50MB
- Database: ~10-100MB
- Media: Variable
- Logs: ~10MB per month

---

## 🔄 Maintenance

### Regular Tasks
- **Daily:** Check logs for errors
- **Weekly:** Review command statistics
- **Monthly:** Backup database
- **Quarterly:** Update dependencies

### Backup Strategy
```bash
# Database backup
cp database/bot.db backups/bot-$(date +%Y%m%d).db

# Session backup
tar -czf backups/session-$(date +%Y%m%d).tar.gz .wwebjs_auth/
```

---

## 📚 Additional Resources

- **README.md** - Main documentation
- **SETUP_GUIDE.md** - Installation and setup
- **COMMANDS.md** - Command reference
- **CONTRIBUTING.md** - How to contribute

---

**Last Updated:** 2024-01-15  
**Version:** 1.0.0
