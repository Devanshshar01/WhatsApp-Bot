const axios = require('axios');
const MessageMedia = require('whatsapp-web.js').MessageMedia;

module.exports = {
    name: 'qrcode',
    aliases: ['qr', 'generateqr'],
    description: 'Generate QR code for text or URL',
    usage: '/qrcode <text/url>',
    category: 'utility',
    cooldown: 5000,
    
    async execute(client, message, args) {
        try {
            if (args.length === 0) {
                const helpText = `📱 *QR Code Generator*\n\n` +
                    `*Usage:* /qrcode <text/url>\n\n` +
                    `*Examples:*\n` +
                    `• /qrcode https://google.com\n` +
                    `• /qrcode Hello World\n` +
                    `• /qrcode +919876543210\n` +
                    `• /qrcode WIFI:T:WPA;S:NetworkName;P:Password;;\n\n` +
                    `*Tips:*\n` +
                    `• URLs will be clickable when scanned\n` +
                    `• Phone numbers format: +CountryCode Number\n` +
                    `• WiFi format: WIFI:T:WPA;S:YourSSID;P:YourPassword;;`;
                await message.reply(helpText);
                return;
            }

            const text = args.join(' ');
            
            // Limit text length
            if (text.length > 1000) {
                await message.reply('❌ Text too long! Maximum 1000 characters for QR code.');
                return;
            }

            await message.reply('⏳ Generating QR code...');

            // Using QR Server API (free, no key required)
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
            
            // Fetch QR code image
            const response = await axios.get(qrApiUrl, {
                responseType: 'arraybuffer'
            });
            
            // Convert to base64
            const base64Image = Buffer.from(response.data).toString('base64');
            
            // Create MessageMedia
            const media = new MessageMedia('image/png', base64Image, 'qrcode.png');
            
            // Prepare caption
            let caption = `📱 *QR Code Generated!*\n\n`;
            
            // Detect content type and add relevant info
            if (text.startsWith('http://') || text.startsWith('https://')) {
                caption += `🔗 *Type:* URL\n`;
                caption += `📝 *Content:* ${text}\n\n`;
                caption += `_Scan to open the link_`;
            } else if (text.startsWith('+') && /^\+\d+$/.test(text)) {
                caption += `📞 *Type:* Phone Number\n`;
                caption += `📝 *Content:* ${text}\n\n`;
                caption += `_Scan to save contact or call_`;
            } else if (text.startsWith('WIFI:')) {
                caption += `📶 *Type:* WiFi Credentials\n\n`;
                caption += `_Scan to connect to WiFi_`;
            } else if (text.includes('@') && text.includes('.')) {
                caption += `📧 *Type:* Email Address\n`;
                caption += `📝 *Content:* ${text}\n\n`;
                caption += `_Scan to send email_`;
            } else {
                caption += `📝 *Type:* Text\n`;
                if (text.length > 50) {
                    caption += `📝 *Content:* ${text.substring(0, 50)}...\n\n`;
                } else {
                    caption += `📝 *Content:* ${text}\n\n`;
                }
                caption += `_Scan to view text_`;
            }
            
            // Send QR code image
            await client.sendMessage(message.from, media, {
                caption: caption
            });

        } catch (error) {
            console.error('Error in qrcode command:', error);
            await message.reply('❌ Failed to generate QR code. Please try again.');
        }
    }
};
