const helpers = require('../utils/helpers');

module.exports = {
    name: 'ping',
    aliases: ['p'],
    description: 'Check bot response time and status',
    usage: '/ping',
    cooldown: 3000,
    
    async execute(client, message, args) {
        try {
            const start = Date.now();
            const sent = await message.reply('🏓 Pinging...');
            const latency = Date.now() - start;

            const info = client.info;
            const uptime = process.uptime();

            let response = `🏓 *Pong!*\n\n`;
            response += `⚡ *Response Time:* ${latency}ms\n`;
            response += `⏱️ *Uptime:* ${helpers.formatDuration(uptime * 1000)}\n`;
            response += `📱 *Bot Number:* ${info.wid.user}\n`;
            response += `✅ *Status:* Online`;

            await sent.edit(response);
        } catch (error) {
            console.error('Error in ping command:', error);
            await message.reply('❌ An error occurred while checking ping.');
        }
    }
};
