const config = require('../config');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');
const cooldown = require('../utils/cooldown');
const database = require('../database/database');
const commandHandler = require('../utils/commandHandler');

class MessageHandler {
    /**
     * Handle incoming messages
     */
    async handle(client, message) {
        try {
            // Ignore if message is from status broadcast
            if (message.from === 'status@broadcast') return;

            // Get contact and update database
            const contact = await message.getContact();
            const userId = message.author || message.from;
            database.createOrUpdateUser(userId, contact.pushname || contact.name, contact.number);

            // Check if user is blocked
            if (database.isUserBlocked(userId)) {
                return;
            }

            // Check for spam
            if (config.features.antiSpam && cooldown.isSpamming(userId)) {
                logger.warn(`Spam detected from ${userId}`);
                await message.reply('⚠️ Please slow down! You are sending messages too quickly.');
                return;
            }

            // Get message body
            const body = message.body || '';

            // Handle group-specific filters
            if (message.from.endsWith('@g.us')) {
                await this.handleGroupFilters(client, message, body);
            }

            // Check for commands
            if (body.startsWith(config.prefix)) {
                await this.handleCommand(client, message, body);
                return;
            }

            // Auto-response for greetings
            if (config.features.autoResponse) {
                await this.handleAutoResponse(message, body);
            }

        } catch (error) {
            logger.error('Error in message handler:', error);
        }
    }

    /**
     * Handle command execution
     */
    async handleCommand(client, message, body) {
        const args = body.slice(config.prefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();

        if (!commandName) return;

        try {
            await commandHandler.execute(client, message, commandName, args);
        } catch (error) {
            logger.error(`Error executing command ${commandName}:`, error);
            await message.reply('❌ An error occurred while processing your command.');
        }
    }

    /**
     * Handle auto-responses
     */
    async handleAutoResponse(message, body) {
        const lowerBody = body.toLowerCase().trim();

        // Greeting response
        if (config.autoResponses.greeting.some(greeting => lowerBody === greeting)) {
            await message.reply(config.autoResponses.greetingReply);
            return;
        }

        // Help response
        if (lowerBody === 'help' || lowerBody === 'menu') {
            await message.reply(config.autoResponses.helpReply);
            return;
        }
    }

    /**
     * Handle group-specific filters
     */
    async handleGroupFilters(client, message, body) {
        const groupId = message.from;
        const group = database.getGroup(groupId);

        if (!group) {
            const chat = await message.getChat();
            database.createOrUpdateGroup(groupId, chat.name, chat.description || '');
            return;
        }

        const userId = message.author || message.from;
        const isAdmin = await helpers.isGroupAdmin(message);
        const isOwner = helpers.isOwner(userId);

        // Skip filters for admins and owners
        if (isAdmin || isOwner) return;

        // Anti-link filter
        if (group.anti_link === 1 && helpers.containsURL(body)) {
            const urls = helpers.extractURLs(body);
            const hasDisallowedLink = urls.some(url => {
                return !config.groupSettings.antiLink.allowedDomains.some(domain => 
                    url.includes(domain)
                );
            });

            if (hasDisallowedLink) {
                logger.warn(`Link detected in group ${groupId} from ${userId}`);
                
                try {
                    await message.delete(true);
                    await message.reply('⚠️ Links are not allowed in this group!');
                    
                    // Add warning
                    database.addWarning(userId, groupId, 'Sent disallowed link', 'system');
                } catch (error) {
                    logger.error('Error deleting message with link:', error);
                }
                return;
            }
        }

        // Profanity filter
        if (group.profanity_filter === 1 && helpers.containsProfanity(body)) {
            logger.warn(`Profanity detected in group ${groupId} from ${userId}`);
            
            try {
                await message.delete(true);
                await message.reply('⚠️ Please maintain respectful language in this group!');
                
                // Add warning
                database.addWarning(userId, groupId, 'Used profanity', 'system');
            } catch (error) {
                logger.error('Error deleting message with profanity:', error);
            }
        }
    }
}

module.exports = new MessageHandler();
