const config = require('../config');
const database = require('../database/database');

/**
 * Extract sender/actor ID from a message across different whatsapp-web.js shapes
 */
const getMessageActorId = (message) => (
    message.author ||
    message.id?.participant ||
    message._data?.participant ||
    message.from
);

/**
 * Check if user is bot owner
 */
const isOwner = (userId) => {
    const number = userId.split('@')[0];
    return config.ownerNumbers.includes(number);
};

/**
 * Check if user is group admin
 */
const isGroupAdmin = async (message) => {
    if (!message.from.endsWith('@g.us')) return false;

    try {
        const chat = await message.getChat();
        const actorId = getMessageActorId(message);

        let contact;
        try {
            contact = await message.getContact();
        } catch (contactError) {
            console.error('Error fetching contact for admin check:', contactError);
        }

        const contactId = contact?.id?._serialized;
        const contactNumber = contact?.number ? contact.number.replace(/\D/g, '') : null;

        const candidateIds = new Set([actorId, contactId].filter(Boolean));
        const candidateNumbers = new Set([
            actorId ? actorId.split('@')[0] : null,
            contactId ? contactId.split('@')[0] : null,
            contactNumber
        ].filter(Boolean));

        for (const participant of chat.participants) {
            const participantId = participant.id._serialized;
            const participantNumber = participant.id.user;

            if (candidateIds.has(participantId) || candidateNumbers.has(participantNumber)) {
                return participant.isAdmin || participant.isSuperAdmin;
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
};

/**
 * Check if bot is group admin
 */
const isBotGroupAdmin = async (message) => {
    if (!message.from.endsWith('@g.us')) return false;

    try {
        const chat = await message.getChat();
        const client = message.client || message._client;
        const me = client.info.wid._serialized;

        for (let participant of chat.participants) {
            if (participant.id._serialized === me) {
                return participant.isAdmin || participant.isSuperAdmin;
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking bot admin status:', error);
        return false;
    }
};

/**
 * Format phone number
 */
const formatPhone = (phone) => {
    return phone.replace(/\D/g, '');
};

/**
 * Sleep function
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Extract mentions from message
 */
const getMentions = (message) => {
    const mentions = [];
    const regex = /@(\d+)/g;
    let match;
    
    while ((match = regex.exec(message)) !== null) {
        mentions.push(`${match[1]}@c.us`);
    }
    
    return mentions;
};

/**
 * Check if message contains URL
 */
const containsURL = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(text);
};

/**
 * Extract URLs from text
 */
const extractURLs = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
};

/**
 * Check if text contains profanity
 */
const containsProfanity = (text) => {
    const lowerText = text.toLowerCase();
    return config.profanityWords.some(word => lowerText.includes(word.toLowerCase()));
};

/**
 * Parse duration string (e.g. 10m, 2h)
 */
const parseDuration = (text, defaultMinutes = 30) => {
    if (!text) {
        return defaultMinutes * 60 * 1000;
    }

    const durationRegex = /^(\d+)([smhdw])?$/i;
    const match = text.match(durationRegex);

    if (!match) {
        return null;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] ? match[2].toLowerCase() : 'm';

    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000
    };

    return value * (multipliers[unit] || multipliers.m);
};

/**
 * Format duration to human readable string
 */
const formatDuration = (ms) => {
    if (!ms || ms < 0) {
        return 'unknown duration';
    }

    const totalSeconds = Math.floor(ms / 1000);
    const units = [
        { label: 'day', value: 24 * 60 * 60 },
        { label: 'hour', value: 60 * 60 },
        { label: 'minute', value: 60 },
        { label: 'second', value: 1 }
    ];

    const parts = [];
    let remaining = totalSeconds;

    for (const unit of units) {
        if (remaining >= unit.value) {
            const count = Math.floor(remaining / unit.value);
            remaining -= count * unit.value;
            parts.push(`${count} ${unit.label}${count !== 1 ? 's' : ''}`);
        }
    }

    return parts.slice(0, 2).join(', ') || 'less than a second';
};

/**
 * Get random element from array
 */
const randomElement = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

/**
 * Chunk array into smaller arrays
 */
const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

const extractTargetUserFromMessage = async (message) => {
    let targetUser = null;

    if (message.hasQuotedMsg) {
        const quotedMsg = await message.getQuotedMessage();
        targetUser = quotedMsg.author || quotedMsg.from;
    } else if (message.mentionedIds && message.mentionedIds.length > 0) {
        [targetUser] = message.mentionedIds;
    }

    return targetUser;
};

const ensureModerationEligibility = async (client, message, targetUser, options = {}) => {
    const {
        allowSelf = false,
        allowOwnerTarget = false,
        allowAdminTarget = false,
        allowBotTarget = false,
        requireAdminActor = true
    } = options;

    if (!targetUser) {
        return { ok: false, error: '❌ Please mention a user or reply to their message.' };
    }

    const actorId = getMessageActorId(message);

    if (!allowSelf && targetUser === actorId) {
        return { ok: false, error: '⚠️ You cannot target yourself.' };
    }

    if (!allowOwnerTarget && isOwner(targetUser)) {
        return { ok: false, error: '⚠️ You cannot moderate the bot owner.' };
    }

    const botId = client.info?.wid?._serialized;
    if (!allowBotTarget && targetUser === botId) {
        return { ok: false, error: '⚠️ You cannot moderate the bot.' };
    }

    const chat = await message.getChat();
    const targetParticipant = chat.participants.find((participant) => participant.id._serialized === targetUser);
    if (!allowAdminTarget && (targetParticipant?.isAdmin || targetParticipant?.isSuperAdmin)) {
        return { ok: false, error: '⚠️ You cannot moderate another admin.' };
    }

    if (requireAdminActor && !isOwner(actorId)) {
        const actorParticipant = chat.participants.find((participant) => participant.id._serialized === actorId);
        if (!actorParticipant?.isAdmin && !actorParticipant?.isSuperAdmin) {
            return { ok: false, error: '❌ This command requires admin privileges.' };
        }
    }

    return { ok: true, actorId, targetParticipant };
};

const buildModerationSummary = (userId, groupId) => {
    const summary = database.getModerationSummaryForUser(userId);
    const groupWarnings = groupId ? database.getUserWarnings(userId, groupId) : [];
    const activeMute = groupId ? database.getActiveMute(userId, groupId) : null;

    return {
        totalWarnings: summary.warningsCount,
        groupWarnings,
        totalMutes: summary.totalMutes,
        activeMute,
        lastWarning: summary.lastWarning,
        lastMute: summary.lastMute
    };
};

module.exports = {
    getMessageActorId,
    isOwner,
    isGroupAdmin,
    isBotGroupAdmin,
    formatPhone,
    sleep,
    getMentions,
    containsURL,
    extractURLs,
    containsProfanity,
    parseDuration,
    formatDuration,
    randomElement,
    chunkArray,
    extractTargetUserFromMessage,
    ensureModerationEligibility,
    buildModerationSummary
};
