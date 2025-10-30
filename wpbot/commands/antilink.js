const database = require('../database/database');

module.exports = {
    name: 'antilink',
    aliases: ['al'],
    description: 'Toggle anti-link filter for group',
    usage: '/antilink <on|off>',
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

            const groupId = message.from;
            let group = database.getGroup(groupId);

            // Create group if doesn't exist
            if (!group) {
                database.createOrUpdateGroup(groupId, chat.name, chat.description || '');
                group = database.getGroup(groupId);
            }

            if (args.length === 0) {
                const status = group.anti_link === 1 ? 'enabled' : 'disabled';
                await message.reply(`🔗 Anti-link is currently *${status}*.\n\nUsage: ${this.usage}`);
                return;
            }

            const action = args[0].toLowerCase();

            if (action === 'on' || action === 'enable' || action === '1') {
                database.updateGroupSettings(groupId, {
                    welcomeEnabled: group.welcome_enabled === 1,
                    goodbyeEnabled: group.goodbye_enabled === 1,
                    antiLink: true,
                    antiSpam: group.anti_spam === 1,
                    profanityFilter: group.profanity_filter === 1
                });
                await message.reply('✅ Anti-link filter has been *enabled*.\n\nLinks will be automatically deleted (except allowed domains).');
            }
            else if (action === 'off' || action === 'disable' || action === '0') {
                database.updateGroupSettings(groupId, {
                    welcomeEnabled: group.welcome_enabled === 1,
                    goodbyeEnabled: group.goodbye_enabled === 1,
                    antiLink: false,
                    antiSpam: group.anti_spam === 1,
                    profanityFilter: group.profanity_filter === 1
                });
                await message.reply('✅ Anti-link filter has been *disabled*.');
            }
            else {
                await message.reply(`❌ Invalid option. Use: ${this.usage}`);
            }

        } catch (error) {
            console.error('Error in antilink command:', error);
            await message.reply('❌ An error occurred while toggling anti-link.');
        }
    }
};
