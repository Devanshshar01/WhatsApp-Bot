/**
 * Command Template
 * 
 * Copy this file to create new commands
 * Rename file to your command name (e.g., mycommand.js)
 * Fill in the properties and execute function
 */

module.exports = {
    // Command name (required)
    name: 'commandname',
    
    // Alternative names for the command (optional)
    aliases: ['alias1', 'alias2'],
    
    // Description shown in help menu (required)
    description: 'What this command does',
    
    // Usage example shown in help (required)
    usage: '/commandname <required> [optional]',
    
    // Cooldown in milliseconds (optional, default: 3000)
    cooldown: 5000,
    
    // Command category (optional)
    // Options: 'basic', 'media', 'group', 'admin', 'owner'
    category: 'basic',
    
    // Only works in groups (optional, default: false)
    groupOnly: false,
    
    // Only group admins can use (optional, default: false)
    adminOnly: false,
    
    // Only bot owners can use (optional, default: false)
    ownerOnly: false,
    
    /**
     * Execute the command
     * @param {Client} client - WhatsApp client instance
     * @param {Message} message - Message object
     * @param {Array} args - Command arguments (words after command)
     */
    async execute(client, message, args) {
        try {
            // Your command logic here
            
            // Example: Simple reply
            await message.reply('Hello from my command!');
            
            // Example: Check arguments
            if (args.length === 0) {
                await message.reply(`❌ Please provide arguments.\n\nUsage: ${this.usage}`);
                return;
            }
            
            // Example: Get user info
            const contact = await message.getContact();
            const userName = contact.pushname || contact.name;
            
            // Example: Check if in group
            if (message.from.endsWith('@g.us')) {
                const chat = await message.getChat();
                await message.reply(`This is a group: ${chat.name}`);
            }
            
            // Example: Reply with mention
            await message.reply(`Hello @${contact.number}!`, null, {
                mentions: [contact]
            });
            
            // Example: Get quoted message
            if (message.hasQuotedMsg) {
                const quotedMsg = await message.getQuotedMessage();
                await message.reply(`You replied to: ${quotedMsg.body}`);
            }
            
            // Example: Download media
            if (message.hasMedia) {
                const media = await message.downloadMedia();
                await message.reply(`Received ${media.mimetype}`);
            }
            
            // Example: Send message to chat
            const chat = await message.getChat();
            await chat.sendMessage('Message sent to chat');
            
            // Example: React to message (if supported)
            // await message.react('👍');
            
        } catch (error) {
            console.error('Error in command:', error);
            await message.reply('❌ An error occurred while executing this command.');
        }
    }
};

/**
 * USEFUL SNIPPETS
 * 
 * 1. Get user ID:
 *    const userId = message.author || message.from;
 * 
 * 2. Check if user is owner:
 *    const helpers = require('../utils/helpers');
 *    if (helpers.isOwner(userId)) { ... }
 * 
 * 3. Check if user is admin:
 *    const isAdmin = await helpers.isGroupAdmin(message);
 * 
 * 4. Get all group participants:
 *    const chat = await message.getChat();
 *    const participants = chat.participants;
 * 
 * 5. Send typing indicator:
 *    const chat = await message.getChat();
 *    await chat.sendStateTyping();
 * 
 * 6. Send media:
 *    const { MessageMedia } = require('whatsapp-web.js');
 *    const media = MessageMedia.fromFilePath('./path/to/file.jpg');
 *    await message.reply(media);
 * 
 * 7. Database operations:
 *    const database = require('../database/database');
 *    const user = database.getUser(userId);
 * 
 * 8. Log to console:
 *    const logger = require('../utils/logger');
 *    logger.info('Something happened');
 *    logger.error('Error occurred', error);
 * 
 * 9. Sleep/delay:
 *    const helpers = require('../utils/helpers');
 *    await helpers.sleep(1000); // 1 second
 * 
 * 10. Format duration:
 *     const helpers = require('../utils/helpers');
 *     const formatted = helpers.formatDuration(123456); // "2m 3s"
 */
