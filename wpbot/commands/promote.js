const helpers = require('../utils/helpers');

module.exports = {
    name: 'promote',
    aliases: ['admin'],
    description: 'Promote member to admin',
    usage: '/promote <@mention or reply>',
    groupOnly: true,
    adminOnly: true,
    cooldown: 5000,
    
    async execute(client, message, args) {
        try {
            const chat = await message.getChat();
            
            if (!chat.isGroup) {
                await message.reply('❌ This command can only be used in groups.');
                return;
            }

            // Check if bot is admin
            const isBotAdmin = await helpers.isBotGroupAdmin(message);
            if (!isBotAdmin) {
                await message.reply('❌ I need to be a group admin to promote members.');
                return;
            }

            let targetUser = null;

            // Check if replying to a message
            if (message.hasQuotedMsg) {
                const quotedMsg = await message.getQuotedMessage();
                targetUser = quotedMsg.author || quotedMsg.from;
            }
            // Check for mentions
            else if (message.mentionedIds && message.mentionedIds.length > 0) {
                targetUser = message.mentionedIds[0];
            }

            if (!targetUser) {
                await message.reply(`❌ Please mention a user or reply to their message.\n\nUsage: ${this.usage}`);
                return;
            }

            try {
                await chat.promoteParticipants([targetUser]);
                const contact = await client.getContactById(targetUser);
                await message.reply(`✅ @${contact.number} has been promoted to admin.`, null, { mentions: [contact] });
            } catch (error) {
                if (error.message.includes('403')) {
                    await message.reply('❌ Unable to promote this user. They might already be an admin.');
                } else {
                    await message.reply('❌ Failed to promote user.');
                }
            }
        } catch (error) {
            console.error('Error in promote command:', error);
            await message.reply('❌ An error occurred while promoting member.');
        }
    }
};
