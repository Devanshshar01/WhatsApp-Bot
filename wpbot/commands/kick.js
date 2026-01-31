const logger = require('../utils/logger');
const database = require('../database/database');
const helpers = require('../utils/helpers');

module.exports = {
    name: 'kick',
    aliases: ['remove', 'yeet'],
    description: 'Remove a user from the group',
    usage: '/kick <@mention or reply> [reason]',
    category: 'moderation',
    groupOnly: true,
    adminOnly: true,
    cooldown: 5000,

    async execute(client, message, args) {
        try {
            const groupId = message.from;
            const targetUser = await helpers.extractTargetUserFromMessage(message);
            
            if (!targetUser) {
                await message.reply('⚠️ Please mention a user or reply to their message.');
                return;
            }
            
            const eligibility = await helpers.ensureModerationEligibility(client, message, targetUser);
            
            if (!eligibility.ok) {
                await message.reply(eligibility.error);
                return;
            }
            
            const isBotAdmin = await helpers.isBotGroupAdmin(message);
            if (!isBotAdmin) {
                await message.reply('⚠️ I need to be a group admin to remove members. Please promote me and try again.');
                return;
            }
            
            // Parse reason from args (skip first arg if it's a mention)
            const tokens = [...args];
            if (message.mentionedIds && message.mentionedIds.length > 0 && tokens.length) {
                tokens.shift();
            }
            const reason = tokens.join(' ').trim() || 'No reason provided';
            
            // Validate reason length
            if (reason.length > 500) {
                await message.reply('❌ Reason too long. Maximum 500 characters.');
                return;
            }
            
            const chat = await message.getChat();
            const contact = await client.getContactById(targetUser);
            const actorId = eligibility.actorId;
            
            // Attempt to remove the user
            try {
                await chat.removeParticipants([targetUser]);
            } catch (removeError) {
                logger.error('Error removing participant:', removeError);
                await message.reply('❌ Failed to remove the user. They may have already left or I may not have sufficient permissions.');
                return;
            }
            
            // Log the kick action
            database.addModerationLog('kick', {
                user_id: targetUser,
                group_id: groupId,
                reason,
                actor: actorId
            });
            
            let response = `👢 @${contact.number} has been removed from the group.\n`;
            response += `📝 *Reason:* ${reason}`;
            
            await message.reply(response, null, { mentions: [contact] });
            
            logger.info(`[MODERATION] ${actorId} kicked ${targetUser} from ${groupId}. Reason: ${reason}`);
            
        } catch (error) {
            console.error('Error in kick command:', error);
            await message.reply('❌ An error occurred while trying to remove the user.');
        }
    }
};
