require('dotenv').config();

module.exports = {
    // Bot Settings
    botName: process.env.BOT_NAME || 'WhatsApp Bot',
    prefix: process.env.PREFIX || '/',
    ownerNumbers: process.env.OWNER_NUMBERS ? process.env.OWNER_NUMBERS.split(',') : [],
    
    // Database
    databasePath: process.env.DATABASE_PATH || './database/bot.db',
    
    // Features
    features: {
        autoResponse: process.env.ENABLE_AUTO_RESPONSE === 'true',
        antiSpam: process.env.ENABLE_ANTI_SPAM === 'true',
        antiLink: process.env.ENABLE_ANTI_LINK === 'true',
        profanityFilter: process.env.ENABLE_PROFANITY_FILTER === 'true'
    },
    
    // Rate Limiting
    commandCooldown: parseInt(process.env.COMMAND_COOLDOWN) || 3000,
    maxMessagesPerMinute: parseInt(process.env.MAX_MESSAGES_PER_MINUTE) || 10,
    
    // Media
    mediaFolder: process.env.MEDIA_FOLDER || './media',
    maxMediaSize: parseInt(process.env.MAX_MEDIA_SIZE) || 16777216, // 16MB
    
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    enableMessageLogging: process.env.ENABLE_MESSAGE_LOGGING === 'true',
    
    // Auto Response Messages
    autoResponses: {
        greeting: ['hi', 'hello', 'hey', 'hola', 'namaste'],
        greetingReply: '👋 Hello! I\'m a WhatsApp bot. Type /help to see available commands.',
        helpReply: `📋 *Available Commands:*\n\n*Basic:*\n/help - Show this menu\n/menu - Display command list\n/about - Bot information\n/ping - Check bot status\n\n*Media:*\n/sticker - Convert image to sticker\n/download - Download media from message\n\n*Group (Admin):*\n/tagall - Tag all members\n/add - Add member\n/remove - Remove member\n/promote - Promote to admin\n/demote - Demote from admin\n/groupinfo - Group information\n\n*Owner Only:*\n/broadcast - Send message to all groups\n/leave - Leave group\n/block - Block user\n/unblock - Unblock user`
    },
    
    // Profanity Filter Words
    profanityWords: ['badword1', 'badword2', 'badword3'], // Add your list
    
    // Welcome/Goodbye Messages
    welcomeMessage: '👋 Welcome to the group, @user! Please read the group description.',
    goodbyeMessage: '👋 Goodbye @user! Thanks for being part of the group.',
    
    // Group Settings
    groupSettings: {
        antiLink: {
            enabled: true,
            allowedDomains: ['youtube.com', 'youtu.be'],
            action: 'warn' // 'warn', 'delete', 'kick'
        },
        antiSpam: {
            enabled: true,
            maxMessages: 5,
            timeWindow: 10000, // 10 seconds
            action: 'warn'
        }
    }
};
