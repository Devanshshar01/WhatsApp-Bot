const database = require('../database/database');
const helpers = require('../utils/helpers');
const scheduler = require('../utils/scheduler');

module.exports = {
    name: 'schedule',
    aliases: ['cron', 'timer'],
    description: 'Schedule automatic messages',
    usage: '/schedule <time> <frequency> <message> | /schedule list | /schedule delete <id>',
    category: 'automation',
    adminOnly: true,
    cooldown: 5000,

    async execute(client, message, args) {
        try {
            const userId = message.author || message.from;
            const chatId = message.from;
            
            if (args.length === 0) {
                const helpText = `⏰ *Scheduled Messages*\n\n` +
                    `Set up automatic recurring messages!\n\n` +
                    `*Commands:*\n` +
                    `• \`/schedule <time> <freq> <message>\`\n` +
                    `• \`/schedule list\` - View all schedules\n` +
                    `• \`/schedule delete <id>\` - Remove schedule\n` +
                    `• \`/schedule toggle <id>\` - Enable/disable\n\n` +
                    `*Time Formats:*\n` +
                    `• \`9:00 daily\` - Every day at 9 AM\n` +
                    `• \`14:30 weekly monday\` - Every Monday\n` +
                    `• \`10:00 monthly 1\` - 1st of every month\n` +
                    `• \`0 9 * * *\` - Cron expression\n\n` +
                    `*Examples:*\n` +
                    `\`/schedule 9:00 daily Good morning everyone!\`\n` +
                    `\`/schedule 10:00 weekly friday TGIF! 🎉\``;
                await message.reply(helpText);
                return;
            }

            const action = args[0].toLowerCase();

            if (action === 'list') {
                const schedules = database.getScheduledMessages(chatId);
                
                if (schedules.length === 0) {
                    await message.reply('📭 No scheduled messages in this chat.\n\nUse `/schedule <time> <freq> <message>` to create one!');
                    return;
                }

                let response = `⏰ *Scheduled Messages* (${schedules.length})\n\n`;
                schedules.forEach((s) => {
                    const status = s.enabled ? '✅' : '❌';
                    const desc = scheduler.describeCron(s.cronExpression);
                    const lastRun = s.lastRun ? new Date(s.lastRun).toLocaleString() : 'Never';
                    response += `${status} *#${s.id}* - ${desc}\n`;
                    response += `   📝 "${s.message.substring(0, 40)}${s.message.length > 40 ? '...' : ''}"\n`;
                    response += `   ⏱️ Last run: ${lastRun}\n\n`;
                });
                
                await message.reply(response);
                return;
            }
            
            if (action === 'delete' || action === 'remove') {
                if (args.length < 2) {
                    await message.reply('❌ Usage: `/schedule delete <id>`');
                    return;
                }

                const id = parseInt(args[1]);
                if (isNaN(id)) {
                    await message.reply('❌ Please provide a valid schedule ID number.');
                    return;
                }
                
                scheduler.stopJob(id);
                const deleted = database.deleteScheduledMessage(id);
                
                if (deleted) {
                    await message.reply(`✅ Schedule #${id} has been deleted.`);
                } else {
                    await message.reply(`❌ Schedule #${id} not found.`);
                }
                return;
            }
            
            if (action === 'toggle') {
                if (args.length < 2) {
                    await message.reply('❌ Usage: `/schedule toggle <id>`');
                    return;
                }

                const id = parseInt(args[1]);
                if (isNaN(id)) {
                    await message.reply('❌ Please provide a valid schedule ID number.');
                    return;
                }
                
                const schedule = database.getScheduledMessageById(id);
                if (!schedule) {
                    await message.reply(`❌ Schedule #${id} not found.`);
                    return;
                }
                
                const newEnabled = !schedule.enabled;
                database.updateScheduledMessage(id, { enabled: newEnabled });
                
                if (newEnabled) {
                    scheduler.startJob({ ...schedule, enabled: true }, client);
                    await message.reply(`✅ Schedule #${id} is now enabled.`);
                } else {
                    scheduler.stopJob(id);
                    await message.reply(`✅ Schedule #${id} is now disabled.`);
                }
                return;
            }

            // Parse schedule creation: /schedule 9:00 daily Good morning!
            // Find where the message starts (after time and frequency)
            const fullText = args.join(' ');
            
            // Try to extract time and frequency
            const timeFreqMatch = fullText.match(/^(\d{1,2}:\d{2})\s+(\w+(?:\s+\w+)?)\s+(.+)$/s);
            
            if (!timeFreqMatch) {
                // Try cron expression format
                const cronMatch = fullText.match(/^([\d\*\/\-\,]+\s+[\d\*\/\-\,]+\s+[\d\*\/\-\,]+\s+[\d\*\/\-\,]+\s+[\d\*\/\-\,]+)\s+(.+)$/s);
                
                if (cronMatch) {
                    const cronExpr = cronMatch[1];
                    const msgText = cronMatch[2];
                    
                    if (!require('node-cron').validate(cronExpr)) {
                        await message.reply('❌ Invalid cron expression.');
                        return;
                    }
                    
                    await createSchedule(client, message, chatId, userId, cronExpr, msgText);
                    return;
                }
                
                await message.reply('❌ Invalid format.\n\nUse: `/schedule <time> <frequency> <message>`\n\nExample: `/schedule 9:00 daily Good morning!`');
                return;
            }
            
            const timeStr = timeFreqMatch[1];
            const freqStr = timeFreqMatch[2];
            const msgText = timeFreqMatch[3];
            
            const cronExpr = scheduler.parseToCron(`${timeStr} ${freqStr}`);
            
            if (!cronExpr) {
                await message.reply('❌ Invalid time/frequency format.\n\nValid formats:\n• `9:00 daily`\n• `14:30 weekly monday`\n• `10:00 monthly 15`');
                return;
            }
            
            await createSchedule(client, message, chatId, userId, cronExpr, msgText);
            
        } catch (error) {
            console.error('Error in schedule command:', error);
            await message.reply('❌ An error occurred while managing schedules.');
        }
    }
};

async function createSchedule(client, message, chatId, userId, cronExpr, msgText) {
    // Validate message length
    if (msgText.length > 2000) {
        await message.reply('❌ Message too long. Maximum 2000 characters.');
        return;
    }
    
    // Check schedule limit per chat (max 10)
    const existing = database.getScheduledMessages(chatId);
    if (existing.length >= 10) {
        await message.reply('❌ Maximum 10 schedules per chat. Delete some first.');
        return;
    }
    
    const schedule = database.addScheduledMessage(chatId, msgText, cronExpr, userId);
    scheduler.startJob(schedule, client);
    
    const desc = scheduler.describeCron(cronExpr);
    
    let response = `✅ *Schedule Created!*\n\n`;
    response += `🆔 *ID:* ${schedule.id}\n`;
    response += `⏰ *Schedule:* ${desc}\n`;
    response += `📝 *Message:* "${msgText.substring(0, 50)}${msgText.length > 50 ? '...' : ''}"\n\n`;
    response += `_The message will be sent automatically according to the schedule._`;
    
    await message.reply(response);
}
