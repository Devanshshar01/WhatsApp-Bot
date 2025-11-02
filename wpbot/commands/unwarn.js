const logger = require('../utils/logger');
const database = require('../database/database');
const helpers = require('../utils/helpers');

module.exports = {
    name: 'unwarn',
    aliases: ['clearwarns', 'delwarns'],
    description: 'Remove warnings issued to a user (group-only, admin/owner).',
    usage: '/unwarn @user [--all | groupId] [reason]',
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

            const tokens = [...args];
            if (message.mentionedIds && message.mentionedIds.length > 0 && tokens.length) {
                tokens.shift();
            }

            let scope = groupId;
            let reasonTokens = tokens;

            if (tokens[0] && tokens[0].toLowerCase() === '--all') {
                scope = 'all';
                reasonTokens = tokens.slice(1);
            } else if (tokens[0] && tokens[0].endsWith('@g.us')) {
                scope = tokens[0];
                reasonTokens = tokens.slice(1);
            }

            const reason = reasonTokens.join(' ').trim() || 'Warnings cleared by admin';

            const clearResult = scope === 'all'
                ? database.clearAllWarningsForUser(targetUser)
                : database.clearUserWarnings(targetUser, scope);

            if (!clearResult || clearResult.cleared === 0) {
                await message.reply('⚠️ No warnings were cleared. The user may not have any warnings in the selected scope.');
                return;
            }

            database.addModerationLog('unwarn', {
                user_id: targetUser,
                group_id: scope === 'all' ? null : scope,
                reason,
                actor: eligibility.actorId,
                cleared: clearResult.cleared,
                case_ids: clearResult.caseIds
            });

            const contact = await client.getContactById(targetUser);
            const mentionTarget = contact?.number ? `@${contact.number}` : 'User';
            const mentionOptions = contact ? { mentions: [contact] } : undefined;

            const scopeText = scope === 'all' ? 'across all groups' : 'in this group';
            const caseLine = clearResult.caseIds?.length ? `\nCase IDs: ${clearResult.caseIds.join(', ')}` : '';

            await message.reply(
                `✅ Cleared ${clearResult.cleared} warning(s) for ${mentionTarget} ${scopeText}.\nReason: ${reason}${caseLine}`,
                null,
                mentionOptions
            );

            logger.info(`[MODERATION] ${eligibility.actorId} cleared ${clearResult.cleared} warnings for ${targetUser} (scope: ${scope}). Reason: ${reason}`);
        } catch (error) {
            console.error('Error in unwarn command:', error);
            await message.reply('❌ Failed to clear warnings.');
        }
    }
};
