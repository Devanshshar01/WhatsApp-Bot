const logger = require('../utils/logger');
const database = require('../database/database');
const helpers = require('../utils/helpers');

const CASE_ID_PATTERN = /^CASE-\d{5,}$/i;

module.exports = {
    name: 'clear',
    description: 'Delete a specific moderation record by case ID.',
    usage: '/clear @user CASE-00001',
    category: 'moderation',
    groupOnly: true,
    adminOnly: true,
    cooldown: 5000,

    async execute(client, message, args) {
        try {
            const groupId = message.from;
            const targetUser = await helpers.extractTargetUserFromMessage(message);
            const eligibility = await helpers.ensureModerationEligibility(client, message, targetUser, {
                allowAdminTarget: true,
                allowSelf: true
            });

            if (!eligibility.ok) {
                await message.reply(eligibility.error);
                return;
            }

            const tokens = [...args];
            if (message.mentionedIds && message.mentionedIds.length > 0 && tokens.length) {
                tokens.shift();
            }

            if (!tokens.length) {
                await message.reply('⚠️ Please provide the case ID you want to delete. Example: /clear @user CASE-00001');
                return;
            }

            const caseIdInput = tokens.shift();
            const caseId = typeof caseIdInput === 'string' ? caseIdInput.trim().toUpperCase() : '';

            if (!CASE_ID_PATTERN.test(caseId)) {
                await message.reply('⚠️ Invalid case ID format. Expected format like CASE-00001.');
                return;
            }

            const caseInfo = database.getModerationCase(caseId);
            if (!caseInfo) {
                await message.reply(`⚠️ Could not find any moderation record with ID ${caseId}.`);
                return;
            }

            const recordUserId = caseInfo.record?.user_id || caseInfo.record?.payload?.user_id || null;
            if (recordUserId && targetUser && recordUserId !== targetUser) {
                await message.reply('⚠️ The provided case ID does not belong to the mentioned user.');
                return;
            }

            const result = database.deleteModerationCase(caseId);
            if (!result) {
                await message.reply('⚠️ Failed to delete the moderation record. Please try again.');
                return;
            }

            const contact = targetUser ? await client.getContactById(targetUser).catch(() => null) : null;
            const mentionTarget = contact?.number ? `@${contact.number}` : helpers.formatPhone(targetUser) || targetUser || 'User';
            const mentionOptions = contact ? { mentions: [contact] } : undefined;

            const caseType = result.type === 'warning'
                ? 'warning'
                : result.type === 'mute'
                    ? 'mute'
                    : 'log entry';

            const recordGroup = result.record?.group_id || result.record?.payload?.group_id || '—';
            const recordReason = result.record?.reason || result.record?.payload?.reason || 'No reason recorded';

            await message.reply(
                `🗑️ Removed ${caseType} case ${caseId} for ${mentionTarget}.\nGroup: ${recordGroup}\nReason recorded: ${recordReason}`,
                null,
                mentionOptions
            );

            logger.info(`[MODERATION] ${eligibility.actorId} removed case ${caseId} (${caseType}) for ${targetUser || 'unknown user'} in ${groupId}`);
        } catch (error) {
            console.error('Error in clear command:', error);
            await message.reply('❌ Failed to delete the moderation record.');
        }
    }
};
