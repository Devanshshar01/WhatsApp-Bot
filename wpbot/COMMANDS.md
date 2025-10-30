# 📋 Command Reference

Complete list of all available commands with examples and details.

## 🎯 Command Format

```
/command [required] <optional>
```

- **Prefix:** `/` (configurable in .env)
- **Case-insensitive:** `/help` = `/HELP` = `/Help`
- **Aliases:** Most commands have shortcuts

---

## 📌 Basic Commands

### /help
Display all available commands or get help for a specific command.

**Aliases:** `h`, `commands`  
**Usage:**
```
/help                    # Show all commands
/help ping              # Get help for ping command
/help sticker           # Get help for sticker command
```

**Example Output:**
```
🤖 WhatsApp Bot - Command List

Prefix: /
Total Commands: 20

📌 Basic Commands:
/help - Display all available commands
/ping - Check bot response time
...
```

---

### /menu
Display a quick reference menu of commands.

**Aliases:** `m`  
**Usage:**
```
/menu
```

**Example Output:**
```
╔═══════════════════╗
║  🤖 BOT MENU 🤖  ║
╚═══════════════════╝

*📌 BASIC COMMANDS*
├ /help - Command list
├ /ping - Check status
...
```

---

### /ping
Check bot response time and status.

**Aliases:** `p`  
**Usage:**
```
/ping
```

**Example Output:**
```
🏓 Pong!

⚡ Response Time: 234ms
⏱️ Uptime: 2h 15m
📱 Bot Number: 919876543210
✅ Status: Online
```

---

### /about
Display detailed bot information.

**Aliases:** `info`, `botinfo`  
**Usage:**
```
/about
```

**Example Output:**
```
🤖 WhatsApp Bot

📝 Description:
Advanced WhatsApp bot with comprehensive features...

📊 Bot Statistics:
⏱️ Uptime: 2h 15m
📱 Number: 919876543210
...
```

---

## 🎨 Media Commands

### /sticker
Convert images or short videos into WhatsApp stickers.

**Aliases:** `s`, `stiker`  
**Usage:**
```
/sticker                        # Reply to image/video
[Send image] + /sticker         # With caption
```

**Supported Formats:**
- Images: JPG, PNG, WEBP
- Videos: MP4 (max 6 seconds)
- Max size: 16MB

**Example:**
1. Someone sends an image
2. Reply to it with `/sticker`
3. Bot creates and sends sticker

**Tips:**
- Images are auto-resized to 512x512
- Videos become animated stickers
- Transparent backgrounds supported

---

### /download
Download and save media from messages locally.

**Aliases:** `dl`, `save`  
**Usage:**
```
/download               # Reply to media message
```

**Supported Media:**
- Images (JPG, PNG, etc.)
- Videos (MP4, AVI, etc.)
- Audio (MP3, OGG, etc.)
- Documents (PDF, DOCX, etc.)

**Example Output:**
```
✅ Media Downloaded Successfully!

📁 Filename: media_1234567890.jpg
📊 Size: 2.45 MB
📂 Location: ./media/downloads/media_1234567890.jpg
🎯 Type: image/jpeg
```

**Storage Location:** `media/downloads/`

---

## 👥 Group Commands

### /tagall
Tag all members in a group with a custom message.

**Aliases:** `everyone`, `all`  
**Permissions:** Admin only  
**Usage:**
```
/tagall                          # Default message
/tagall Important announcement   # Custom message
/tagall Meeting at 5 PM today   # Another example
```

**Example Output:**
```
📢 Group Announcement

Important announcement

@919876543210 @918765432109 @447911123456 ...
```

**Notes:**
- Only group admins can use
- Tags all participants
- Use responsibly to avoid spam

---

### /add
Add a new member to the group.

**Aliases:** `invite`  
**Permissions:** Admin only  
**Bot Requirements:** Bot must be admin  
**Usage:**
```
/add 919876543210              # Add by number
/add +91 98765 43210          # With formatting
```

**Number Format:**
- Include country code
- Remove + and spaces
- Example: 919876543210 for +91 98765 43210

**Example Output:**
```
✅ Successfully added +919876543210 to the group.
```

**Error Messages:**
- `❌ Unable to add this user. They may have privacy settings...`
- `❌ This number is not registered on WhatsApp.`

---

### /remove
Remove a member from the group.

**Aliases:** `kick`  
**Permissions:** Admin only  
**Bot Requirements:** Bot must be admin  
**Usage:**
```
/remove @919876543210          # Mention user
/remove                        # Reply to user's message
```

**Example Output:**
```
✅ User has been removed from the group.
```

**Protection:**
- Cannot remove bot owners
- Cannot remove other admins (unless super admin)

---

### /promote
Promote a member to group admin.

**Aliases:** `admin`  
**Permissions:** Admin only  
**Bot Requirements:** Bot must be admin  
**Usage:**
```
/promote @919876543210         # Mention user
/promote                       # Reply to user's message
```

**Example Output:**
```
✅ @919876543210 has been promoted to admin.
```

---

### /demote
Demote an admin to regular member.

**Aliases:** `unadmin`  
**Permissions:** Admin only  
**Bot Requirements:** Bot must be admin  
**Usage:**
```
/demote @919876543210          # Mention user
/demote                        # Reply to user's message
```

**Example Output:**
```
✅ @919876543210 has been demoted to member.
```

**Protection:**
- Cannot demote bot owners

---

### /groupinfo
Display detailed information about the group.

**Aliases:** `ginfo`, `groupdetails`  
**Usage:**
```
/groupinfo
```

**Example Output:**
```
📊 Group Information

📝 Name: My Awesome Group
🆔 ID: 1234567890@g.us
📅 Created: 2024-01-15
👥 Total Members: 50
👑 Admins: 5
👤 Members: 45

📄 Description:
This is a group for discussing...
```

---

## 🛡️ Admin Commands

### /antilink
Toggle anti-link filter for the group.

**Aliases:** `al`  
**Permissions:** Admin only  
**Usage:**
```
/antilink                      # Check status
/antilink on                   # Enable filter
/antilink off                  # Disable filter
```

**Example Output:**
```
✅ Anti-link filter has been enabled.

Links will be automatically deleted (except allowed domains).
```

**How It Works:**
- Detects URLs in messages
- Deletes messages with disallowed links
- Warns the user
- Allowed domains configured in config.js

**Allowed Domains (default):**
- youtube.com
- youtu.be

**To Add More Domains:**
Edit `config.js`:
```javascript
allowedDomains: ['youtube.com', 'youtu.be', 'github.com']
```

---

### /antispam
Toggle anti-spam filter for the group.

**Aliases:** `as`  
**Permissions:** Admin only  
**Usage:**
```
/antispam                      # Check status
/antispam on                   # Enable filter
/antispam off                  # Disable filter
```

**Example Output:**
```
✅ Anti-spam filter has been enabled.

Users sending too many messages will be warned.
```

**How It Works:**
- Monitors message frequency
- Warns users sending too many messages
- Configurable threshold in config.js

**Default Settings:**
- Max 10 messages per minute
- Configurable in .env

---

### /welcome
Manage welcome messages for new members.

**Aliases:** `setwelcome`  
**Permissions:** Admin only  
**Usage:**
```
/welcome                                    # Check status
/welcome on                                 # Enable
/welcome off                                # Disable
/welcome set Welcome to {group}, @user!    # Set custom message
```

**Placeholders:**
- `@user` - Mentions the new member
- `{user}` - Member's name (no mention)
- `{group}` - Group name

**Example:**
```
/welcome set 👋 Welcome @user to {group}! Please read the rules.
```

**Output when someone joins:**
```
👋 Welcome @919876543210 to My Group! Please read the rules.
```

---

### /goodbye
Manage goodbye messages for leaving members.

**Aliases:** `setgoodbye`  
**Permissions:** Admin only  
**Usage:**
```
/goodbye                                    # Check status
/goodbye on                                 # Enable
/goodbye off                                # Disable
/goodbye set Goodbye @user, thanks for being part of {group}!
```

**Placeholders:**
- `@user` - Member's name
- `{user}` - Member's name
- `{group}` - Group name

**Example:**
```
/goodbye set 👋 Goodbye @user! We'll miss you.
```

---

## 👑 Owner Commands

### /broadcast
Send a message to all groups where the bot is a member.

**Aliases:** `bc`  
**Permissions:** Owner only  
**Usage:**
```
/broadcast Important announcement for all groups!
/broadcast Server maintenance tonight at 10 PM
```

**Example Output:**
```
📡 Broadcasting message to all groups...

✅ Broadcast Complete

✅ Sent to: 15 groups
```

**Message Format:**
```
📢 Broadcast Message

Your message here
```

**Notes:**
- 1 second delay between each group
- Prevents spam detection
- Shows success/fail count

---

### /block
Block a user from using the bot.

**Aliases:** `ban`  
**Permissions:** Owner only  
**Usage:**
```
/block @919876543210           # Mention user
/block                         # Reply to user's message
```

**Example Output:**
```
✅ User @919876543210 has been blocked from using the bot.
```

**Effect:**
- User cannot use any bot commands
- Bot ignores all messages from user
- Stored in database (persistent)

---

### /unblock
Unblock a previously blocked user.

**Aliases:** `unban`  
**Permissions:** Owner only  
**Usage:**
```
/unblock @919876543210         # Mention user
/unblock                       # Reply to user's message
```

**Example Output:**
```
✅ User @919876543210 has been unblocked.
```

---

### /leave
Make the bot leave a group.

**Aliases:** `exit`  
**Permissions:** Owner only  
**Group only:** Yes  
**Usage:**
```
/leave
```

**Example Output:**
```
👋 Goodbye! Leaving the group...
```

**Notes:**
- 2 second delay before leaving
- Cannot be undone (must be re-added)
- Use carefully

---

### /stats
Display detailed bot statistics.

**Aliases:** `statistics`, `botstats`  
**Permissions:** Owner only  
**Usage:**
```
/stats
```

**Example Output:**
```
📊 Bot Statistics

⏱️ Uptime: 5d 12h
👥 Groups: 25
💬 Private Chats: 150
📱 Total Chats: 175

📈 Top Commands:
1. /help - 450 uses
2. /sticker - 320 uses
3. /ping - 280 uses
4. /tagall - 150 uses
5. /groupinfo - 120 uses

💾 Memory Usage: 145.32MB / 256.00MB
```

---

## ⚙️ Command Properties

### Cooldowns
Most commands have cooldowns to prevent spam:

| Command | Cooldown |
|---------|----------|
| Basic commands | 3-5 seconds |
| Media commands | 5 seconds |
| Group commands | 5 seconds |
| Admin commands | 5 seconds |
| Owner commands | 5-10 seconds |
| /tagall | 10 seconds |
| /broadcast | 10 seconds |

### Permissions

**Public:** Anyone can use
- /help, /menu, /ping, /about
- /sticker, /download
- /groupinfo

**Admin Only:** Group admins
- /tagall, /add, /remove
- /promote, /demote
- /antilink, /antispam
- /welcome, /goodbye

**Owner Only:** Bot owners
- /broadcast, /block, /unblock
- /leave, /stats

---

## 💡 Tips & Tricks

### Quick Commands
Use aliases for faster typing:
```
/h          instead of /help
/p          instead of /ping
/s          instead of /sticker
/dl         instead of /download
/ginfo      instead of /groupinfo
/bc         instead of /broadcast
```

### Combining Commands
```
# Create sticker and download original
1. Reply to image with /sticker
2. Reply to same image with /download
```

### Efficient Group Management
```
# Quick setup for new group
/antilink on
/antispam on
/welcome set Welcome @user!
/goodbye set Goodbye @user!
```

### Mention Multiple Users
```
/tagall @919876543210 @918765432109 Please check this
```

---

## 🚫 Command Restrictions

### Rate Limiting
- Max 10 messages per minute per user
- Prevents spam and abuse
- Configurable in .env

### Blocked Users
- Cannot use any commands
- Bot ignores their messages
- Only owners can block/unblock

### Group Requirements
Some commands only work in groups:
- /tagall, /add, /remove
- /promote, /demote
- /groupinfo, /leave
- /antilink, /antispam
- /welcome, /goodbye

### Bot Admin Requirements
Bot must be admin for:
- /add, /remove
- /promote, /demote

---

## 📝 Command Examples

### Scenario 1: Setting Up a New Group
```
Admin: /groupinfo
Bot: [Shows group details]

Admin: /antilink on
Bot: ✅ Anti-link filter enabled

Admin: /welcome set Welcome @user to our community!
Bot: ✅ Welcome message set

Admin: /tagall Please introduce yourselves!
Bot: [Tags everyone with message]
```

### Scenario 2: Managing Members
```
Admin: /add 919876543210
Bot: ✅ Successfully added user

Admin: /promote @919876543210
Bot: ✅ User promoted to admin

[Later, if needed]
Admin: /remove @918765432109
Bot: ✅ User removed from group
```

### Scenario 3: Creating Stickers
```
User: [Sends funny image]
You: /sticker
Bot: ⏳ Creating sticker...
Bot: [Sends sticker]

You: /download
Bot: ✅ Media Downloaded Successfully!
```

### Scenario 4: Owner Management
```
Owner: /stats
Bot: [Shows statistics]

Owner: /broadcast Server maintenance tonight!
Bot: 📡 Broadcasting...
Bot: ✅ Sent to 20 groups

Owner: /block @spammer
Bot: ✅ User blocked
```

---

## 🔄 Auto-Responses

The bot automatically responds to certain messages:

### Greetings
**Triggers:** hi, hello, hey, hola, namaste  
**Response:**
```
👋 Hello! I'm a WhatsApp bot. Type /help to see available commands.
```

### Help Requests
**Triggers:** help, menu (without prefix)  
**Response:**
```
📋 Available Commands:
[Shows command list]
```

---

## 🎓 Advanced Usage

### Custom Command Creation
See README.md for guide on creating custom commands.

### Modifying Existing Commands
1. Navigate to `commands/` folder
2. Edit the command file
3. Restart bot
4. Changes take effect

### Disabling Commands
Rename or move command file:
```bash
mv commands/sticker.js commands/sticker.js.disabled
```

---

**For more information, see README.md and SETUP_GUIDE.md**
