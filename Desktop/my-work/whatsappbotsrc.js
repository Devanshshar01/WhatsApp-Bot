// First install required packages:
// npm install whatsapp-web.js qrcode-terminal

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppTagBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: false, // Set to true for headless mode
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-extensions',
                    '--disable-dev-shm-usage'
                ]
            }
        });
        
        this.setupEventListeners();
        // Fixed: Store admin numbers as strings without the unary + operator
        this.adminNumbers = []; // Add admin phone numbers here (with country code, no +)
        this.commands = {
            '!tagall': 'Tag all members in the group',
            '!help': 'Show available commands',
            '!addadmin': 'Add a new admin (admin only)',
            '!removeadmin': 'Remove an admin (admin only)'
        };
        // Chunk size to avoid hitting WhatsApp limits
        this.MENTION_CHUNK_SIZE = 20;
    }

    setupEventListeners() {
        // Generate QR code for authentication
        this.client.on('qr', (qr) => {
            console.log('QR Code received, scan it with your phone:');
            qrcode.generate(qr, { small: true });
        });

        // Client ready
        this.client.on('ready', () => {
            console.log('WhatsApp Bot is ready!');
            console.log('Available commands:', this.commands);
        });

        // Handle incoming messages
        this.client.on('message', async (message) => {
            await this.handleMessage(message);
        });

        // Handle errors
        this.client.on('error', (error) => {
            console.error('Client error:', error);
        });

        // Handle authentication failure
        this.client.on('auth_failure', (msg) => {
            console.error('Authentication failed:', msg);
        });

        // Handle disconnection
        this.client.on('disconnected', (reason) => {
            console.log('Client was logged out:', reason);
        });
    }

    async handleMessage(message) {
        try {
            const chat = await message.getChat();
            const contact = await message.getContact();
            
            // Only respond to group messages
            if (!chat.isGroup) {
                return;
            }

            const messageBody = message.body.toLowerCase().trim();
            const senderNumber = contact.number;

            // Fixed: Parse commands to handle messages like "!tagall please"
            const command = messageBody.split(' ')[0];

            // Handle commands
            switch (command) {
                case '!tagall':
                    await this.tagAllMembers(chat, contact);
                    break;
                
                case '!help':
                    await this.showHelp(chat);
                    break;
                
                case '!addadmin':
                    await this.addAdmin(chat, message, senderNumber);
                    break;
                
                case '!removeadmin':
                    await this.removeAdmin(chat, message, senderNumber);
                    break;
                
                default:
                    // Check if message starts with bot command prefix
                    if (messageBody.startsWith('!')) {
                        await chat.sendMessage('Unknown command. Type !help to see available commands.');
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    async tagAllMembers(chat, requester) {
        try {
            // Check if requester is admin or group admin
            const isAuthorized = await this.isAuthorized(chat, requester);
            
            if (!isAuthorized) {
                await chat.sendMessage('❌ You are not authorized to use this command. Only group admins can tag all members.');
                return;
            }

            // Get all group participants
            const participants = chat.participants;
            
            if (participants.length === 0) {
                await chat.sendMessage('No members found in this group.');
                return;
            }

            // Fixed: Handle large groups by chunking mentions
            await this.sendMentionsInChunks(chat, participants);
            
            console.log(`Tagged ${participants.length} members in group: ${chat.name}`);
            
        } catch (error) {
            console.error('Error tagging members:', error);
            await chat.sendMessage('❌ Failed to tag members. Please try again.');
        }
    }

    // Fixed: New method to handle chunked mentions for large groups
    async sendMentionsInChunks(chat, participants) {
        const chunks = this.chunkArray(participants, this.MENTION_CHUNK_SIZE);
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            let mentions = [];
            let messageText = `📢 *Attention Everyone!* (${i + 1}/${chunks.length})\n\n`;
            
            for (let participant of chunk) {
                try {
                    // Fixed: Use participant ID directly for mentions
                    mentions.push(participant.id._serialized);
                    
                    // Get contact for display name/number
                    const contact = await this.client.getContactById(participant.id._serialized);
                    const displayName = contact.pushname || contact.name || contact.number;
                    messageText += `@${contact.number} `;
                } catch (contactError) {
                    console.warn(`Could not get contact for participant: ${participant.id._serialized}`, contactError);
                    // Skip this participant if we can't get their contact
                    continue;
                }
            }

            if (mentions.length > 0) {
                // Fixed: Pass mentions as array of contact IDs
                await chat.sendMessage(messageText, { mentions });
                
                // Add small delay between chunks to avoid rate limiting
                if (i < chunks.length - 1) {
                    await this.delay(1000);
                }
            }
        }
    }

    // Utility method to chunk arrays
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    // Utility method for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async showHelp(chat) {
        let helpText = '🤖 *WhatsApp Tag Bot Help*\n\n';
        helpText += '*Available Commands:*\n';
        
        for (const [command, description] of Object.entries(this.commands)) {
            helpText += `${command} - ${description}\n`;
        }
        
        helpText += '\n*Note:* Some commands require admin privileges.';
        
        await chat.sendMessage(helpText);
    }

    async addAdmin(chat, message, senderNumber) {
        if (!this.isMainAdmin(senderNumber)) {
            await chat.sendMessage('❌ Only main admins can add new admins.');
            return;
        }

        // Check if message has quoted/replied to another message
        if (!message.hasQuotedMsg) {
            await chat.sendMessage('❌ Please reply to a message from the user you want to make admin.');
            return;
        }

        try {
            const quotedMsg = await message.getQuotedMessage();
            const quotedContact = await quotedMsg.getContact();
            const newAdminNumber = quotedContact.number;

            // Fixed: Ensure consistent string comparison
            if (!this.adminNumbers.includes(newAdminNumber)) {
                this.adminNumbers.push(newAdminNumber);
                await chat.sendMessage(`✅ @${newAdminNumber} has been added as admin.`, {
                    mentions: [quotedContact.id._serialized]
                });
            } else {
                await chat.sendMessage('ℹ️ This user is already an admin.');
            }
        } catch (error) {
            console.error('Error adding admin:', error);
            await chat.sendMessage('❌ Failed to add admin. Please try again.');
        }
    }

    async removeAdmin(chat, message, senderNumber) {
        if (!this.isMainAdmin(senderNumber)) {
            await chat.sendMessage('❌ Only main admins can remove admins.');
            return;
        }

        if (!message.hasQuotedMsg) {
            await chat.sendMessage('❌ Please reply to a message from the admin you want to remove.');
            return;
        }

        try {
            const quotedMsg = await message.getQuotedMessage();
            const quotedContact = await quotedMsg.getContact();
            const adminToRemove = quotedContact.number;

            const index = this.adminNumbers.indexOf(adminToRemove);
            if (index > -1) {
                this.adminNumbers.splice(index, 1);
                await chat.sendMessage(`✅ @${adminToRemove} has been removed from admins.`, {
                    mentions: [quotedContact.id._serialized]
                });
            } else {
                await chat.sendMessage('ℹ️ This user is not an admin.');
            }
        } catch (error) {
            console.error('Error removing admin:', error);
            await chat.sendMessage('❌ Failed to remove admin. Please try again.');
        }
    }

    async isAuthorized(chat, contact) {
        // Check if user is in bot admin list
        if (this.adminNumbers.includes(contact.number)) {
            return true;
        }

        // Fixed: Safer check for group admin status with null/undefined handling
        for (let participant of chat.participants) {
            if (participant.id && contact.id && 
                participant.id._serialized === contact.id._serialized) {
                return participant.isAdmin || participant.isSuperAdmin;
            }
        }

        return false;
    }

    isMainAdmin(number) {
        // Fixed: Consistent string comparison
        return this.adminNumbers.includes(number);
    }

    start() {
        console.log('Starting WhatsApp Tag Bot...');
        this.client.initialize();
    }

    stop() {
        console.log('Stopping WhatsApp Tag Bot...');
        this.client.destroy();
    }
}

// Usage
const bot = new WhatsAppTagBot();

// Add your admin numbers here (without + sign, include country code)
// Example: bot.adminNumbers.push('1234567890', '0987654321');

// Start the bot
bot.start();

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nShutting down bot...');
    bot.stop();
    process.exit(0);
});

module.exports = WhatsAppTagBot;