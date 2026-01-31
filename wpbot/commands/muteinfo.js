const logger = require('../utils/logger');
const database = require('../database/database');
const helpers = require('../utils/helpers');

module.exports = {
    name: 'muteinfo',
    aliases: ['mutestatus', 'ismuted'],
    description: 'Check mute status and remaining time for a user',
    usage: '/muteinfo [@user]',
    category: 'moderation',
    groupOnly: true,
    cooldown: 3000,

    async execute(client, message, args) {
        try {
            const groupId = message.from;
            let targetUser = await helpers.extractTargetUserFromMessage(message);
            
            // If no target specified, check the sender's own status
            if (!targetUser) {
                targetUser = message.author || message.from;
            }
            
            const activeMute = database.getActiveMute(targetUser, groupId);
            const contact = await client.getContactById(targetUser);
            const userName = contact?.pushname || contact?.name || contact?.number || 'Unknown';
            
            if (!activeMute) {
                const isSelf = targetUser === (message.author || message.from);
                if (isSelf) {
                    await message.reply('✅ You are not currently muted in this group.');
                } else {
                    await message.reply(`✅ @${contact.number} is not currently muted in this group.`, null, {
                        mentions: [contact]
                    });
                }
                return;
            }
            
            const now = Date.now();
            const remaining = activeMute.expires_at ? Math.max(activeMute.expires_at - now, 0) : null;
            const durationText = remaining ? helpers.formatDuration(remaining) : 'Permanent';
            const mutedAt = new Date(activeMute.created_at).toLocaleString();
            const expiresAt = activeMute.expires_at ? new Date(activeMute.expires_at).toLocaleString() : 'Never';
            
            let mutedByText = 'System';
            if (activeMute.muted_by && activeMute.muted_by !== 'system') {
                try {
                    const mutedByContact = await client.getContactById(activeMute.muted_by);
                    mutedByText = mutedByContact?.pushname || mutedByContact?.name || mutedByContact?.number || activeMute.muted_by;
                } catch (e) {
                    mutedByText = activeMute.muted_by;
                }
            }
            
            let response = `🚫 *Mute Information*\n\n`;
            response += `👤 *User:* @${contact.number}\n`;
            response += `⏱️ *Remaining:* ${durationText}\n`;
            response += `📝 *Reason:* ${activeMute.reason || 'No reason provided'}\n`;
            response += `👮 *Muted by:* ${mutedByText}\n`;
            response += `📅 *Muted at:* ${mutedAt}\n`;
            response += `⏰ *Expires:* ${expiresAt}\n`;
            
            if (activeMute.case_id) {
                response += `🆔 *Case ID:* ${activeMute.case_id}`;
            }
            
            await message.reply(response, null, { mentions: [contact] });
            
        } catch (error) {
            console.error('Error in muteinfo command:', error);
            await message.reply('❌ An error occurred while checking mute status.');
        }
    }
};
