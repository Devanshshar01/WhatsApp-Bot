const config = require('../config');
const helpers = require('../utils/helpers');

module.exports = {
    name: 'about',
    aliases: ['info', 'botinfo'],
    description: 'Display bot information',
    usage: '/about',
    cooldown: 5000,
    
    async execute(client, message, args) {
        try {
            const info = client.info;
            const uptime = process.uptime();

            let aboutText = `🤖 *${config.botName}*\n\n`;
            aboutText += `📝 *Description:*\n`;
            aboutText += `Advanced WhatsApp bot with comprehensive features including auto-responses, group management, media handling, and more.\n\n`;
            
            aboutText += `📊 *Bot Statistics:*\n`;
            aboutText += `⏱️ Uptime: ${helpers.formatDuration(uptime * 1000)}\n`;
            aboutText += `📱 Number: ${info.wid.user}\n`;
            aboutText += `🔧 Prefix: ${config.prefix}\n`;
            aboutText += `📦 Version: 1.0.0\n\n`;
            
            aboutText += `✨ *Features:*\n`;
            aboutText += `• Auto-response system\n`;
            aboutText += `• Command handler\n`;
            aboutText += `• Group management\n`;
            aboutText += `• Media processing\n`;
            aboutText += `• Anti-spam & Anti-link\n`;
            aboutText += `• User management\n`;
            aboutText += `• Database storage\n\n`;
            
            aboutText += `🔗 *Technology:*\n`;
            aboutText += `• Node.js\n`;
            aboutText += `• whatsapp-web.js\n`;
            aboutText += `• SQLite Database\n\n`;
            
            aboutText += `Type ${config.prefix}help to see all available commands.`;

            await message.reply(aboutText);
        } catch (error) {
            console.error('Error in about command:', error);
            await message.reply('❌ An error occurred while displaying bot information.');
        }
    }
};
