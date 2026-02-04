const database = require('../database/database');
const helpers = require('../utils/helpers');

module.exports = {
    name: 'autoreply',
    aliases: ['ar', 'trigger'],
    description: 'Set up automatic reply triggers',
    usage: '/autoreply add "trigger" -> "response" | /autoreply list | /autoreply delete <id>',
    category: 'automation',
    adminOnly: true,
    cooldown: 3000,

    async execute(client, message, args) {
        try {
            const userId = message.author || message.from;
            const chatId = message.from;
            const isGroup = chatId.endsWith('@g.us');
            
            if (args.length === 0) {
                const helpText = `💬 *Auto-Reply Rules*\n\n` +
                    `Create automatic responses to trigger words!\n\n` +
                    `*Commands:*\n` +
                    `• \`/autoreply add "trigger" -> "response"\`\n` +
                    `• \`/autoreply list\` - Show all rules\n` +
                    `• \`/autoreply delete <id>\` - Remove rule\n` +
                    `• \`/autoreply toggle <id>\` - Enable/disable\n\n` +
                    `*Match Types:*\n` +
                    `• \`/autoreply add exact "hello" -> "Hi there!"\`\n` +
                    `• \`/autoreply add contains "price" -> "Check our website"\`\n\n` +
                    `*Examples:*\n` +
                    `\`/autoreply add "price" -> "Please check our price list at example.com"\``;
                await message.reply(helpText);
                return;
            }

            const action = args[0].toLowerCase();

            if (action === 'add') {
                // Parse: /autoreply add [matchType] "trigger" -> "response"
                const fullText = args.slice(1).join(' ');
                
                // Check for match type
                let matchType = 'contains';
                let parseText = fullText;
                
                if (fullText.startsWith('exact ')) {
                    matchType = 'exact';
                    parseText = fullText.slice(6);
                } else if (fullText.startsWith('contains ')) {
                    matchType = 'contains';
                    parseText = fullText.slice(9);
                } else if (fullText.startsWith('regex ')) {
                    matchType = 'regex';
                    parseText = fullText.slice(6);
                }
                
                // Parse trigger and response
                const arrowMatch = parseText.match(/^["'](.+?)["']\s*->\s*["'](.+?)["']$/s);
                
                if (!arrowMatch) {
                    await message.reply('❌ Invalid format.\n\nUse: `/autoreply add "trigger" -> "response"`\n\nExample: `/autoreply add "hello" -> "Hi there!"`');
                    return;
                }
                
                const trigger = arrowMatch[1];
                const response = arrowMatch[2];
                
                // Validate lengths
                if (trigger.length > 100) {
                    await message.reply('❌ Trigger too long. Maximum 100 characters.');
                    return;
                }
                
                if (response.length > 1000) {
                    await message.reply('❌ Response too long. Maximum 1000 characters.');
                    return;
                }
                
                // Validate regex if applicable
                if (matchType === 'regex') {
                    try {
                        new RegExp(trigger);
                    } catch (e) {
                        await message.reply('❌ Invalid regex pattern.');
                        return;
                    }
                }
                
                const rule = database.addAutoReply(trigger, response, {
                    matchType,
                    chatId: isGroup ? chatId : null,
                    createdBy: userId
                });

                let confirmMsg = `✅ *Auto-Reply Created!*\n\n`;
                confirmMsg += `🆔 *ID:* ${rule.id}\n`;
                confirmMsg += `🎯 *Trigger:* "${trigger}"\n`;
                confirmMsg += `💬 *Response:* "${response.substring(0, 50)}${response.length > 50 ? '...' : ''}"\n`;
                confirmMsg += `📋 *Match Type:* ${matchType}\n`;
                confirmMsg += `📍 *Scope:* ${isGroup ? 'This group only' : 'Global'}`;
                
                await message.reply(confirmMsg);
            }
            else if (action === 'list') {
                const rules = database.getAllAutoReplies();
                const relevantRules = rules.filter(r => r.chatId === null || r.chatId === chatId);
                
                if (relevantRules.length === 0) {
                    await message.reply('📭 No auto-reply rules set.\n\nUse `/autoreply add "trigger" -> "response"` to create one!');
                    return;
                }

                let response = `💬 *Auto-Reply Rules* (${relevantRules.length})\n\n`;
                relevantRules.forEach((r, i) => {
                    const status = r.enabled ? '✅' : '❌';
                    const scope = r.chatId ? '📍' : '🌐';
                    response += `${status} *${r.id}.* "${r.trigger}" → "${r.response.substring(0, 30)}${r.response.length > 30 ? '...' : ''}"\n`;
                    response += `   ${scope} ${r.matchType} | ${r.chatId ? 'Group only' : 'Global'}\n\n`;
                });
                
                await message.reply(response);
            }
            else if (action === 'delete' || action === 'remove') {
                if (args.length < 2) {
                    await message.reply('❌ Usage: `/autoreply delete <id>`');
                    return;
                }

                const id = parseInt(args[1]);
                if (isNaN(id)) {
                    await message.reply('❌ Please provide a valid rule ID number.');
                    return;
                }
                
                const deleted = database.deleteAutoReply(id);
                
                if (deleted) {
                    await message.reply(`✅ Auto-reply rule #${id} has been deleted.`);
                } else {
                    await message.reply(`❌ Rule #${id} not found.`);
                }
            }
            else if (action === 'toggle') {
                if (args.length < 2) {
                    await message.reply('❌ Usage: `/autoreply toggle <id>`');
                    return;
                }

                const id = parseInt(args[1]);
                if (isNaN(id)) {
                    await message.reply('❌ Please provide a valid rule ID number.');
                    return;
                }
                
                const rule = database.toggleAutoReply(id);
                
                if (rule) {
                    const status = rule.enabled ? 'enabled' : 'disabled';
                    await message.reply(`✅ Auto-reply rule #${id} is now ${status}.`);
                } else {
                    await message.reply(`❌ Rule #${id} not found.`);
                }
            }
            else {
                await message.reply('❌ Unknown action. Use `/autoreply` for help.');
            }
            
        } catch (error) {
            console.error('Error in autoreply command:', error);
            await message.reply('❌ An error occurred while managing auto-replies.');
        }
    }
};
