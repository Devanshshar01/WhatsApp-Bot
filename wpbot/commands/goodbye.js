const database = require('../database/database');

module.exports = {
    name: 'goodbye',
    aliases: ['setgoodbye'],
    description: 'Set custom goodbye message for group',
    usage: '/goodbye <on|off|set message>',
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
                const status = group.goodbye_enabled === 1 ? 'enabled' : 'disabled';
                const settings = database.getGroupSettings(groupId);
                const currentMsg = settings?.goodbye_message || 'Default message';
                
                let response = `👋 Goodbye message is currently *${status}*.\n\n`;
                response += `*Current message:*\n${currentMsg}\n\n`;
                response += `*Usage:*\n`;
                response += `${this.usage}\n\n`;
                response += `*Placeholders:*\n`;
                response += `@user - User name\n`;
                response += `{user} - User name\n`;
                response += `{group} - Group name`;
                
                await message.reply(response);
                return;
            }

            const action = args[0].toLowerCase();

            if (action === 'on' || action === 'enable') {
                database.updateGroupSettings(groupId, {
                    welcomeEnabled: group.welcome_enabled === 1,
                    goodbyeEnabled: true,
                    antiLink: group.anti_link === 1,
                    antiSpam: group.anti_spam === 1,
                    profanityFilter: group.profanity_filter === 1
                });
                await message.reply('✅ Goodbye messages have been *enabled*.');
            }
            else if (action === 'off' || action === 'disable') {
                database.updateGroupSettings(groupId, {
                    welcomeEnabled: group.welcome_enabled === 1,
                    goodbyeEnabled: false,
                    antiLink: group.anti_link === 1,
                    antiSpam: group.anti_spam === 1,
                    profanityFilter: group.profanity_filter === 1
                });
                await message.reply('✅ Goodbye messages have been *disabled*.');
            }
            else if (action === 'set') {
                const customMessage = args.slice(1).join(' ');
                
                if (!customMessage) {
                    await message.reply('❌ Please provide a goodbye message.');
                    return;
                }

                database.setGroupGoodbyeMessage(groupId, customMessage);
                await message.reply(`✅ Goodbye message has been set to:\n\n${customMessage}`);
            }
            else {
                await message.reply(`❌ Invalid option. Use: ${this.usage}`);
            }

        } catch (error) {
            console.error('Error in goodbye command:', error);
            await message.reply('❌ An error occurred while managing goodbye message.');
        }
    }
};
