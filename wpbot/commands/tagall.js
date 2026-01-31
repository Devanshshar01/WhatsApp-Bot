const helpers = require('../utils/helpers');

const MAX_TAGALL_MEMBERS = 256; // WhatsApp has limits on mentions

module.exports = {
    name: 'tagall',
    aliases: ['everyone', 'all'],
    description: 'Tag all group members',
    usage: '/tagall [message]',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    cooldown: 10000,
    
    async execute(client, message, args) {
        try {
            const chat = await message.getChat();

            // Get all participants
            const participants = chat.participants;
            
            if (participants.length === 0) {
                await message.reply('❌ No participants found in this group.');
                return;
            }

            // Check if group is too large
            if (participants.length > MAX_TAGALL_MEMBERS) {
                await message.reply(`❌ This group has ${participants.length} members. Tagall is limited to groups with ${MAX_TAGALL_MEMBERS} or fewer members to prevent spam issues.`);
                return;
            }

            // Validate custom message length
            const customMessage = args.join(' ') || 'Attention everyone!';
            if (customMessage.length > 1000) {
                await message.reply('❌ Message too long. Maximum 1000 characters.');
                return;
            }
            
            let text = `📢 *Group Announcement*\n\n${customMessage}\n\n`;
            
            // Create mentions array
            const mentions = [];
            
            // Add all participants
            for (const participant of participants) {
                const contact = await client.getContactById(participant.id._serialized);
                text += `@${contact.number} `;
                mentions.push(contact);
            }

            // Send message with mentions
            await chat.sendMessage(text, { mentions });
            
        } catch (error) {
            console.error('Error in tagall command:', error);
            await message.reply('❌ An error occurred while tagging members.');
        }
    }
};
