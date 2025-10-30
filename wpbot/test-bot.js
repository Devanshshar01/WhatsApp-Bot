const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('[START] Initializing WhatsApp Bot...');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// QR Code
client.on('qr', (qr) => {
    console.log('[QR] Scan this code with WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Ready
client.on('ready', () => {
    console.log('[READY] Bot is ready!');
    console.log('[READY] Send any message to test');
});

// Message handler - RESPOND TO EVERYTHING
client.on('message', async (msg) => {
    console.log('[MESSAGE RECEIVED]', {
        from: msg.from,
        body: msg.body,
        timestamp: new Date().toISOString()
    });
    
    // Ignore status updates
    if (msg.from === 'status@broadcast') {
        console.log('[SKIP] Status broadcast ignored');
        return;
    }
    
    try {
        // Respond to /ping
        if (msg.body === '/ping') {
            console.log('[COMMAND] Ping detected, sending pong...');
            await msg.reply('🏓 Pong! Bot is working!');
            console.log('[SUCCESS] Pong sent!');
        }
        // Respond to /help
        else if (msg.body === '/help') {
            console.log('[COMMAND] Help detected');
            await msg.reply('Available commands:\n/ping - Check if bot is alive\n/help - Show this message\n/echo <text> - Echo your message');
        }
        // Echo command
        else if (msg.body.startsWith('/echo ')) {
            const echoText = msg.body.slice(6);
            console.log('[COMMAND] Echo:', echoText);
            await msg.reply(`Echo: ${echoText}`);
        }
        // Respond to ANY other message (for testing)
        else {
            console.log('[AUTO-REPLY] Sending auto response');
            await msg.reply('👋 Bot received your message: "' + msg.body + '"\n\nTry /ping or /help');
            console.log('[SUCCESS] Auto-reply sent!');
        }
    } catch (error) {
        console.error('[ERROR] Failed to send reply:', error);
    }
});

// Error handling
client.on('auth_failure', msg => {
    console.error('[AUTH FAILED]', msg);
});

client.on('disconnected', (reason) => {
    console.log('[DISCONNECTED]', reason);
});

// Initialize
console.log('[INIT] Starting client...');
client.initialize();
