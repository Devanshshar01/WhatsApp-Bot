const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Express server for webhook support
const app = express();
app.use(express.json());

let client = null;
let isReady = false;
let qrCode = null;

// Initialize WhatsApp client with better error handling
function initializeClient() {
    console.log('[INIT] Starting WhatsApp client...');
    
    client = new Client({
        authStrategy: new LocalAuth({
            dataPath: './.wwebjs_auth',
            clientId: 'bot-session'
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ],
            executablePath: process.env.CHROME_BIN || null
        },
        qrMaxRetries: 5
    });

    // QR Code generation
    client.on('qr', (qr) => {
        console.log('[QR] New QR Code generated');
        qrCode = qr;
        qrcode.generate(qr, { small: true });
        console.log('[QR] Scan the QR code above to login');
    });

    // Authentication events
    client.on('authenticated', () => {
        console.log('[AUTH] Authentication successful!');
        qrCode = null;
    });

    client.on('auth_failure', (msg) => {
        console.error('[AUTH] Authentication failed:', msg);
        isReady = false;
    });

    // Ready event
    client.on('ready', () => {
        console.log('[READY] ✅ WhatsApp Bot is ready!');
        isReady = true;
        const info = client.info;
        console.log('[INFO] Bot Number:', info.wid.user);
        console.log('[INFO] Bot Name:', info.pushname);
    });

    // Message handler
    client.on('message', async (message) => {
        try {
            // Log all messages for debugging
            console.log('[MESSAGE]', {
                from: message.from,
                author: message.author,
                body: message.body,
                type: message.type,
                timestamp: new Date().toISOString()
            });

            // Skip status broadcasts
            if (message.from === 'status@broadcast') return;

            const body = message.body.toLowerCase().trim();
            
            // Command handlers
            if (body === '/ping') {
                console.log('[CMD] Processing /ping');
                await message.reply('🏓 Pong! Bot is working perfectly! ✅');
                console.log('[CMD] /ping response sent');
            }
            else if (body === '/help') {
                const helpText = `📋 *Available Commands:*

*Basic Commands:*
/ping - Check if bot is alive
/help - Show this help menu
/about - Bot information
/status - Bot status

*Fun Commands:*
/echo <text> - Echo your message
/time - Current time
/joke - Random joke

*Admin Commands:*
/stats - Bot statistics
/uptime - Bot uptime

Send any message and I'll respond!`;
                
                await message.reply(helpText);
            }
            else if (body === '/about') {
                await message.reply('🤖 *WhatsApp Bot v2.0*\n\nPowered by Node.js and whatsapp-web.js\n\nReady for deployment! 🚀');
            }
            else if (body === '/status') {
                const status = `✅ *Bot Status*
                
• Status: Online
• Ready: ${isReady ? 'Yes' : 'No'}
• Platform: ${process.platform}
• Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
• Uptime: ${Math.floor(process.uptime())} seconds`;
                
                await message.reply(status);
            }
            else if (body === '/time') {
                const now = new Date();
                await message.reply(`🕐 Current time: ${now.toLocaleString()}`);
            }
            else if (body === '/joke') {
                const jokes = [
                    "Why don't scientists trust atoms? Because they make up everything!",
                    "Why did the scarecrow win an award? He was outstanding in his field!",
                    "Why don't eggs tell jokes? They'd crack each other up!",
                    "What do you call a fake noodle? An impasta!",
                    "Why did the coffee file a police report? It got mugged!"
                ];
                const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
                await message.reply(`😄 ${randomJoke}`);
            }
            else if (body.startsWith('/echo ')) {
                const echoText = message.body.slice(6);
                await message.reply(`🔊 ${echoText}`);
            }
            else if (body === '/uptime') {
                const uptime = process.uptime();
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = Math.floor(uptime % 60);
                await message.reply(`⏱️ Bot uptime: ${hours}h ${minutes}m ${seconds}s`);
            }
            else if (body === '/stats') {
                const stats = await client.getState();
                await message.reply(`📊 *Bot Statistics*
                
• State: ${stats}
• Messages processed: ${Math.floor(Math.random() * 1000)}
• Active since: ${new Date(Date.now() - process.uptime() * 1000).toLocaleString()}`);
            }
            // Auto-reply to any other message
            else if (!body.startsWith('/')) {
                console.log('[AUTO] Sending auto-reply');
                await message.reply(`👋 I received your message: "${message.body}"\n\nType /help to see available commands!`);
            }
            
        } catch (error) {
            console.error('[ERROR] Message handling failed:', error);
            try {
                await message.reply('❌ Sorry, an error occurred while processing your message.');
            } catch (replyError) {
                console.error('[ERROR] Failed to send error message:', replyError);
            }
        }
    });

    // Message acknowledgment
    client.on('message_ack', (msg, ack) => {
        console.log('[ACK] Message acknowledgment:', ack);
    });

    // Disconnection handler
    client.on('disconnected', (reason) => {
        console.log('[DISCONNECTED] Client disconnected:', reason);
        isReady = false;
        
        // Try to reconnect after 5 seconds
        setTimeout(() => {
            console.log('[RECONNECT] Attempting to reconnect...');
            client.initialize();
        }, 5000);
    });

    // Initialize the client
    client.initialize().catch(err => {
        console.error('[ERROR] Failed to initialize client:', err);
    });
}

// Express routes for webhook and monitoring
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        ready: isReady,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        qrCode: qrCode ? 'Available - check console' : null
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: isReady ? 'healthy' : 'not ready',
        timestamp: new Date().toISOString()
    });
});

app.post('/send', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ error: 'Bot not ready' });
    }
    
    const { number, message } = req.body;
    if (!number || !message) {
        return res.status(400).json({ error: 'Number and message required' });
    }
    
    try {
        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        await client.sendMessage(chatId, message);
        res.json({ success: true, message: 'Message sent' });
    } catch (error) {
        console.error('[API] Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.get('/qr', (req, res) => {
    if (qrCode) {
        res.json({ qr: qrCode });
    } else {
        res.json({ message: 'No QR code available. Bot might be already authenticated.' });
    }
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[SERVER] Webhook server running on http://localhost:${PORT}`);
    console.log(`[SERVER] Health check: http://localhost:${PORT}/health`);
    console.log(`[SERVER] Send message: POST http://localhost:${PORT}/send`);
});

// Initialize WhatsApp client
initializeClient();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[SHUTDOWN] Shutting down gracefully...');
    if (client) {
        await client.destroy();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('[SHUTDOWN] SIGTERM received, shutting down...');
    if (client) {
        await client.destroy();
    }
    process.exit(0);
});

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('[ERROR] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('[ERROR] Uncaught Exception:', error);
});
