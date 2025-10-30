const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');
const database = require('./database/database');
const messageHandler = require('./events/messageHandler');
const groupHandler = require('./events/groupHandler');

// Initialize directories
const initDirectories = () => {
    const dirs = [
        './database',
        './media/downloads',
        './media/temp',
        './media/stickers',
        './logs'
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            logger.info(`Created directory: ${dir}`);
        }
    });
};

// Initialize the WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        timeout: 60000,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    }
});

// QR Code Generation
client.on('qr', (qr) => {
    logger.info('QR Code received. Scan with WhatsApp:');
    qrcode.generate(qr, { small: true });
    logger.info('QR code generated. Please scan with your WhatsApp mobile app.');
});

// Authentication
client.on('authenticated', () => {
    logger.success('✅ Authentication successful!');
});

client.on('auth_failure', (msg) => {
    logger.error('❌ Authentication failed:', msg);
});

// Ready Event
client.on('ready', async () => {
    logger.success(`✅ ${config.botName} is ready!`);
    logger.info(`Bot Name: ${config.botName}`);
    logger.info(`Prefix: ${config.prefix}`);
    logger.info(`Owner Numbers: ${config.ownerNumbers.join(', ')}`);
    
    // Initialize database
    database.init();
    logger.success('Database initialized');
});

// Message Handler
client.on('message', async (message) => {
    try {
        await messageHandler.handle(client, message);
    } catch (error) {
        logger.error('Error handling message:', error);
    }
});

// Message Create (for bot's own messages)
client.on('message_create', async (message) => {
    if (config.enableMessageLogging && !message.fromMe) {
        logger.logMessage(message);
    }
});

// Group Join Event
client.on('group_join', async (notification) => {
    try {
        await groupHandler.handleJoin(client, notification);
    } catch (error) {
        logger.error('Error handling group join:', error);
    }
});

// Group Leave Event
client.on('group_leave', async (notification) => {
    try {
        await groupHandler.handleLeave(client, notification);
    } catch (error) {
        logger.error('Error handling group leave:', error);
    }
});

// Disconnection Handler
client.on('disconnected', (reason) => {
    logger.warn('⚠️ Client was disconnected:', reason);
    logger.info('Attempting to reconnect...');
});

// Loading Screen
client.on('loading_screen', (percent, message) => {
    logger.info(`Loading: ${percent}% - ${message}`);
});

// Error Handler
client.on('error', (error) => {
    logger.error('Client error:', error);
});

// Graceful Shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down gracefully...');
    await client.destroy();
    database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Shutting down gracefully...');
    await client.destroy();
    database.close();
    process.exit(0);
});

// Unhandled Rejection Handler
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize and Start
(async () => {
    try {
        logger.info('Starting WhatsApp Bot...');
        initDirectories();
        await client.initialize();
    } catch (error) {
        logger.error('Failed to initialize client:', error);
        process.exit(1);
    }
})();

// Export client for use in other modules
module.exports = client;
