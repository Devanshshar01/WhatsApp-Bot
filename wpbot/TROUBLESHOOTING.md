# Troubleshooting Guide

## Bot Not Responding to Commands

If you've scanned the QR code successfully but the bot is not responding to commands, follow these steps:

### 1. Check Your Configuration

Make sure the `.env` file exists in the `wpbot` directory with your correct phone number:

```bash
# Your .env file should have:
OWNER_NUMBERS=919205201448  # Replace with YOUR number (without + or spaces)
PREFIX=/
BOT_NAME=WhatsApp Bot
```

**IMPORTANT:** The owner number should be WITHOUT the `+` symbol and without any spaces or dashes. For example:
- Correct: `919205201448`
- Wrong: `+91 9205201448` or `+919205201448`

### 2. Verify Your Number Format

When you send a message to the bot, your WhatsApp ID is in the format: `919205201448@c.us`

The bot extracts the number part (before `@c.us`) and compares it to `OWNER_NUMBERS`.

### 3. Check the Logs

When you send a command like `/help`, you should see logs like:
```
Command detected from 919205201448@c.us: /help
Executing command: help with args:
```

If you don't see these logs, the message isn't reaching the bot.

### 4. Common Issues

#### Issue: Commands work in private chat but not in groups
- **Solution:** In groups, you must be a group admin OR the bot owner to use admin commands
- Commands like `/help`, `/ping`, `/about` should work for everyone
- Commands like `/tagall`, `/add`, `/remove` require admin privileges

#### Issue: "This command requires admin privileges"
- **Solution:**
  - Make sure you're an admin in the group
  - OR make sure your number is in `OWNER_NUMBERS` in the `.env` file
  - The logs will show: `Admin check for <your-number>: isAdmin=true/false, isOwner=true/false`

#### Issue: No response at all
- **Solution:**
  1. Check if the bot is running: `npm start`
  2. Check if QR code was scanned successfully
  3. Check logs for errors
  4. Make sure you're using the correct prefix (default is `/`)
  5. Try sending: `/ping` or `/help`

### 5. Test Commands

Start with these simple commands:

```
/ping
/help
/about
```

These should work for everyone, even non-admins.

### 6. Debugging Steps

1. Stop the bot (Ctrl+C)
2. Delete the `.wwebjs_auth` folder
3. Start the bot again: `npm start`
4. Scan the QR code with your WhatsApp
5. Wait for "✅ WhatsApp Bot is ready!" message
6. Try sending `/ping` in a private chat with the bot

### 7. Still Not Working?

Enable detailed logging by checking the console output when you send a message:
- You should see: "Command detected from <your-number>: <your-command>"
- Check if there are any error messages
- Verify the bot shows as "online" in WhatsApp

### 8. Checking Your Number

To verify your WhatsApp number format:
1. Send any message to the bot
2. Check the logs - you'll see something like: "user_id: 919205201448@c.us"
3. Copy the number part (before @c.us) to your `.env` OWNER_NUMBERS
