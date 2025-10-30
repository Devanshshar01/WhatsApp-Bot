const config = require('../config');
const logger = require('../utils/logger');
const database = require('../database/database');

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
