const helpers = require('../utils/helpers');

module.exports = {
    name: 'demote',
    aliases: ['unadmin'],
    description: 'Demote admin to member',
    usage: '/demote <@mention or reply>',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    cooldown: 5000,
    
    async execute(client, message, args) {
        try {
            const chat = await message.getChat();

            // Check if bot is admin
            const isBotAdmin = await helpers.isBotGroupAdmin(message);
            if (!isBotAdmin) {
                await message.reply('❌ I need to be a group admin to demote members.');
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

            const actorId = helpers.getMessageActorId(message);
            if (targetUser === actorId) {
                await message.reply('❌ You cannot demote yourself.');
                return;
            }

            // Don't allow demoting bot owners
            if (helpers.isOwner(targetUser)) {
                await message.reply('❌ Cannot demote bot owner.');
                return;
            }

            try {
                await chat.demoteParticipants([targetUser]);
                const contact = await client.getContactById(targetUser);
                await message.reply(`✅ @${contact.number} has been demoted to member.`, null, { mentions: [contact] });
            } catch (error) {
                if (error.message.includes('403')) {
                    await message.reply('❌ Unable to demote this user. They might not be an admin.');
                } else {
                    await message.reply('❌ Failed to demote user.');
                }
            }
        } catch (error) {
            console.error('Error in demote command:', error);
            await message.reply('❌ An error occurred while demoting member.');
        }
    }
};
