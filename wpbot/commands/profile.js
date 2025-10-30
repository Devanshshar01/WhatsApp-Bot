const database = require('../database/database');
const helpers = require('../utils/helpers');

module.exports = {
    name: 'profile',
    aliases: ['me', 'stats'],
    description: 'Show your bot usage statistics',
    usage: '/profile',
    cooldown: 5000,
    
    async execute(client, message, args) {
        try {
            const target = await this.resolveTarget(client, message, args);
            if (!target) {
                await message.reply('❌ Could not find that user. Mention them, reply to their message, or use their number.');
                return;
            }

            const userRecord = database.getUser(target.id);
            if (!userRecord) {
                await message.reply('ℹ️ No activity recorded for this user yet.');
                return;
            }

            const lastActive = userRecord.last_seen ? new Date(userRecord.last_seen) : null;
            const createdAt = userRecord.created_at ? new Date(userRecord.created_at) : null;

            let response = `👤 *User Profile*
\n`;
            response += `• *Name:* ${target.name || target.pushname || target.number || target.id}
`;
            response += `• *Phone:* ${userRecord.phone || target.number || 'Unknown'}
`;
            response += `• *WhatsApp ID:* ${userRecord.id}
`;
            response += `• *Messages tracked:* ${userRecord.message_count || 0}
`;
            response += `• *Blocked:* ${userRecord.is_blocked ? 'Yes 🚫' : 'No ✅'}
`;

            if (lastActive) {
                response += `• *Last active:* ${lastActive.toLocaleString()}
`;
                response += `• *Last seen (relative):* ${helpers.formatTimeAgo(userRecord.last_seen)}
`;
            }

            if (createdAt) {
                response += `• *First seen:* ${createdAt.toLocaleString()}
`;
            }

            // Mention user in reply if command executed in group
            if (message.from.endsWith('@g.us')) {
                await message.reply(response, undefined, { mentions: [target] });
            } else {
                await message.reply(response);
            }
        } catch (error) {
            console.error('Error in profile command:', error);
            await message.reply('❌ Unable to fetch profile at the moment.');
        }
    },

    async resolveTarget(client, message, args) {
        // Reply target has highest priority
        if (message.hasQuotedMsg) {
            const quoted = await message.getQuotedMessage();
            const contact = await quoted.getContact();
            return contact;
        }

        // Mentioned user (first mention)
        if (message.mentionedIds && message.mentionedIds.length > 0) {
            const contact = await client.getContactById(message.mentionedIds[0]);
            return contact;
        }

        // If arguments include a phone number or ID
        if (args.length > 0) {
            const raw = args[0];
            const cleaned = raw.replace(/[^0-9]/g, '');

            if (cleaned.length >= 8) {
                try {
                    const contactId = cleaned.endsWith('@c.us') || cleaned.endsWith('@lid')
                        ? cleaned
                        : `${cleaned}@c.us`;

                    const contact = await client.getContactById(contactId);
                    return contact;
                } catch (err) {
                    console.warn('Failed to resolve contact from args', err);
                }
            }
        }

        // Default to command invoker
        return await message.getContact();
    }
};
