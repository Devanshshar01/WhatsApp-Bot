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
            const commands = commandHandler.getAllCommands().filter(cmd => cmd.name !== 'commandname');

            const categories = {
                basic: { label: '📌 Basic Commands', items: [], seen: new Set() },
                utility: { label: '🧰 Utility Commands', items: [], seen: new Set() },
                media: { label: '🎨 Media Commands', items: [], seen: new Set() },
                fun: { label: '🎉 Fun Commands', items: [], seen: new Set() },
                automation: { label: '🤖 Automation Commands', items: [], seen: new Set() },
                group: { label: '👥 Group Commands', items: [], seen: new Set() },
                admin: { label: '🛡️ Admin Commands', items: [], seen: new Set() },
                owner: { label: '👑 Owner Commands', items: [], seen: new Set() }
            };

            const addToCategory = (categoryKey, cmd, entry) => {
                const category = categories[categoryKey];
                if (category && !category.seen.has(cmd.name)) {
                    category.items.push({ name: cmd.name, text: entry });
                    category.seen.add(cmd.name);
                }
            };

            commands.forEach(cmd => {
                const entry = `${config.prefix}${cmd.name} - ${cmd.description}`;
                const normalizedCategory = (cmd.category || '').toLowerCase();
                let assigned = false;

                if (cmd.ownerOnly) {
                    addToCategory('owner', cmd, entry);
                    assigned = true;
                }

                if (cmd.adminOnly || normalizedCategory === 'admin') {
                    addToCategory('admin', cmd, entry);
                    assigned = true;
                }

                if (cmd.groupOnly) {
                    addToCategory('group', cmd, entry);
                    assigned = true;
                }

                if (normalizedCategory === 'utility') {
                    addToCategory('utility', cmd, entry);
                    assigned = true;
                } else if (normalizedCategory === 'media') {
                    addToCategory('media', cmd, entry);
                    assigned = true;
                } else if (normalizedCategory === 'fun') {
                    addToCategory('fun', cmd, entry);
                    assigned = true;
                } else if (normalizedCategory === 'automation') {
                    addToCategory('automation', cmd, entry);
                    assigned = true;
                }

                if (!assigned) {
                    addToCategory('basic', cmd, entry);
                }
            });

            Object.values(categories).forEach(category => {
                category.items.sort((a, b) => a.name.localeCompare(b.name));
            });

            let helpText = `🤖 *${config.botName} - Command List*\n\n`;
            helpText += `Prefix: *${config.prefix}*\n`;
            helpText += `Total Commands: *${commands.length}*\n\n`;

            const displayOrder = ['basic', 'utility', 'media', 'fun', 'automation', 'group', 'admin', 'owner'];

            displayOrder.forEach(key => {
                const category = categories[key];
                if (category.items.length === 0) {
                    return;
                }

                helpText += `*${category.label}:*\n`;
                category.items.forEach(item => {
                    helpText += `${item.text}\n`;
                });
                helpText += '\n';
            });

            helpText += `\nType *${config.prefix}help <command>* for detailed info about a specific command.`;

            await message.reply(helpText);
        } catch (error) {
            console.error('Error in help command:', error);
            await message.reply('❌ An error occurred while displaying help.');
        }
    }
};
