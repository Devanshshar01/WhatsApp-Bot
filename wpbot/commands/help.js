const config = require('../config');

module.exports = {
    name: 'help',
    aliases: ['h', 'commands'],
    description: 'Display all available commands',
    usage: '/help [command]',
    cooldown: 5000,
    
    async execute(client, message, args) {
        try {
            // Ensure we load command handler lazily to avoid circular dependency
            const commandHandler = require('../utils/commandHandler');

            // If specific command requested
            if (args.length > 0) {
                const commandName = args[0].toLowerCase();
                const command = commandHandler.getCommand(commandName);
                
                if (!command) {
                    await message.reply(`❌ Command "${commandName}" not found.`);
                    return;
                }

                let helpText = `📖 *Command: ${config.prefix}${command.name}*\n\n`;
                helpText += `*Description:* ${command.description}\n`;
                helpText += `*Usage:* ${command.usage}\n`;
                
                if (command.aliases && command.aliases.length > 0) {
                    helpText += `*Aliases:* ${command.aliases.join(', ')}\n`;
                }
                
                if (command.cooldown) {
                    helpText += `*Cooldown:* ${command.cooldown / 1000}s\n`;
                }

                await message.reply(helpText);
                return;
            }

            // Display all commands
            const commands = commandHandler.getAllCommands();
            
            const categories = {
                basic: [],
                media: [],
                group: [],
                admin: [],
                owner: []
            };

            commands.forEach(cmd => {
                if (cmd.ownerOnly) {
                    categories.owner.push(cmd);
                } else if (cmd.adminOnly) {
                    categories.admin.push(cmd);
                } else if (cmd.groupOnly) {
                    categories.group.push(cmd);
                } else if (cmd.category === 'media') {
                    categories.media.push(cmd);
                } else {
                    categories.basic.push(cmd);
                }
            });

            let helpText = `🤖 *${config.botName} - Command List*\n\n`;
            helpText += `Prefix: *${config.prefix}*\n`;
            helpText += `Total Commands: *${commands.length}*\n\n`;

            if (categories.basic.length > 0) {
                helpText += `*📌 Basic Commands:*\n`;
                categories.basic.forEach(cmd => {
                    helpText += `${config.prefix}${cmd.name} - ${cmd.description}\n`;
                });
                helpText += '\n';
            }

            if (categories.media.length > 0) {
                helpText += `*🎨 Media Commands:*\n`;
                categories.media.forEach(cmd => {
                    helpText += `${config.prefix}${cmd.name} - ${cmd.description}\n`;
                });
                helpText += '\n';
            }

            if (categories.group.length > 0) {
                helpText += `*👥 Group Commands:*\n`;
                categories.group.forEach(cmd => {
                    helpText += `${config.prefix}${cmd.name} - ${cmd.description}\n`;
                });
                helpText += '\n';
            }

            if (categories.admin.length > 0) {
                helpText += `*🛡️ Admin Commands:*\n`;
                categories.admin.forEach(cmd => {
                    helpText += `${config.prefix}${cmd.name} - ${cmd.description}\n`;
                });
                helpText += '\n';
            }

            if (categories.owner.length > 0) {
                helpText += `*👑 Owner Commands:*\n`;
                categories.owner.forEach(cmd => {
                    helpText += `${config.prefix}${cmd.name} - ${cmd.description}\n`;
                });
                helpText += '\n';
            }

            helpText += `\nType *${config.prefix}help <command>* for detailed info about a specific command.`;

            await message.reply(helpText);
        } catch (error) {
            console.error('Error in help command:', error);
            await message.reply('❌ An error occurred while displaying help.');
        }
    }
};
