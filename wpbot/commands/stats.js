const database = require('../database/database');
const helpers = require('../utils/helpers');

module.exports = {
    name: 'stats',
    aliases: ['statistics', 'botstats'],
    description: 'Display bot statistics',
    usage: '/stats',
    ownerOnly: true,
    cooldown: 5000,
    
    async execute(client, message, args) {
        try {
            const chats = await client.getChats();
            const groups = chats.filter(chat => chat.isGroup);
            const privateChats = chats.filter(chat => !chat.isGroup);
            
            const uptime = process.uptime();
            const commandStats = database.getCommandStats(5);

            let statsText = `📊 *Bot Statistics*\n\n`;
            statsText += `⏱️ *Uptime:* ${helpers.formatDuration(uptime * 1000)}\n`;
            statsText += `👥 *Groups:* ${groups.length}\n`;
            statsText += `💬 *Private Chats:* ${privateChats.length}\n`;
            statsText += `📱 *Total Chats:* ${chats.length}\n\n`;
            
            if (commandStats.length > 0) {
                statsText += `📈 *Top Commands:*\n`;
                commandStats.forEach((stat, index) => {
                    statsText += `${index + 1}. /${stat.command} - ${stat.count} uses\n`;
                });
            }

            // Memory usage
            const memUsage = process.memoryUsage();
            const memUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
            const memTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
            
            statsText += `\n💾 *Memory Usage:* ${memUsedMB}MB / ${memTotalMB}MB`;

            await message.reply(statsText);

        } catch (error) {
            console.error('Error in stats command:', error);
            await message.reply('❌ An error occurred while fetching statistics.');
        }
    }
};
