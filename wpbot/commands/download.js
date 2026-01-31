const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

module.exports = {
    name: 'download',
    aliases: ['dl', 'save'],
    description: 'Download media from message',
    usage: '/download (reply to media)',
    category: 'media',
    cooldown: 5000,
    
    async execute(client, message, args) {
        try {
            let media = null;
            let filename = null;

            // Check if replying to a message with media
            if (message.hasQuotedMsg) {
                const quotedMsg = await message.getQuotedMessage();
                
                if (quotedMsg.hasMedia) {
                    media = await quotedMsg.downloadMedia();
                    
                    // Generate filename based on media type
                    const ext = media.mimetype.split('/')[1].split(';')[0];
                    filename = `media_${Date.now()}.${ext}`;
                }
            }
            // Check if current message has media
            else if (message.hasMedia) {
                media = await message.downloadMedia();
                const ext = media.mimetype.split('/')[1].split(';')[0];
                filename = `media_${Date.now()}.${ext}`;
            }

            if (!media) {
                await message.reply('❌ Please reply to a message with media (image, video, audio, or document).');
                return;
            }

            // Check file size
            const buffer = Buffer.from(media.data, 'base64');
            if (buffer.length > config.maxMediaSize) {
                await message.reply('❌ File is too large to download (max 16MB).');
                return;
            }

            // Save to downloads folder
            const downloadPath = path.join(config.mediaFolder, 'downloads', filename);
            await fs.ensureDir(path.dirname(downloadPath));
            await fs.writeFile(downloadPath, buffer);

            // Get file size in MB
            const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);

            let response = `✅ *Media Downloaded Successfully!*\n\n`;
            response += `📁 *Filename:* ${filename}\n`;
            response += `📊 *Size:* ${fileSizeMB} MB\n`;
            response += `🎯 *Type:* ${media.mimetype}`;

            await message.reply(response);

            // Send the media back to the user as a document
            const MessageMedia = require('whatsapp-web.js').MessageMedia;
            const downloadedMedia = new MessageMedia(media.mimetype, media.data, filename);
            await client.sendMessage(message.from, downloadedMedia, {
                caption: `📥 Downloaded: ${filename}`
            });

        } catch (error) {
            console.error('Error in download command:', error);
            await message.reply('❌ An error occurred while downloading media.');
        }
    }
};
