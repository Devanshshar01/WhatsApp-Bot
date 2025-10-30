const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('./logger');
const cooldown = require('./cooldown');
const helpers = require('./helpers');
const database = require('../database/database');

class CommandHandler {
    constructor() {
        this.commands = new Map();
        this.loadCommands();
    }

    /**
     * Load all commands from commands directory
     */
    loadCommands() {
        const commandsPath = path.join(__dirname, '../commands');
        
        if (!fs.existsSync(commandsPath)) {
            fs.mkdirSync(commandsPath, { recursive: true });
            logger.warn('Commands directory created. Please add command files.');
            return;
        }

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            try {
                const command = require(path.join(commandsPath, file));
                
                if (command.name && command.execute) {
                    this.commands.set(command.name, command);
                    
                    // Register aliases
                    if (command.aliases && Array.isArray(command.aliases)) {
                        command.aliases.forEach(alias => {
                            this.commands.set(alias, command);
                        });
                    }
                    
                    logger.info(`Loaded command: ${command.name}`);
                } else {
                    logger.warn(`Command file ${file} is missing required properties`);
                }
            } catch (error) {
                logger.error(`Error loading command ${file}:`, error);
            }
        }

        logger.success(`Loaded ${this.commands.size} commands`);
    }

    /**
     * Reload all commands
     */
    reloadCommands() {
        this.commands.clear();
        
        // Clear require cache
        const commandsPath = path.join(__dirname, '../commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        commandFiles.forEach(file => {
            const filePath = path.join(commandsPath, file);
            delete require.cache[require.resolve(filePath)];
        });

        this.loadCommands();
    }

    /**
     * Execute a command
     */
    async execute(client, message, commandName, args) {
        const command = this.commands.get(commandName);

        if (!command) {
            logger.warn(`Command not found: ${commandName}`);
            return false;
        }

        try {
            // Check if user is blocked
            const userId = message.author || message.from;
            if (database.isUserBlocked(userId)) {
                await message.reply('❌ You are blocked from using this bot.');
                return true;
            }

            // Check permissions
            if (command.ownerOnly && !helpers.isOwner(userId)) {
                logger.warn(`Unauthorized owner command attempt by ${userId}: ${commandName}`);
                await message.reply('❌ This command is only available to bot owners.');
                return true;
            }

            if (command.groupOnly && !message.from.endsWith('@g.us')) {
                await message.reply('❌ This command can only be used in groups.');
                return true;
            }

            if (command.adminOnly) {
                const isAdmin = await helpers.isGroupAdmin(message);
                const isOwner = helpers.isOwner(userId);

                logger.info(`Admin check for ${userId}: isAdmin=${isAdmin}, isOwner=${isOwner}`);

                if (!isAdmin && !isOwner) {
                    await message.reply('❌ This command requires admin privileges.');
                    return true;
                }
            }

            // Check cooldown
            if (cooldown.isOnCooldown(userId, commandName)) {
                const remaining = cooldown.getRemainingTime(userId, commandName);
                const seconds = Math.ceil(remaining / 1000);
                await message.reply(`⏱️ Please wait ${seconds} seconds before using this command again.`);
                return true;
            }

            // Log command usage
            logger.command(userId, commandName, message.from);
            database.logCommand(commandName, userId, message.from.endsWith('@g.us') ? message.from : null);

            // Execute command
            await command.execute(client, message, args);

            // Set cooldown
            if (command.cooldown) {
                cooldown.setCooldown(userId, commandName, command.cooldown);
            } else {
                cooldown.setCooldown(userId, commandName);
            }

            return true;
        } catch (error) {
            logger.error(`Error executing command ${commandName}:`, error);
            await message.reply('❌ An error occurred while executing this command.');
            return true;
        }
    }

    /**
     * Get command by name
     */
    getCommand(name) {
        return this.commands.get(name);
    }

    /**
     * Get all commands
     */
    getAllCommands() {
        const uniqueCommands = new Map();
        
        for (const [name, command] of this.commands) {
            if (command.name === name) {
                uniqueCommands.set(name, command);
            }
        }
        
        return Array.from(uniqueCommands.values());
    }
}

module.exports = new CommandHandler();
