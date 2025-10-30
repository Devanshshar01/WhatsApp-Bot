const helpers = require('../utils/helpers');

module.exports = {
    name: 'broadcast',
    aliases: ['bc'],
    description: 'Broadcast message to all groups',
    usage: '/broadcast <message>',
    ownerOnly: true,
    cooldown: 10000,
    
    async execute(client, message, args) {
        try {
            if (args.length === 0) {
                await message.reply(`❌ Please provide a message to broadcast.\n\nUsage: ${this.usage}`);
                return;
            }

            const broadcastMessage = args.join(' ');
            
            await message.reply('📡 Broadcasting message to all groups...');

            // Get all chats
            const chats = await client.getChats();
            const groups = chats.filter(chat => chat.isGroup);

            let successCount = 0;
            let failCount = 0;

            for (const group of groups) {
                try {
                    await helpers.sleep(1000); // Delay to avoid spam detection
                    
                    const formattedMessage = `📢 *Broadcast Message*\n\n${broadcastMessage}`;
                    await group.sendMessage(formattedMessage);
                    successCount++;
                } catch (error) {
                    console.error(`Failed to send to ${group.name}:`, error);
                    failCount++;
                }
            }

            let response = `✅ *Broadcast Complete*\n\n`;
            response += `✅ Sent to: ${successCount} groups\n`;
            if (failCount > 0) {
                response += `❌ Failed: ${failCount} groups`;
            }

            await message.reply(response);

        } catch (error) {
            console.error('Error in broadcast command:', error);
            await message.reply('❌ An error occurred while broadcasting message.');
        }
    }
};
