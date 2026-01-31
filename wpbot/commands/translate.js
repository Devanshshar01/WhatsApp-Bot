const axios = require('axios');

module.exports = {
    name: 'translate',
    aliases: ['tr', 'trans'],
    description: 'Translate text to another language',
    usage: '/translate <language> <text>',
    category: 'utility',
    cooldown: 3000,
    
    async execute(client, message, args) {
        try {
            if (args.length < 2) {
                const helpText = `📖 *Translate Command*\n\n` +
                    `*Usage:* /translate <language> <text>\n\n` +
                    `*Examples:*\n` +
                    `• /translate es Hello world\n` +
                    `• /translate hi How are you?\n` +
                    `• /translate fr Good morning\n\n` +
                    `*Language Codes:*\n` +
                    `• en - English\n` +
                    `• es - Spanish\n` +
                    `• fr - French\n` +
                    `• de - German\n` +
                    `• it - Italian\n` +
                    `• pt - Portuguese\n` +
                    `• hi - Hindi\n` +
                    `• ja - Japanese\n` +
                    `• ko - Korean\n` +
                    `• zh - Chinese\n` +
                    `• ar - Arabic\n` +
                    `• ru - Russian`;
                await message.reply(helpText);
                return;
            }

            const targetLang = args[0].toLowerCase();
            const textToTranslate = args.slice(1).join(' ');

            // Validate input length
            if (textToTranslate.length > 2000) {
                await message.reply('❌ Text too long. Maximum 2000 characters for translation.');
                return;
            }

            // Using Google Translate API (free tier)
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
            
            const response = await axios.get(url);
            const translation = response.data[0][0][0];
            const sourceLang = response.data[2] || 'auto';

            let replyText = `🌐 *Translation*\n\n`;
            replyText += `*Original (${sourceLang}):*\n${textToTranslate}\n\n`;
            replyText += `*Translated (${targetLang}):*\n${translation}`;

            await message.reply(replyText);

        } catch (error) {
            console.error('Error in translate command:', error);
            if (error.response && error.response.status === 400) {
                await message.reply('❌ Invalid language code. Use /translate for supported languages.');
            } else {
                await message.reply('❌ Translation failed. Please try again later.');
            }
        }
    }
};
