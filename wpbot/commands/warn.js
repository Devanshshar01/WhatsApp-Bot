const logger = require('../utils/logger');
const database = require('../database/database');
const helpers = require('../utils/helpers');

module.exports = {
    name: 'warn',
    description: 'Issue a warning to a user in the group.',
    usage: '/warn @user <reason>',
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

            const tokens = [...args];
            if (message.mentionedIds && message.mentionedIds.length > 0 && tokens.length) {
                tokens.shift();
            }

            const reason = tokens.join(' ').trim() || 'No reason provided';
            const actorId = message.author || message.from;

            const { warning, totalWarnings, autoMute, caseId } = database.addWarning(targetUser, groupId, reason, actorId);
            let contact = null;
            try {
                contact = await client.getContactById(targetUser);
            } catch (error) {
                logger.error('Failed to fetch contact during warn command:', error);
            }

            const mentionTarget = contact?.number ? `@${contact.number}` : 'User';
            const mentionOptions = contact ? { mentions: [contact] } : undefined;

            let response = `⚠️ Warning issued to ${mentionTarget}\n` +
                `• Reason: ${reason}\n` +
                `• Total warnings in this group: ${totalWarnings}`;

            if (caseId) {
                response += `\n• Case ID: ${caseId}`;
            }

            if (autoMute) {
                const durationMs = autoMute.expires_at ? autoMute.expires_at - Date.now() : 30 * 60 * 1000;
                const durationText = helpers.formatDuration(durationMs);
                response += `\n\n🚫 Automatic mute applied for ${durationText}.`;
            }

            await message.reply(response, null, mentionOptions);

            if (autoMute) {
                const durationMs = autoMute.expires_at ? autoMute.expires_at - Date.now() : 30 * 60 * 1000;
                const durationText = helpers.formatDuration(durationMs);
                const autoReason = autoMute.reason || 'Repeated warnings';
                await message.reply(
                    `🚫 ${mentionTarget} has been muted for ${durationText}.\nReason: ${autoReason}`,
                    null,
                    mentionOptions
                );
            }

            logger.info(`[MODERATION] Warning issued to ${targetUser} in ${groupId}. Reason: ${reason}. Total warnings: ${totalWarnings}`);
        } catch (error) {
            console.error('Error in warn command:', error);
            await message.reply('❌ Failed to issue warning.');
        }
    }
};
