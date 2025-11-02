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
            // Add detailed logging for debugging
            console.log('[DEBUG] Message received:', {
                from: message.from,
                author: message.author,
                body: message.body,
                type: message.type,
                isForwarded: message.isForwarded,
                timestamp: new Date().toISOString()
            });

            // Ignore if message is from status broadcast
            if (message.from === 'status@broadcast') return;

            // Get contact and update database
            const contact = await message.getContact();
            const userId = helpers.getMessageActorId(message);
            if (!userId) {
                logger.warn('Unable to resolve message actor, skipping processing');
                return;
            }
            const userName = contact.pushname || contact.name || 'Unknown';
            const userNumber = contact.number || userId.split('@')[0];
            
            console.log('[DEBUG] Contact info:', {
                userId,
                userName,
                userNumber
            });

            database.createOrUpdateUser(userId, userName, userNumber);

            // Check if user is blocked
            if (database.isUserBlocked(userId)) {
                console.log('[DEBUG] User is blocked:', userId);
                return;
            }

            // Check for spam
            const antiSpamEnabled = database.getFeatureFlag('antiSpam', config.features.antiSpam);
            if (antiSpamEnabled && cooldown.isSpamming(userId)) {
                logger.warn(`Spam detected from ${userId}`);
                await message.reply('⚠️ Please slow down! You are sending messages too quickly.');
                return;
            }

            // Get message body
            const body = message.body || '';
            console.log('[DEBUG] Message body:', body);
            console.log('[DEBUG] Prefix check:', body.startsWith(config.prefix), 'Prefix:', config.prefix);

            if (message.from.endsWith('@g.us')) {
                const muteHandled = await this.handleMuteEnforcement(client, message, contact);
                if (muteHandled) {
                    return;
                }
            }

            // Handle group-specific filters (but don't return if it's a command)
            if (message.from.endsWith('@g.us') && !body.startsWith(config.prefix)) {
                await this.handleGroupFilters(client, message, body);
            }

            // Check for commands
            if (body.startsWith(config.prefix)) {
                logger.info(`Command detected from ${userId}: ${body}`);
                console.log('[DEBUG] Processing command:', body);
                await this.handleCommand(client, message, body);
                return;
            }

            // Auto-response for greetings
            const autoResponseEnabled = database.getFeatureFlag('autoResponse', config.features.autoResponse);
            if (autoResponseEnabled) {
                await this.handleAutoResponse(message, body);
            }

        } catch (error) {
            logger.error('Error in message handler:', error);
            console.error('[ERROR] Full error details:', error);
        }
    }

    /**
     * Handle command execution
     */
    async handleCommand(client, message, body) {
        const args = body.slice(config.prefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();

        if (!commandName) return;

        logger.info(`Executing command: ${commandName} with args: ${args.join(' ')}`);

        try {
            const executed = await commandHandler.execute(client, message, commandName, args);
            if (!executed) {
                logger.warn(`Command ${commandName} was not found or not executed`);
            }
        } catch (error) {
            logger.error(`Error executing command ${commandName}:`, error);
            console.error(error);
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

        const userId = helpers.getMessageActorId(message);
        if (!userId) {
            logger.warn('Unable to resolve actor for group filters');
            return;
        }
        const isAdmin = await helpers.isGroupAdmin(message);
        const isOwner = helpers.isOwner(userId);

        // Skip filters for admins and owners
        if (isAdmin || isOwner) return;

        // Anti-link filter
        const antiLinkFeatureEnabled = database.getFeatureFlag('antiLink', config.features.antiLink);
        if (antiLinkFeatureEnabled && group.anti_link === 1 && helpers.containsURL(body)) {
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
        const profanityFeatureEnabled = database.getFeatureFlag('profanityFilter', config.features.profanityFilter);
        if (profanityFeatureEnabled && group.profanity_filter === 1 && helpers.containsProfanity(body)) {
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

    async handleMuteEnforcement(client, message, contact) {
        if (!message.from.endsWith('@g.us')) {
            return false;
        }

        const userId = helpers.getMessageActorId(message);
        if (!userId) {
            logger.warn('Unable to resolve actor for mute enforcement');
            return false;
        }
        const groupId = message.from;
        const activeMute = database.getActiveMute(userId, groupId);

        if (!activeMute) {
            return false;
        }

        const isBotAdmin = await helpers.isBotGroupAdmin(message);
        if (isBotAdmin) {
            try {
                await message.delete(true);
            } catch (error) {
                logger.error('Error deleting message from muted user:', error);
            }
        } else {
            logger.warn('Bot lacks admin permissions to delete muted messages in group:', groupId);
        }

        const now = Date.now();
        const shouldNotify = !activeMute.last_notified_at || (now - activeMute.last_notified_at) > 60000;

        if (shouldNotify) {
            let targetContact = contact;
            if (!targetContact) {
                try {
                    targetContact = await client.getContactById(userId);
                } catch (error) {
                    logger.error('Failed to fetch contact for muted notification:', error);
                }
            }

            const remaining = activeMute.expires_at ? Math.max(activeMute.expires_at - now, 0) : null;
            const durationText = remaining ? helpers.formatDuration(remaining) : 'until further notice';
            const reason = activeMute.reason || 'No reason provided';
            const mentionText = targetContact?.number ? `@${targetContact.number}` : 'This user';
            const options = targetContact ? { mentions: [targetContact] } : undefined;

            await message.reply(
                `🚫 ${mentionText} is currently muted for ${durationText}.\nReason: ${reason}`,
                null,
                options
            );

            database.touchMuteNotification(activeMute.id);
        }

        return true;
    }
}

module.exports = new MessageHandler();
