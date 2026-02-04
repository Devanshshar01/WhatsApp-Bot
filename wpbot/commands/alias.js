const database = require('../database/database');
const config = require('../config');

module.exports = {
    name: 'alias',
    aliases: ['shortcut'],
    description: 'Create custom command shortcuts',
    usage: '/alias add <shortcut> <command> | /alias list | /alias delete <shortcut>',
    category: 'utility',
    cooldown: 3000,

    async execute(client, message, args) {
        try {
            const userId = message.author || message.from;
            
            if (args.length === 0) {
                const helpText = `🔗 *Command Aliases*\n\n` +
                    `Create shortcuts for your favorite commands!\n\n` +
                    `*Usage:*\n` +
                    `• \`/alias add <short> <command>\` - Create alias\n` +
                    `• \`/alias list\` - Show all aliases\n` +
                    `• \`/alias delete <short>\` - Remove alias\n\n` +
                    `*Examples:*\n` +
                    `• \`/alias add w weather London\`\n` +
                    `  Now \`/w\` = \`/weather London\`\n\n` +
                    `• \`/alias add gm tagall Good morning!\`\n` +
                    `  Now \`/gm\` = \`/tagall Good morning!\``;
                await message.reply(helpText);
                return;
            }

            const action = args[0].toLowerCase();

            if (action === 'add') {
                if (args.length < 3) {
                    await message.reply('❌ Usage: `/alias add <shortcut> <command>`\n\nExample: `/alias add w weather London`');
                    return;
                }

                const shortcut = args[1].toLowerCase();
                const command = args.slice(2).join(' ');
                
                // Validate shortcut
                if (shortcut.length > 20) {
                    await message.reply('❌ Shortcut too long. Maximum 20 characters.');
                    return;
                }
                
                if (!/^[a-z0-9]+$/i.test(shortcut)) {
                    await message.reply('❌ Shortcut can only contain letters and numbers.');
                    return;
                }
                
                // Check if shortcut conflicts with existing commands
                const commandHandler = require('../utils/commandHandler');
                if (commandHandler.commands.has(shortcut) || commandHandler.aliases.has(shortcut)) {
                    await message.reply('❌ This shortcut conflicts with an existing command.');
                    return;
                }
                
                // Validate command length
                if (command.length > 500) {
                    await message.reply('❌ Command too long. Maximum 500 characters.');
                    return;
                }

                const aliasRecord = database.addAlias(shortcut, command, userId);
                
                if (!aliasRecord) {
                    await message.reply('❌ This alias already exists. Delete it first with `/alias delete ' + shortcut + '`');
                    return;
                }

                await message.reply(`✅ *Alias Created!*\n\n🔗 \`${config.prefix}${shortcut}\` → \`${config.prefix}${command}\``);
            }
            else if (action === 'list') {
                const aliases = database.getAllAliases();
                
                if (aliases.length === 0) {
                    await message.reply('📭 No aliases created yet.\n\nUse `/alias add <short> <command>` to create one!');
                    return;
                }

                let response = `🔗 *Command Aliases* (${aliases.length})\n\n`;
                aliases.forEach((a, i) => {
                    response += `${i + 1}. \`${config.prefix}${a.alias}\` → \`${config.prefix}${a.command}\`\n`;
                });
                
                await message.reply(response);
            }
            else if (action === 'delete' || action === 'remove') {
                if (args.length < 2) {
                    await message.reply('❌ Usage: `/alias delete <shortcut>`');
                    return;
                }

                const shortcut = args[1].toLowerCase();
                const deleted = database.deleteAlias(shortcut);
                
                if (deleted) {
                    await message.reply(`✅ Alias \`${config.prefix}${shortcut}\` has been deleted.`);
                } else {
                    await message.reply(`❌ Alias \`${shortcut}\` not found.`);
                }
            }
            else {
                await message.reply('❌ Unknown action. Use `/alias` for help.');
            }
            
        } catch (error) {
            console.error('Error in alias command:', error);
            await message.reply('❌ An error occurred while managing aliases.');
        }
    }
};
