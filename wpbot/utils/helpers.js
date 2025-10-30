const config = require('../config');

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
        const userId = message.author || message.from;

        for (let participant of chat.participants) {
            if (participant.id._serialized === userId) {
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
 * Format time duration
 */
const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
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

module.exports = {
    isOwner,
    isGroupAdmin,
    isBotGroupAdmin,
    formatPhone,
    sleep,
    getMentions,
    containsURL,
    extractURLs,
    containsProfanity,
    formatDuration,
    randomElement,
    chunkArray
};
