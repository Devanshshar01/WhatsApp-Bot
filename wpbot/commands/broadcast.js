const helpers = require('../utils/helpers');

// Store pending broadcast confirmations
const pendingBroadcasts = new Map();

module.exports = {
    name: 'broadcast',
    aliases: ['bc'],
    description: 'Broadcast message to all groups',
    usage: '/broadcast <message>',
    category: 'owner',
    ownerOnly: true,
    cooldown: 10000,
    
    async execute(client, message, args) {
        try {
            const userId = message.author || message.from;
            
            // Check if this is a confirmation
            if (args.length === 1 && args[0].toLowerCase() === 'confirm') {
                const pending = pendingBroadcasts.get(userId);
                if (!pending || Date.now() - pending.timestamp > 60000) {
                    pendingBroadcasts.delete(userId);
                    await message.reply('❌ No pending broadcast or confirmation expired. Please start again.');
                    return;
                }
                
                // Execute the broadcast
                await this.executeBroadcast(client, message, pending.message, pending.groups);
                pendingBroadcasts.delete(userId);
                return;
            }
            
            // Check if cancelling
            if (args.length === 1 && args[0].toLowerCase() === 'cancel') {
                if (pendingBroadcasts.has(userId)) {
                    pendingBroadcasts.delete(userId);
                    await message.reply('✅ Broadcast cancelled.');
                } else {
                    await message.reply('❌ No pending broadcast to cancel.');
                }
                return;
            }
            
            if (args.length === 0) {
                await message.reply(`❌ Please provide a message to broadcast.\n\nUsage: ${this.usage}`);
                return;
            }

            const broadcastMessage = args.join(' ');
            
            // Validate message length
            if (broadcastMessage.length > 2000) {
                await message.reply('❌ Message too long. Maximum 2000 characters.');
                return;
            }

            // Get all groups for preview
            const chats = await client.getChats();
            const groups = chats.filter(chat => chat.isGroup);
            
            if (groups.length === 0) {
                await message.reply('❌ No groups found to broadcast to.');
                return;
            }
            
            // Store pending broadcast
            pendingBroadcasts.set(userId, {
                message: broadcastMessage,
                groups: groups,
                timestamp: Date.now()
            });
            
            // Show confirmation prompt
            let confirmMsg = `⚠️ *Broadcast Confirmation Required*\n\n`;
            confirmMsg += `📝 *Message Preview:*\n${broadcastMessage.substring(0, 200)}${broadcastMessage.length > 200 ? '...' : ''}\n\n`;
            confirmMsg += `📊 *Will be sent to:* ${groups.length} groups\n\n`;
            confirmMsg += `To proceed, reply with:\n`;
            confirmMsg += `• \`/broadcast confirm\` - Send to all groups\n`;
            confirmMsg += `• \`/broadcast cancel\` - Cancel broadcast\n\n`;
            confirmMsg += `_⏱️ Confirmation expires in 60 seconds_`;
            
            await message.reply(confirmMsg);

        } catch (error) {
            console.error('Error in broadcast command:', error);
            await message.reply('❌ An error occurred while broadcasting message.');
        }
    },
    
    async executeBroadcast(client, message, broadcastMessage, groups) {
        await message.reply(`📡 Broadcasting to ${groups.length} groups...`);

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
    }
};
