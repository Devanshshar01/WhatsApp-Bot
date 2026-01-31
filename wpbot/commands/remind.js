const database = require('../database/database');

// Active reminder timeouts (in-memory for current session)
const activeReminders = new Map();

// Format time for display
const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
};

// Schedule a reminder
const scheduleReminder = (client, reminder) => {
    const timeUntilTrigger = reminder.triggerTime - Date.now();
    
    if (timeUntilTrigger <= 0) {
        // Already expired, remove from database
        database.removeReminder(reminder.id);
        return;
    }
    
    const timeout = setTimeout(async () => {
        try {
            let reminderMsg = `⏰ *REMINDER*\n\n`;
            reminderMsg += `📝 ${reminder.message}\n\n`;
            reminderMsg += `_Set ${formatTime(reminder.durationMs)} ago_`;
            
            await client.sendMessage(reminder.chatId, reminderMsg);
            
            // Mention the user if in a group
            if (reminder.chatId.endsWith('@g.us')) {
                const contact = await client.getContactById(reminder.userId);
                await client.sendMessage(reminder.chatId, `@${contact.number}`, {
                    mentions: [contact]
                });
            }
        } catch (error) {
            console.error('Error sending reminder:', error);
        } finally {
            // Remove from database and active map
            database.removeReminder(reminder.id);
            activeReminders.delete(reminder.id);
        }
    }, timeUntilTrigger);
    
    activeReminders.set(reminder.id, timeout);
};

// Reload reminders on bot startup
const reloadReminders = (client) => {
    database.cleanupExpiredReminders();
    const reminders = database.getActiveReminders();
    
    for (const reminder of reminders) {
        scheduleReminder(client, reminder);
    }
    
    console.log(`Reloaded ${reminders.length} active reminders`);
    return reminders.length;
};

module.exports = {
    name: 'remind',
    aliases: ['reminder', 'rem'],
    description: 'Set a reminder',
    usage: '/remind <time> <message>',
    category: 'utility',
    cooldown: 3000,
    
    // Export for use in index.js
    reloadReminders,
    
    async execute(client, message, args) {
        try {
            if (args.length < 2) {
                const helpText = `⏰ *Reminder Command*\n\n` +
                    `*Usage:* /remind <time> <message>\n\n` +
                    `*Time Formats:*\n` +
                    `• 5m - 5 minutes\n` +
                    `• 1h - 1 hour\n` +
                    `• 2h30m - 2 hours 30 minutes\n` +
                    `• 1d - 1 day\n\n` +
                    `*Examples:*\n` +
                    `• /remind 10m Check the oven\n` +
                    `• /remind 1h Meeting with team\n` +
                    `• /remind 30m Take medicine\n` +
                    `• /remind 1d Pay bills`;
                await message.reply(helpText);
                return;
            }

            const timeStr = args[0].toLowerCase();
            const reminderText = args.slice(1).join(' ');
            
            // Validate reminder text length
            if (reminderText.length > 500) {
                await message.reply('❌ Reminder message too long. Maximum 500 characters.');
                return;
            }
            
            // Parse time string
            let totalMs = 0;
            const timeRegex = /(\d+)([dhms])/g;
            let match;
            
            while ((match = timeRegex.exec(timeStr)) !== null) {
                const value = parseInt(match[1]);
                const unit = match[2];
                
                switch (unit) {
                    case 'd': totalMs += value * 24 * 60 * 60 * 1000; break;
                    case 'h': totalMs += value * 60 * 60 * 1000; break;
                    case 'm': totalMs += value * 60 * 1000; break;
                    case 's': totalMs += value * 1000; break;
                }
            }
            
            if (totalMs === 0) {
                await message.reply('❌ Invalid time format. Use formats like: 5m, 1h, 2h30m, 1d');
                return;
            }
            
            if (totalMs > 7 * 24 * 60 * 60 * 1000) {
                await message.reply('❌ Maximum reminder time is 7 days');
                return;
            }
            
            if (totalMs < 60 * 1000) {
                await message.reply('❌ Minimum reminder time is 1 minute');
                return;
            }

            const userId = message.author || message.from;
            const chatId = message.from;
            const triggerTime = Date.now() + totalMs;

            // Save to database and schedule
            const reminder = database.addReminder(userId, chatId, reminderText, triggerTime, totalMs);
            scheduleReminder(client, reminder);

            let confirmText = `✅ *Reminder Set!*\n\n`;
            confirmText += `📝 *Message:* ${reminderText}\n`;
            confirmText += `⏰ *Time:* ${formatTime(totalMs)} from now\n`;
            confirmText += `📅 *Will remind at:* ${new Date(triggerTime).toLocaleString()}\n`;
            confirmText += `🆔 *ID:* ${reminder.id}`;
            
            await message.reply(confirmText);

        } catch (error) {
            console.error('Error in remind command:', error);
            await message.reply('❌ An error occurred while setting the reminder.');
        }
    }
};
