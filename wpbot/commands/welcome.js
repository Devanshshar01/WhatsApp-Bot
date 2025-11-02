const database = require('../database/database');

module.exports = {
    name: 'welcome',
    aliases: ['setwelcome'],
    description: 'Set custom welcome message for group',
    usage: '/welcome <on|off|set message>',
    category: 'admin',
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
                const status = group.welcome_enabled === 1 ? 'enabled' : 'disabled';
                const settings = database.getGroupSettings(groupId);
                const currentMsg = settings?.welcome_message || 'Default message';
                
                let response = `👋 Welcome message is currently *${status}*.\n\n`;
                response += `*Current message:*\n${currentMsg}\n\n`;
                response += `*Usage:*\n`;
                response += `${this.usage}\n\n`;
                response += `*Placeholders:*\n`;
                response += `@user - Mention user\n`;
                response += `{user} - User name\n`;
                response += `{group} - Group name`;
                
                await message.reply(response);
                return;
            }

            const action = args[0].toLowerCase();

            if (action === 'on' || action === 'enable') {
                database.updateGroupSettings(groupId, {
                    welcomeEnabled: true,
                    goodbyeEnabled: group.goodbye_enabled === 1,
                    antiLink: group.anti_link === 1,
                    antiSpam: group.anti_spam === 1,
                    profanityFilter: group.profanity_filter === 1
                });
                await message.reply('✅ Welcome messages have been *enabled*.');
            }
            else if (action === 'off' || action === 'disable') {
                database.updateGroupSettings(groupId, {
                    welcomeEnabled: false,
                    goodbyeEnabled: group.goodbye_enabled === 1,
                    antiLink: group.anti_link === 1,
                    antiSpam: group.anti_spam === 1,
                    profanityFilter: group.profanity_filter === 1
                });
                await message.reply('✅ Welcome messages have been *disabled*.');
            }
            else if (action === 'set') {
                const customMessage = args.slice(1).join(' ');
                
                if (!customMessage) {
                    await message.reply('❌ Please provide a welcome message.');
                    return;
                }

                database.setGroupWelcomeMessage(groupId, customMessage);
                await message.reply(`✅ Welcome message has been set to:\n\n${customMessage}`);
            }
            else {
                await message.reply(`❌ Invalid option. Use: ${this.usage}`);
            }

        } catch (error) {
            console.error('Error in welcome command:', error);
            await message.reply('❌ An error occurred while managing welcome message.');
        }
    }
};
