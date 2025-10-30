const helpers = require('../utils/helpers');

module.exports = {
    name: 'ping',
    aliases: ['p'],
    description: 'Check bot response time and status',
    usage: '/ping',
    cooldown: 3000,
    
    async execute(client, message, args) {
        try {
            const messageTimestamp = (message.timestamp || Math.floor(Date.now() / 1000)) * 1000;
            const latency = Math.max(0, Date.now() - messageTimestamp);

            const info = client.info || {};
            const uptime = process.uptime();

            let response = `🏓 *Pong!*\n\n`;
            response += `⚡ *Response Time:* ${latency}ms\n`;
            response += `⏱️ *Uptime:* ${helpers.formatDuration(uptime * 1000)}\n`;

            if (info.wid?.user) {
                response += `📱 *Bot Number:* ${info.wid.user}\n`;
            }

            response += `✅ *Status:* Online`;

            await message.reply(response);
        } catch (error) {
            console.error('Error in ping command:', error);
            await message.reply('❌ An error occurred while checking ping.');
        }
    }
};
