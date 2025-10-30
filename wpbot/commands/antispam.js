const database = require('../database/database');

module.exports = {
    name: 'antispam',
    aliases: ['as'],
    description: 'Toggle anti-spam filter for group',
    usage: '/antispam <on|off>',
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
                const status = group.anti_spam === 1 ? 'enabled' : 'disabled';
                await message.reply(`🚫 Anti-spam is currently *${status}*.\n\nUsage: ${this.usage}`);
                return;
            }

            const action = args[0].toLowerCase();

            if (action === 'on' || action === 'enable' || action === '1') {
                database.updateGroupSettings(groupId, {
                    welcomeEnabled: group.welcome_enabled === 1,
                    goodbyeEnabled: group.goodbye_enabled === 1,
                    antiLink: group.anti_link === 1,
                    antiSpam: true,
                    profanityFilter: group.profanity_filter === 1
                });
                await message.reply('✅ Anti-spam filter has been *enabled*.\n\nUsers sending too many messages will be warned.');
            }
            else if (action === 'off' || action === 'disable' || action === '0') {
                database.updateGroupSettings(groupId, {
                    welcomeEnabled: group.welcome_enabled === 1,
                    goodbyeEnabled: group.goodbye_enabled === 1,
                    antiLink: group.anti_link === 1,
                    antiSpam: false,
                    profanityFilter: group.profanity_filter === 1
                });
                await message.reply('✅ Anti-spam filter has been *disabled*.');
            }
            else {
                await message.reply(`❌ Invalid option. Use: ${this.usage}`);
            }

        } catch (error) {
            console.error('Error in antispam command:', error);
            await message.reply('❌ An error occurred while toggling anti-spam.');
        }
    }
};
