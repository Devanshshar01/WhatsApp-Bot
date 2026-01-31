const helpers = require('../utils/helpers');
const config = require('../config');

module.exports = {
    name: 'remove',
    aliases: ['kick'],
    description: 'Remove member from group',
    usage: '/remove <@mention or reply>',
    category: 'group',
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
                await message.reply('❌ I need to be a group admin to remove members.');
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
            // Check for phone number in args
            else if (args.length > 0) {
                let phoneNumber = args[0].replace(/[^0-9]/g, '');
                const countryCode = config.defaultCountryCode || '1';
                if (!phoneNumber.startsWith(countryCode) && phoneNumber.length === 10) {
                    phoneNumber = countryCode + phoneNumber;
                }
                targetUser = `${phoneNumber}@c.us`;
            }

            if (!targetUser) {
                await message.reply(`❌ Please mention a user, reply to their message, or provide their number.\n\nUsage: ${this.usage}`);
                return;
            }

            // Don't allow removing bot owners
            if (helpers.isOwner(targetUser)) {
                await message.reply('❌ Cannot remove bot owner from the group.');
                return;
            }

            try {
                await chat.removeParticipants([targetUser]);
                await message.reply('✅ User has been removed from the group.');
            } catch (error) {
                if (error.message.includes('403')) {
                    await message.reply('❌ Unable to remove this user. They might be a group admin.');
                } else {
                    await message.reply('❌ Failed to remove user.');
                }
            }
        } catch (error) {
            console.error('Error in remove command:', error);
            await message.reply('❌ An error occurred while removing member.');
        }
    }
};
