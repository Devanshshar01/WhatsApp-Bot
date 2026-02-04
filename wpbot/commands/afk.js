const database = require('../database/database');
const helpers = require('../utils/helpers');

module.exports = {
    name: 'afk',
    aliases: ['away', 'brb'],
    description: 'Set your AFK (Away From Keyboard) status',
    usage: '/afk [reason] | /afk off',
    category: 'utility',
    cooldown: 3000,

    async execute(client, message, args) {
        try {
            const userId = message.author || message.from;
            
            // Check if turning off AFK
            if (args.length > 0 && args[0].toLowerCase() === 'off') {
                const afkData = database.removeAfk(userId);
                if (afkData) {
                    const duration = helpers.formatDuration(Date.now() - afkData.since);
                    await message.reply(`✅ Welcome back! You were AFK for ${duration}.`);
                } else {
                    await message.reply('❌ You are not currently AFK.');
                }
                return;
            }
            
            // Check if already AFK
            const existingAfk = database.getAfk(userId);
            if (existingAfk) {
                await message.reply(`⚠️ You are already AFK.\nReason: ${existingAfk.reason}\n\nUse \`/afk off\` to remove your AFK status.`);
                return;
            }
            
            // Set AFK
            const reason = args.join(' ') || 'AFK';
            
            // Validate reason length
            if (reason.length > 200) {
                await message.reply('❌ AFK reason too long. Maximum 200 characters.');
                return;
            }
            
            database.setAfk(userId, reason);
            
            let response = `😴 *AFK Mode Activated*\n\n`;
            response += `📝 *Reason:* ${reason}\n\n`;
            response += `_Anyone who mentions you will be notified that you're away._\n`;
            response += `_Send any message to automatically remove your AFK status._`;
            
            await message.reply(response);
            
        } catch (error) {
            console.error('Error in afk command:', error);
            await message.reply('❌ An error occurred while setting AFK status.');
        }
    }
};
