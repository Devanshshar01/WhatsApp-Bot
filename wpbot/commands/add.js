const helpers = require('../utils/helpers');
const config = require('../config');

module.exports = {
    name: 'add',
    aliases: ['invite'],
    description: 'Add member to group',
    usage: '/add <number>',
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
                await message.reply('❌ I need to be a group admin to add members.');
                return;
            }

            if (args.length === 0) {
                await message.reply(`❌ Please provide a phone number.\n\nUsage: ${this.usage}`);
                return;
            }

            // Get phone number
            let phoneNumber = args[0].replace(/[^0-9]/g, '');
            
            // Add country code if not present (use configured default)
            const countryCode = config.defaultCountryCode || '1';
            if (!phoneNumber.startsWith(countryCode) && phoneNumber.length === 10) {
                phoneNumber = countryCode + phoneNumber;
            }

            const numberId = `${phoneNumber}@c.us`;

            try {
                // Add participant
                await chat.addParticipants([numberId]);
                await message.reply(`✅ Successfully added +${phoneNumber} to the group.`);
            } catch (error) {
                if (error.message.includes('403')) {
                    await message.reply('❌ Unable to add this user. They may have privacy settings that prevent being added to groups.');
                } else if (error.message.includes('404')) {
                    await message.reply('❌ This number is not registered on WhatsApp.');
                } else {
                    await message.reply('❌ Failed to add user. Please check the number and try again.');
                }
            }
        } catch (error) {
            console.error('Error in add command:', error);
            await message.reply('❌ An error occurred while adding member.');
        }
    }
};
