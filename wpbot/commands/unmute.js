const logger = require('../utils/logger');
const database = require('../database/database');
const helpers = require('../utils/helpers');

module.exports = {
    name: 'unmute',
    description: 'Lift an active mute from a user in the group.',
    usage: '/unmute @user [reason]',
    category: 'moderation',
    groupOnly: true,
    adminOnly: true,
    cooldown: 5000,

    async execute(client, message, args) {
        try {
            const groupId = message.from;
            const targetUser = await helpers.extractTargetUserFromMessage(message);
            const eligibility = await helpers.ensureModerationEligibility(client, message, targetUser, {
                allowAdminTarget: true
            });

            if (!eligibility.ok) {
                await message.reply(eligibility.error);
                return;
            }

            const activeMute = database.getActiveMute(targetUser, groupId);
            if (!activeMute) {
                await message.reply('⚠️ This user is not currently muted.');
                return;
            }

            const tokens = [...args];
            if (message.mentionedIds && message.mentionedIds.length > 0 && tokens.length) {
                tokens.shift();
            }
            const reason = tokens.join(' ').trim() || 'Mute lifted by admin';

            const actorId = eligibility.actorId;
            database.removeMute(targetUser, groupId, actorId, reason);
            const contact = await client.getContactById(targetUser);

            await message.reply(
                `✅ @${contact.number} has been unmuted.\nReason: ${reason}`,
                null,
                { mentions: [contact] }
            );

            logger.info(`[MODERATION] ${actorId} unmuted ${targetUser} in ${groupId}. Reason: ${reason}`);
        } catch (error) {
            console.error('Error in unmute command:', error);
            await message.reply('❌ Failed to unmute the user.');
        }
    }
};
