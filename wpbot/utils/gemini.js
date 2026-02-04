const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const database = require('../database/database');

let genAI = null;
let model = null;

/**
 * Initialize the Gemini client
 */
function initialize() {
    const apiKey = config.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        console.log('⚠️ Gemini API key not configured. AI chat disabled.');
        return false;
    }
    
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7,
            }
        });
        console.log('✅ Gemini AI initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Gemini:', error.message);
        return false;
    }
}

/**
 * Check if Gemini is available
 */
function isAvailable() {
    return model !== null;
}

/**
 * Build conversation history for context
 */
function buildConversationContext(userId) {
    const history = database.getAiChatHistory(userId);
    if (!history || history.length === 0) return [];
    
    // Format for Gemini chat
    return history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));
}

/**
 * Chat with Gemini AI
 * @param {string} userId - User identifier for history
 * @param {string} prompt - User's message
 * @param {string} userName - User's display name for personalization
 * @returns {Promise<string>} AI response
 */
async function chat(userId, prompt, userName = 'User') {
    if (!isAvailable()) {
        throw new Error('AI is not configured. Ask an admin to set up the Gemini API key.');
    }
    
    try {
        // Build system instruction with bot personality
        const systemInstruction = `You are a helpful WhatsApp bot assistant. Your name is "Bot Assistant".
Key behaviors:
- Be concise since this is WhatsApp - keep responses under 500 characters when possible
- Be friendly and conversational
- Use emojis sparingly but appropriately
- If asked about your capabilities, you're a WhatsApp bot with various commands
- The user's name is ${userName}
- Don't use markdown headers (##), just plain text with occasional bold (*text*)
- If you don't know something, say so honestly`;

        // Get history for context
        const history = buildConversationContext(userId);
        
        // Create chat session
        const chat = model.startChat({
            history: history,
            systemInstruction: systemInstruction
        });
        
        // Send message and get response
        const result = await chat.sendMessage(prompt);
        const response = result.response.text();
        
        // Save to history
        database.addAiChatMessage(userId, 'user', prompt);
        database.addAiChatMessage(userId, 'assistant', response);
        
        return response;
        
    } catch (error) {
        console.error('Gemini chat error:', error);
        
        if (error.message?.includes('quota')) {
            throw new Error('AI quota exceeded. Please try again later.');
        }
        if (error.message?.includes('safety')) {
            throw new Error('I cannot respond to that message.');
        }
        if (error.message?.includes('API_KEY')) {
            throw new Error('Invalid API key configuration.');
        }
        
        throw new Error('AI service temporarily unavailable.');
    }
}

/**
 * Clear conversation history for a user
 */
function clearHistory(userId) {
    database.clearAiChatHistory(userId);
}

/**
 * Get a quick response without history (for one-off questions)
 */
async function quickChat(prompt) {
    if (!isAvailable()) {
        throw new Error('AI is not configured.');
    }
    
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Gemini quick chat error:', error);
        throw new Error('AI service temporarily unavailable.');
    }
}

module.exports = {
    initialize,
    isAvailable,
    chat,
    quickChat,
    clearHistory
};
