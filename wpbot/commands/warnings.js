const logger = require('../utils/logger');
const database = require('../database/database');
const helpers = require('../utils/helpers');

module.exports = {
    name: 'warnings',
    aliases: ['warns'],
    description: 'Display warning and mute history for a user in this group.',
    usage: '/warnings @user',
    groupOnly: true,
    adminOnly: true,
    cooldown: 5000,

    async execute(client, message) {
        try {
            const groupId = message.from;
            const targetUser = await helpers.extractTargetUserFromMessage(message);
            const eligibility = await helpers.ensureModerationEligibility(client, message, targetUser, {
                allowSelf: true,
                allowAdminTarget: true
            });

            if (!eligibility.ok) {
                await message.reply(eligibility.error);
                return;
            }

            const summary = helpers.buildModerationSummary(targetUser, groupId);

            let contact = null;
            try {
                contact = await client.getContactById(targetUser);
            } catch (error) {
                logger.error('Failed to fetch contact during warnings command:', error);
            }

            const mentionTarget = contact?.number ? `@${contact.number}` : helpers.formatPhone(targetUser) || targetUser;
            const mentionOptions = contact ? { mentions: [contact] } : undefined;

            const warningLines = summary.groupWarnings.slice(0, 5).map((warning, index) => {
                const issuer = warning.warned_by?.split('@')[0] || 'unknown';
                const issuedAt = new Date(warning.created_at).toLocaleString();
                return `${index + 1}. ${warning.reason} — by ${issuer} (${issuedAt})`;
            });

            const activeMute = summary.activeMute;
            let muteLine = 'None';
            if (activeMute) {
                const remaining = activeMute.expires_at ? Math.max(activeMute.expires_at - Date.now(), 0) : null;
                const durationText = remaining ? helpers.formatDuration(remaining) : 'until further notice';
                muteLine = `${activeMute.reason || 'No reason'} — ends ${remaining ? `in ${durationText}` : 'when lifted manually'}`;
            }

            const messageParts = [
                `📋 Moderation log for ${mentionTarget}`,
                '',
                `Total warnings (all groups): ${summary.totalWarnings}`,
                `Warnings in this group: ${summary.groupWarnings.length}`,
                '',
                'Recent warnings:',
                warningLines.length ? warningLines.join('\n') : '• None recorded.',
                '',
                `Active mute: ${muteLine}`,
                `Total mutes: ${summary.totalMutes}`
            ];

            await message.reply(messageParts.join('\n'), null, mentionOptions);
            logger.info(`[MODERATION] Warnings viewed for ${targetUser} in ${groupId}`);
        } catch (error) {
            console.error('Error in warnings command:', error);
            await message.reply('❌ Failed to fetch warnings.');
        }
    }
};
