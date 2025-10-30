module.exports = {
    name: 'groupinfo',
    aliases: ['ginfo', 'groupdetails'],
    description: 'Display group information',
    usage: '/groupinfo',
    groupOnly: true,
    cooldown: 5000,
    
    async execute(client, message, args) {
        try {
            const chat = await message.getChat();
            
            if (!chat.isGroup) {
                await message.reply('❌ This command can only be used in groups.');
                return;
            }

            // Count admins and members
            let adminCount = 0;
            let memberCount = 0;

            for (const participant of chat.participants) {
                if (participant.isAdmin || participant.isSuperAdmin) {
                    adminCount++;
                } else {
                    memberCount++;
                }
            }

            // Format creation date
            const createdDate = chat.createdAt ? new Date(chat.createdAt * 1000).toLocaleDateString() : 'Unknown';

            let infoText = `📊 *Group Information*\n\n`;
            infoText += `📝 *Name:* ${chat.name}\n`;
            infoText += `🆔 *ID:* ${chat.id._serialized}\n`;
            infoText += `📅 *Created:* ${createdDate}\n`;
            infoText += `👥 *Total Members:* ${chat.participants.length}\n`;
            infoText += `👑 *Admins:* ${adminCount}\n`;
            infoText += `👤 *Members:* ${memberCount}\n`;
            
            if (chat.description) {
                infoText += `\n📄 *Description:*\n${chat.description}`;
            }

            await message.reply(infoText);
        } catch (error) {
            console.error('Error in groupinfo command:', error);
            await message.reply('❌ An error occurred while fetching group information.');
        }
    }
};
