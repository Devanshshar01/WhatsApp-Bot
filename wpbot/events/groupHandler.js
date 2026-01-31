const config = require('../config');
const logger = require('../utils/logger');
const database = require('../database/database');
const helpers = require('../utils/helpers');

class GroupHandler {
    /**
     * Handle user joining group
     */
    async handleJoin(client, notification) {
        try {
            const chat = await notification.getChat();
            const groupId = notification.chatId;
            
            // Ensure group exists in database
            database.createOrUpdateGroup(groupId, chat.name, chat.description || '');
            
            // Check for mute evasion (user rejoining while muted)
            for (const userId of notification.recipientIds) {
                const activeMute = database.getActiveMute(userId, groupId);
                if (activeMute) {
                    logger.warn(`[MUTE EVASION] User ${userId} rejoined group ${groupId} while muted`);
                    
                    // Notify admins about mute evasion
                    try {
                        const contact = await client.getContactById(userId);
                        const remaining = activeMute.expires_at ? Math.max(activeMute.expires_at - Date.now(), 0) : null;
                        const durationText = remaining ? helpers.formatDuration(remaining) : 'permanently';
                        
                        await chat.sendMessage(
                            `⚠️ *Mute Evasion Detected*\n\n` +
                            `@${contact.number} rejoined while still muted (${durationText} remaining).\n` +
                            `Their messages will continue to be deleted.`,
                            { mentions: [contact] }
                        );
                    } catch (notifyError) {
                        logger.error('Error notifying about mute evasion:', notifyError.message);
                    }
                    continue; // Skip welcome message for muted users
                }
            }
            
            if (!config.groupAutomations?.welcomeMessages) {
                return;
            }
            
            const group = database.getGroup(groupId);
            
            if (!group || group.welcome_enabled !== 1) {
                return;
            }

            // Get custom welcome message or use default
            const groupSettings = database.getGroupSettings(groupId);
            let welcomeMsg = groupSettings?.welcome_message || config.welcomeMessage;

            // Get user info
            for (const userId of notification.recipientIds) {
                try {
                    const contact = await client.getContactById(userId);
                    const userName = contact.pushname || contact.name || contact.number;
                    
                    // Replace placeholders
                    const message = welcomeMsg
                        .replace('@user', `@${contact.number}`)
                        .replace('{user}', userName)
                        .replace('{group}', chat.name);

                    // Send welcome message with mention
                    await chat.sendMessage(message, {
                        mentions: [contact]
                    });

                    logger.info(`Sent welcome message to ${userName} in ${chat.name}`);
                } catch (error) {
                    logger.error('Error sending welcome message:', error);
                }
            }
        } catch (error) {
            logger.error('Error in group join handler:', error);
        }
    }

    /**
     * Handle user leaving group
     */
    async handleLeave(client, notification) {
        try {
            if (!config.groupAutomations?.goodbyeMessages) {
                return;
            }

            const chat = await notification.getChat();
            const groupId = notification.chatId;
            
            const group = database.getGroup(groupId);
            
            if (!group || group.goodbye_enabled !== 1) {
                return;
            }

            // Get custom goodbye message or use default
            const groupSettings = database.getGroupSettings(groupId);
            let goodbyeMsg = groupSettings?.goodbye_message || config.goodbyeMessage;

            // Get user info
            for (const userId of notification.recipientIds) {
                try {
                    const contact = await client.getContactById(userId);
                    const userName = contact.pushname || contact.name || contact.number;
                    
                    // Replace placeholders
                    const message = goodbyeMsg
                        .replace('@user', userName)
                        .replace('{user}', userName)
                        .replace('{group}', chat.name);

                    await chat.sendMessage(message);

                    logger.info(`Sent goodbye message for ${userName} in ${chat.name}`);
                } catch (error) {
                    logger.error('Error sending goodbye message:', error);
                }
            }
        } catch (error) {
            logger.error('Error in group leave handler:', error);
        }
    }
}

module.exports = new GroupHandler();
