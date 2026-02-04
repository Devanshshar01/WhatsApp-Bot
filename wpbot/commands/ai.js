const gemini = require('../utils/gemini');

module.exports = {
    name: 'ai',
    aliases: ['ask', 'chat', 'gpt', 'gemini'],
    description: 'Chat with AI assistant (powered by Google Gemini)',
    usage: '/ai <message> | /ai clear',
    category: 'fun',
    adminOnly: false,
    cooldown: 3000,

    async execute(client, message, args) {
        try {
            const userId = message.author || message.from;
            
            if (args.length === 0) {
                const helpText = `🤖 *AI Chat Assistant*\n\n` +
                    `Chat with an intelligent AI assistant!\n\n` +
                    `*Commands:*\n` +
                    `• \`/ai <message>\` - Chat with AI\n` +
                    `• \`/ai clear\` - Clear chat history\n\n` +
                    `*Examples:*\n` +
                    `• \`/ai What's the weather like today?\`\n` +
                    `• \`/ai Tell me a joke\`\n` +
                    `• \`/ai Explain quantum physics simply\`\n\n` +
                    `_Powered by Google Gemini AI_`;
                await message.reply(helpText);
                return;
            }

            // Check if AI is available
            if (!gemini.isAvailable()) {
                await message.reply('❌ AI chat is not configured. Please ask an admin to set up the Gemini API key.');
                return;
            }

            const action = args[0].toLowerCase();
            
            // Clear history command
            if (action === 'clear' || action === 'reset') {
                gemini.clearHistory(userId);
                await message.reply('🗑️ Your AI chat history has been cleared.\n\nStart fresh with `/ai <message>`');
                return;
            }
            
            // Get the user's prompt
            const prompt = args.join(' ');
            
            // Validate prompt length
            if (prompt.length > 2000) {
                await message.reply('❌ Message too long. Please keep it under 2000 characters.');
                return;
            }
            
            // Get user's name for personalization
            let userName = 'User';
            try {
                const contact = await message.getContact();
                userName = contact.pushname || contact.name || 'User';
            } catch (e) {
                // Keep default
            }
            
            // Show typing indicator
            const chat = await message.getChat();
            await chat.sendStateTyping();
            
            // Get AI response
            const response = await gemini.chat(userId, prompt, userName);
            
            // Format and send response
            await message.reply(`🤖 ${response}`);
            
        } catch (error) {
            console.error('Error in AI command:', error);
            
            // Send user-friendly error message
            if (error.message.includes('quota')) {
                await message.reply('⏳ AI rate limit reached. Please wait a moment and try again.');
            } else if (error.message.includes('cannot respond')) {
                await message.reply('🚫 I cannot respond to that message.');
            } else {
                await message.reply(`❌ ${error.message || 'Failed to get AI response. Please try again.'}`);
            }
        }
    }
};
