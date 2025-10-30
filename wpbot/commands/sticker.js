const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

module.exports = {
    name: 'sticker',
    aliases: ['s', 'stiker'],
    description: 'Convert image/video to sticker',
    usage: '/sticker (reply to image/video)',
    category: 'media',
    cooldown: 5000,
    
    async execute(client, message, args) {
        try {
            let media = null;

            // Check if replying to a message with media
            if (message.hasQuotedMsg) {
                const quotedMsg = await message.getQuotedMessage();
                
                if (quotedMsg.hasMedia) {
                    media = await quotedMsg.downloadMedia();
                }
            }
            // Check if current message has media
            else if (message.hasMedia) {
                media = await message.downloadMedia();
            }

            if (!media) {
                await message.reply('❌ Please reply to an image or video, or send one with the command.');
                return;
            }

            // Check media type
            if (!media.mimetype.startsWith('image/') && !media.mimetype.startsWith('video/')) {
                await message.reply('❌ Only images and videos can be converted to stickers.');
                return;
            }

            await message.reply('⏳ Creating sticker...');

            try {
                // For images, resize to sticker dimensions
                if (media.mimetype.startsWith('image/')) {
                    const buffer = Buffer.from(media.data, 'base64');
                    
                    // Resize image to 512x512 (WhatsApp sticker size)
                    const resizedBuffer = await sharp(buffer)
                        .resize(512, 512, {
                            fit: 'contain',
                            background: { r: 0, g: 0, b: 0, alpha: 0 }
                        })
                        .webp()
                        .toBuffer();

                    const stickerMedia = new MessageMedia('image/webp', resizedBuffer.toString('base64'));
                    await client.sendMessage(message.from, stickerMedia, { sendMediaAsSticker: true });
                }
                // For videos (short clips only)
                else if (media.mimetype.startsWith('video/')) {
                    // Send as animated sticker
                    await client.sendMessage(message.from, media, { sendMediaAsSticker: true });
                }

            } catch (error) {
                console.error('Error creating sticker:', error);
                await message.reply('❌ Failed to create sticker. Make sure the file is not too large.');
            }

        } catch (error) {
            console.error('Error in sticker command:', error);
            await message.reply('❌ An error occurred while creating sticker.');
        }
    }
};
