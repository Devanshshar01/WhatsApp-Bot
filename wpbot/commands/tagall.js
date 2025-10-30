const helpers = require('../utils/helpers');

module.exports = {
    name: 'tagall',
    aliases: ['everyone', 'all'],
    description: 'Tag all group members',
    usage: '/tagall [message]',
    groupOnly: true,
    adminOnly: true,
    cooldown: 10000,
    
    async execute(client, message, args) {
        try {
            const chat = await message.getChat();
            
            if (!chat.isGroup) {
                await message.reply('❌ This command can only be used in groups.');
                return;
            }

            // Get all participants
            const participants = chat.participants;
            
            if (participants.length === 0) {
                await message.reply('❌ No participants found in this group.');
                return;
            }

            // Prepare message
            const customMessage = args.join(' ') || 'Attention everyone!';
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
