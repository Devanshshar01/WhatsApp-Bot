const database = require('../database/database');

module.exports = {
    name: 'unblock',
    aliases: ['unban'],
    description: 'Unblock user from using bot',
    usage: '/unblock <@mention or reply>',
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

            // Check if not blocked
            if (!database.isUserBlocked(targetUser)) {
                await message.reply('⚠️ This user is not blocked.');
                return;
            }

            // Unblock user
            database.unblockUser(targetUser);
            
            const contact = await client.getContactById(targetUser);
            await message.reply(`✅ User @${contact.number} has been unblocked.`, null, { mentions: [contact] });

        } catch (error) {
            console.error('Error in unblock command:', error);
            await message.reply('❌ An error occurred while unblocking user.');
        }
    }
};
