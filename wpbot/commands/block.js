const database = require('../database/database');

module.exports = {
    name: 'block',
    aliases: ['ban'],
    description: 'Block user from using bot',
    usage: '/block <@mention or reply>',
    category: 'owner',
    ownerOnly: true,
    cooldown: 5000,
    
    async execute(client, message, args) {
        try {
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

            // Check if already blocked
            if (database.isUserBlocked(targetUser)) {
                await message.reply('⚠️ This user is already blocked.');
                return;
            }

            // Block user
            database.blockUser(targetUser);
            
            const contact = await client.getContactById(targetUser);
            await message.reply(`✅ User @${contact.number} has been blocked from using the bot.`, null, { mentions: [contact] });

        } catch (error) {
            console.error('Error in block command:', error);
            await message.reply('❌ An error occurred while blocking user.');
        }
    }
};
