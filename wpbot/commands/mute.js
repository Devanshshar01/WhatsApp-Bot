const logger = require('../utils/logger');
const database = require('../database/database');
const helpers = require('../utils/helpers');

const PERMANENT_KEYWORDS = ['perm', 'permanent', 'forever'];

function parseDurationAndReason(tokens) {
    if (!tokens.length) {
        return {
            durationMs: helpers.parseDuration(null),
            reason: 'No reason provided'
        };
    }

    const [first, ...rest] = tokens;
    if (PERMANENT_KEYWORDS.includes(first.toLowerCase())) {
        return {
            durationMs: null,
            reason: rest.join(' ').trim() || 'No reason provided'
        };
    }

    const parsedDuration = helpers.parseDuration(first, 30);
    if (parsedDuration === null) {
        return {
            durationMs: helpers.parseDuration(null),
            reason: tokens.join(' ').trim() || 'No reason provided'
        };
    }

    return {
        durationMs: parsedDuration,
        reason: rest.join(' ').trim() || 'No reason provided'
    };
}

module.exports = {
    name: 'mute',
    aliases: ['tempmute'],
    description: 'Mute a user in the group for a duration (default 30 minutes).',
    usage: '/mute @user <duration> <reason>\nExamples:\n/mute @user 30m Spamming\n/mute @user 2h Breaking rules\n/mute @user perm Severe violation',
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
                await message.reply('⚠️ I need to be a group admin to mute members. Please promote me and try again.');
                return;
            }

            if (database.getActiveMute(targetUser, groupId)) {
                await message.reply('⚠️ This user is already muted.');
                return;
            }

            const tokens = [...args];
            if (message.mentionedIds && message.mentionedIds.length > 0 && tokens.length) {
                tokens.shift();
            }

            const { durationMs, reason } = parseDurationAndReason(tokens);
            const actorId = eligibility.actorId;
            const muteRecord = database.addMute(targetUser, groupId, durationMs, reason, actorId);
            const contact = await client.getContactById(targetUser);
            const durationText = durationMs ? helpers.formatDuration(durationMs) : null;
            const durationLabel = durationMs ? `for ${durationText}` : 'permanently';

            let reply = `🚫 @${contact.number} has been muted ${durationLabel}.\nReason: ${reason}`;

            if (muteRecord.case_id) {
                reply += `\nCase ID: ${muteRecord.case_id}`;
            }

            await message.reply(
                reply,
                null,
                { mentions: [contact] }
            );

            const logDurationText = durationMs ? durationText : 'permanently';
            logger.info(`[MODERATION] ${actorId} muted ${targetUser} in ${groupId} ${durationMs ? `for ${logDurationText}` : logDurationText}. Reason: ${reason}`);

            if (durationMs && muteRecord.expires_at) {
                const expiresAt = new Date(muteRecord.expires_at).toLocaleString();
                logger.debug?.(`[MODERATION] Mute expires at ${expiresAt}`);
            }
        } catch (error) {
            console.error('Error in mute command:', error);
            await message.reply('❌ Failed to mute the user.');
        }
    }
};
