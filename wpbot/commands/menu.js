const config = require('../config');

module.exports = {
    name: 'menu',
    aliases: ['m'],
    description: 'Display quick command menu',
    usage: '/menu',
    cooldown: 5000,
    
    async execute(client, message, args) {
        try {
            let menuText = `╔═══════════════════╗\n`;
            menuText += `║  🤖 *BOT MENU* 🤖  ║\n`;
            menuText += `╚═══════════════════╝\n\n`;
            
            menuText += `*📌 BASIC COMMANDS*\n`;
            menuText += `├ ${config.prefix}help - Full command list\n`;
            menuText += `├ ${config.prefix}menu - This menu\n`;
            menuText += `├ ${config.prefix}ping - Check status\n`;
            menuText += `├ ${config.prefix}about - Bot info\n`;
            menuText += `└ ${config.prefix}profile - Your stats\n\n`;

            menuText += `*🧰 UTILITY COMMANDS*\n`;
            menuText += `├ ${config.prefix}translate <lang> <text>\n`;
            menuText += `├ ${config.prefix}weather <city>\n`;
            menuText += `├ ${config.prefix}remind <time> <msg>\n`;
            menuText += `├ ${config.prefix}poll question | opt1 | opt2\n`;
            menuText += `├ ${config.prefix}calc <expression>\n`;
            menuText += `├ ${config.prefix}timer <start|stop|check>\n`;
            menuText += `├ ${config.prefix}define <word>\n`;
            menuText += `├ ${config.prefix}qrcode <text>\n`;
            menuText += `├ ${config.prefix}shorturl <link>\n`;
            menuText += `└ ${config.prefix}currency <amt> <from> <to>\n\n`;

            menuText += `*🎨 MEDIA COMMANDS*\n`;
            menuText += `├ ${config.prefix}sticker - Make sticker\n`;
            menuText += `└ ${config.prefix}download - Save media\n\n`;

            menuText += `*🎉 FUN COMMANDS*\n`;
            menuText += `├ ${config.prefix}ai <message> - Chat with AI\n`;
            menuText += `├ ${config.prefix}compliment - Spread positivity\n`;
            menuText += `├ ${config.prefix}insult - Light roast\n`;
            menuText += `└ ${config.prefix}flirt - Pickup lines\n\n`;

            menuText += `*🤖 AUTOMATION COMMANDS*\n`;
            menuText += `├ ${config.prefix}afk [reason] - Set AFK status\n`;
            menuText += `├ ${config.prefix}alias - Create shortcuts\n`;
            menuText += `├ ${config.prefix}autoreply - Custom replies\n`;
            menuText += `└ ${config.prefix}schedule - Timed messages\n\n`;

            menuText += `*👥 GROUP COMMANDS*\n`;
            menuText += `├ ${config.prefix}tagall - Tag everyone\n`;
            menuText += `├ ${config.prefix}add - Add member\n`;
            menuText += `├ ${config.prefix}remove - Remove member\n`;
            menuText += `├ ${config.prefix}promote - Make admin\n`;
            menuText += `├ ${config.prefix}demote - Remove admin\n`;
            menuText += `└ ${config.prefix}groupinfo - Group details\n\n`;

            menuText += `*🛡️ ADMIN COMMANDS*\n`;
            menuText += `├ ${config.prefix}antilink - Toggle anti-link\n`;
            menuText += `├ ${config.prefix}antispam - Toggle anti-spam\n`;
            menuText += `├ ${config.prefix}welcome - Configure welcome msg\n`;
            menuText += `├ ${config.prefix}goodbye - Configure goodbye msg\n`;
            menuText += `├ ${config.prefix}mute - Mute member\n`;
            menuText += `├ ${config.prefix}unmute - Unmute member\n`;
            menuText += `├ ${config.prefix}warn - Issue warning\n`;
            menuText += `├ ${config.prefix}unwarn - Clear warnings\n`;
            menuText += `├ ${config.prefix}warnings - Warning history\n`;
            menuText += `└ ${config.prefix}clear <caseId> - Remove log entry\n\n`;

            menuText += `*👑 OWNER COMMANDS*\n`;
            menuText += `├ ${config.prefix}broadcast - Send to all\n`;
            menuText += `├ ${config.prefix}block - Block user\n`;
            menuText += `├ ${config.prefix}unblock - Unblock user\n`;
            menuText += `├ ${config.prefix}leave - Leave group\n`;
            menuText += `└ ${config.prefix}stats - Bot stats\n\n`;
            
            menuText += `Type ${config.prefix}help <command> for details`;

            await message.reply(menuText);
        } catch (error) {
            console.error('Error in menu command:', error);
            await message.reply('❌ An error occurred while displaying menu.');
        }
    }
};
