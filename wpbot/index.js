const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const config = require('./config');
const logger = require('./utils/logger');
const database = require('./database/database');
const messageHandler = require('./events/messageHandler');
const groupHandler = require('./events/groupHandler');
const commandHandler = require('./utils/commandHandler');
const startAdminServer = require('./admin/server');

const runtimeState = {
    isReady: false,
    qrCode: null,
    readyAt: null,
    startTime: Date.now()
};

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

async function syncContactsAndGroups() {
    try {
        logger.info('Syncing contacts and groups for admin panel...');

        const contacts = await client.getContacts();
        let syncedUsers = 0;

        for (const contact of contacts) {
            if (!contact || contact.isGroup) {
                continue;
            }

            const id = contact.id?._serialized;
            const server = contact.id?.server;

            if (!id || server !== 'c.us') {
                continue;
            }

            const name = contact.pushname || contact.name || contact.number || 'Unknown';
            const phone = contact.number || contact.id?.user || null;

            database.createOrUpdateUser(id, name, phone, { skipStats: true });
            syncedUsers += 1;
        }

        const chats = await client.getChats();
        let syncedGroups = 0;

        for (const chat of chats) {
            const groupId = chat?.id?._serialized;
            if (!groupId) {
                continue;
            }

            const isGroupChat = Boolean(
                chat.isGroup ||
                chat.isAnnouncement ||
                chat.isCommunity ||
                groupId.endsWith('@g.us')
            );

            if (!isGroupChat) {
                continue;
            }

            let description = chat.groupMetadata?.desc || chat.description || '';
            if (!description && typeof chat.fetchGroupMetadata === 'function') {
                try {
                    const metadata = await chat.fetchGroupMetadata();
                    description = metadata?.desc || description;
                } catch (fetchError) {
                    logger.debug?.('Failed to fetch group metadata for sync', {
                        groupId,
                        error: fetchError?.message
                    });
                }
            }

            const groupName = chat.name || chat.formattedTitle || 'Unnamed group';
            database.createOrUpdateGroup(groupId, groupName, description);
            syncedGroups += 1;
        }

        logger.info(`Synced ${syncedUsers} users and ${syncedGroups} groups.`);
    } catch (error) {
        logger.error('Failed to sync contacts and groups:', error);
    }
}

// QR Code Generation
client.on('qr', (qr) => {
    logger.info('QR Code received. Scan with WhatsApp:');
    qrcode.generate(qr, { small: true });
    logger.info('QR code generated. Please scan with your WhatsApp mobile app.');
    runtimeState.qrCode = qr;
});

// Authentication
client.on('authenticated', () => {
    logger.success('✅ Authentication successful!');
    runtimeState.qrCode = null;
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

    runtimeState.isReady = true;
    runtimeState.readyAt = Date.now();
    runtimeState.qrCode = null;

    await syncContactsAndGroups();
});

// Message Handler
client.on('message', async (message) => {
    try {
        console.log('[MAIN] New message event triggered');
        console.log('[MAIN] Message details:', {
            from: message.from,
            body: message.body,
            hasMedia: message.hasMedia,
            type: message.type
        });
        
        // Store client reference in message for easier access
        message.client = message.client || client;
        await messageHandler.handle(client, message);
    } catch (error) {
        logger.error('Error handling message:', error);
        console.error('[MAIN ERROR]', error);
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
    runtimeState.isReady = false;
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
        database.init();

        startAdminServer({
            config,
            database,
            logger,
            commandHandler,
            runtime: {
                getIsReady: () => runtimeState.isReady,
                getQrCode: () => runtimeState.qrCode,
                getClientInfo: () => client.info || null,
                getReadyAt: () => runtimeState.readyAt,
                getStartTime: () => runtimeState.startTime
            },
            getClient: () => client
        });

        await client.initialize();
    } catch (error) {
        logger.error('Failed to initialize client:', error);
        process.exit(1);
    }
})();

// Export client for use in other modules
module.exports = client;
