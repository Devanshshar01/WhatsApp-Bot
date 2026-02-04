const config = require('../config');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');
const cooldown = require('../utils/cooldown');
const database = require('../database/database');
const commandHandler = require('../utils/commandHandler');

// AFK notification cooldown (don't spam if someone keeps mentioning AFK user)
const afkNotificationCooldown = new Map(); // `${mentionedUser}_${chatId}` -> timestamp
const AFK_NOTIFY_COOLDOWN = 60000; // 1 minute

// Track muted user message queue for batch deletion
const mutedMessageQueue = new Map(); // groupId -> Map(userId -> { messages: [], timer: null })
const BATCH_DELETE_DELAY = 500; // ms to wait before batch deleting

class MessageHandler {
    /**
     * Handle incoming messages
     */
    async handle(client, message) {
        try {
            // Debug logging (gated behind DEBUG_MODE)
            if (config.debugMode) {
                console.log('[DEBUG] Message received:', {
                    from: message.from,
                    author: message.author,
                    body: message.body,
                    type: message.type,
                    isForwarded: message.isForwarded,
                    timestamp: new Date().toISOString()
                });
            }

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
            
            if (config.debugMode) {
                console.log('[DEBUG] Contact info:', {
                    userId,
                    userName,
                    userNumber
                });
            }

            database.createOrUpdateUser(userId, userName, userNumber);

            // Check if user is blocked
            if (database.isUserBlocked(userId)) {
                if (config.debugMode) console.log('[DEBUG] User is blocked:', userId);
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
            if (config.debugMode) {
                console.log('[DEBUG] Message body:', body);
                console.log('[DEBUG] Prefix check:', body.startsWith(config.prefix), 'Prefix:', config.prefix);
            }

            if (message.from.endsWith('@g.us')) {
                const muteHandled = await this.handleMuteEnforcement(client, message, contact);
                if (muteHandled) {
                    return;
                }
            }

            // AFK system: Remove AFK if user sends a message (non-command)
            if (!body.startsWith(config.prefix)) {
                const userAfk = database.getAfk(userId);
                if (userAfk) {
                    database.removeAfk(userId);
                    const afkDuration = helpers.formatDuration(Date.now() - userAfk.since);
                    await message.reply(`👋 Welcome back, ${userName}! You were AFK for ${afkDuration}.`);
                }
            }

            // Handle group-specific filters (but don't return if it's a command)
            if (message.from.endsWith('@g.us') && !body.startsWith(config.prefix)) {
                await this.handleGroupFilters(client, message, body);
            }

            // Check for commands
            if (body.startsWith(config.prefix)) {
                logger.info(`Command detected from ${userId}: ${body}`);
                if (config.debugMode) console.log('[DEBUG] Processing command:', body);
                await this.handleCommand(client, message, body);
                return;
            }

            // Auto-reply rules (custom triggers)
            const autoReplyHandled = await this.handleCustomAutoReply(message, body);
            if (autoReplyHandled) return;

            // AFK mentions: Check if any mentioned user is AFK
            await this.handleAfkMentions(message);

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
     * Handle custom auto-reply rules
     */
    async handleCustomAutoReply(message, body) {
        const chatId = message.from;
        const lowerBody = body.toLowerCase();
        
        // Get all applicable auto-replies (global + group-specific)
        const autoReplies = database.getAutoReplies(chatId);
        
        for (const rule of autoReplies) {
            if (!rule.enabled) continue;
            
            let matches = false;
            const trigger = rule.trigger.toLowerCase();
            
            switch (rule.matchType) {
                case 'exact':
                    matches = lowerBody === trigger;
                    break;
                case 'contains':
                    matches = lowerBody.includes(trigger);
                    break;
                case 'regex':
                    try {
                        const regex = new RegExp(rule.trigger, 'i');
                        matches = regex.test(body);
                    } catch (e) {
                        // Invalid regex, skip
                    }
                    break;
            }
            
            if (matches) {
                await message.reply(rule.response);
                return true;
            }
        }
        
        return false;
    }

    /**
     * Handle AFK mentions - notify when someone mentions an AFK user
     */
    async handleAfkMentions(message) {
        try {
            const mentionedContacts = await message.getMentions();
            if (!mentionedContacts || mentionedContacts.length === 0) return;
            
            const chatId = message.from;
            
            for (const contact of mentionedContacts) {
                const mentionedUserId = contact.id._serialized;
                const afkData = database.getAfk(mentionedUserId);
                
                if (afkData) {
                    // Check cooldown to avoid spam
                    const cooldownKey = `${mentionedUserId}_${chatId}`;
                    const lastNotified = afkNotificationCooldown.get(cooldownKey);
                    
                    if (lastNotified && (Date.now() - lastNotified) < AFK_NOTIFY_COOLDOWN) {
                        continue; // Skip, recently notified
                    }
                    
                    afkNotificationCooldown.set(cooldownKey, Date.now());
                    
                    const userName = contact.pushname || contact.name || 'This user';
                    const afkDuration = helpers.formatDuration(Date.now() - afkData.since);
                    const reason = afkData.reason || 'No reason specified';
                    
                    await message.reply(`💤 *${userName}* is currently AFK\n⏱️ Duration: ${afkDuration}\n📝 Reason: ${reason}`);
                }
            }
        } catch (error) {
            logger.error('Error handling AFK mentions:', error);
        }
    }

    /**
     * Handle command execution
     */
    async handleCommand(client, message, body) {
        let args = body.slice(config.prefix.length).trim().split(/\s+/);
        let commandName = args.shift().toLowerCase();

        if (!commandName) return;

        // Check for command alias
        const userId = helpers.getMessageActorId(message);
        if (userId) {
            const alias = database.getAlias(userId, commandName);
            if (alias) {
                // Parse the aliased command
                const aliasedParts = alias.command.split(/\s+/);
                commandName = aliasedParts.shift().toLowerCase();
                // Prepend aliased args, then append original args
                args = [...aliasedParts, ...args];
                logger.info(`Alias resolved: ${alias.shortcut} -> ${alias.command}`);
            }
        }

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
            // Use batch deletion to handle spam better
            await this.queueMessageForDeletion(groupId, userId, message);
        } else {
            logger.warn('Bot lacks admin permissions to delete muted messages in group:', groupId);
        }

        // Notification with 60-second cooldown
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

    /**
     * Queue muted user messages for batch deletion to handle spam efficiently
     */
    async queueMessageForDeletion(groupId, userId, message) {
        if (!mutedMessageQueue.has(groupId)) {
            mutedMessageQueue.set(groupId, new Map());
        }
        
        const groupQueue = mutedMessageQueue.get(groupId);
        
        if (!groupQueue.has(userId)) {
            groupQueue.set(userId, { messages: [], timer: null });
        }
        
        const userQueue = groupQueue.get(userId);
        userQueue.messages.push(message);
        
        // Clear existing timer and set new one
        if (userQueue.timer) {
            clearTimeout(userQueue.timer);
        }
        
        // Batch delete after short delay (catches rapid spam)
        userQueue.timer = setTimeout(async () => {
            const messagesToDelete = [...userQueue.messages];
            userQueue.messages = [];
            userQueue.timer = null;
            
            // Delete all queued messages in parallel
            const deletePromises = messagesToDelete.map(async (msg) => {
                try {
                    await msg.delete(true);
                } catch (error) {
                    // Message may already be deleted or too old
                    if (!error.message?.includes('not found')) {
                        logger.error('Error deleting muted message:', error.message);
                    }
                }
            });
            
            await Promise.allSettled(deletePromises);
            
            if (messagesToDelete.length > 1) {
                logger.info(`Batch deleted ${messagesToDelete.length} messages from muted user ${userId} in ${groupId}`);
            }
        }, BATCH_DELETE_DELAY);
    }
}

module.exports = new MessageHandler();
