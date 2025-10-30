const axios = require('axios');

module.exports = {
    name: 'shorturl',
    aliases: ['short', 'shorten', 'tinyurl'],
    description: 'Shorten a long URL',
    usage: '/shorturl <url>',
    category: 'utility',
    cooldown: 3000,
    
    async execute(client, message, args) {
        try {
            if (args.length === 0) {
                await message.reply('❌ Please provide a URL to shorten\n\n*Usage:* /shorturl https://example.com/very/long/url');
                return;
            }

            let url = args[0];
            
            // Add protocol if missing
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            
            // Validate URL format
            try {
                new URL(url);
            } catch (e) {
                await message.reply('❌ Invalid URL format. Please provide a valid URL.');
                return;
            }

            // Using TinyURL API (free, no key required)
            const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
            
            const response = await axios.get(apiUrl);
            const shortUrl = response.data;
            
            // Alternative: Using is.gd service
            // const apiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`;
            
            let replyText = `🔗 *URL Shortened!*\n\n`;
            replyText += `*Original URL:*\n${url}\n\n`;
            replyText += `*Short URL:*\n${shortUrl}\n\n`;
            replyText += `📊 *Saved:* ${Math.max(0, url.length - shortUrl.length)} characters`;
            
            // Add QR code option
            replyText += `\n\n💡 _Tip: You can create a QR code for this URL with /qrcode ${shortUrl}_`;

            await message.reply(replyText);

        } catch (error) {
            console.error('Error in shorturl command:', error);
            await message.reply('❌ Unable to shorten URL. Please try again later.');
        }
    }
};
