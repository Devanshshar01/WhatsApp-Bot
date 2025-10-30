const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

class BotDatabase {
    constructor() {
        this.dbPath = config.databasePath.replace('.db', '.json');
        this.data = {
            users: {},
            groups: {},
            groupSettings: {},
            warnings: [],
            commandStats: []
        };
    }

    /**
     * Initialize database and load data
     */
    init() {
        try {
            // Ensure database directory exists
            fs.ensureDirSync(path.dirname(this.dbPath));

            // Load existing data if file exists
            if (fs.existsSync(this.dbPath)) {
                const fileContent = fs.readFileSync(this.dbPath, 'utf8');
                if (fileContent.trim()) {
                    this.data = JSON.parse(fileContent);
                }
            }

            // Ensure all data structures exist
            this.data.users = this.data.users || {};
            this.data.groups = this.data.groups || {};
            this.data.groupSettings = this.data.groupSettings || {};
            this.data.warnings = this.data.warnings || [];
            this.data.commandStats = this.data.commandStats || [];

            // Save initialized structure
            this.save();

            logger.success('Database initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize database:', error);
            throw error;
        }
    }

    /**
     * Save database to file
     */
    save() {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            logger.error('Failed to save database:', error);
        }
    }

    /**
     * Not needed for JSON but kept for compatibility
     */
    createTables() {
        // No-op for JSON storage
    }

    /**
     * User operations
     */
    getUser(userId) {
        return this.data.users[userId] || null;
    }

    createOrUpdateUser(userId, name, phone) {
        if (!this.data.users[userId]) {
            this.data.users[userId] = {
                id: userId,
                name: name,
                phone: phone,
                is_blocked: false,
                message_count: 0,
                last_seen: Date.now(),
                created_at: Date.now()
            };
        } else {
            this.data.users[userId].name = name;
            this.data.users[userId].phone = phone;
            this.data.users[userId].last_seen = Date.now();
            this.data.users[userId].message_count++;
        }
        this.save();
        return this.data.users[userId];
    }

    blockUser(userId) {
        if (this.data.users[userId]) {
            this.data.users[userId].is_blocked = true;
            this.save();
        }
    }

    unblockUser(userId) {
        if (this.data.users[userId]) {
            this.data.users[userId].is_blocked = false;
            this.save();
        }
    }

    isUserBlocked(userId) {
        const user = this.getUser(userId);
        return user ? user.is_blocked === true : false;
    }

    /**
     * Group operations
     */
    getGroup(groupId) {
        return this.data.groups[groupId] || null;
    }

    createOrUpdateGroup(groupId, name, description = '') {
        if (!this.data.groups[groupId]) {
            this.data.groups[groupId] = {
                id: groupId,
                name: name,
                description: description,
                welcome_enabled: 1,
                goodbye_enabled: 1,
                anti_link: 0,
                anti_spam: 0,
                profanity_filter: 0,
                created_at: Date.now()
            };
        } else {
            this.data.groups[groupId].name = name;
            this.data.groups[groupId].description = description;
        }
        this.save();
        return this.data.groups[groupId];
    }

    updateGroupSettings(groupId, settings) {
        if (!this.data.groups[groupId]) {
            return;
        }
        this.data.groups[groupId].welcome_enabled = settings.welcomeEnabled ? 1 : 0;
        this.data.groups[groupId].goodbye_enabled = settings.goodbyeEnabled ? 1 : 0;
        this.data.groups[groupId].anti_link = settings.antiLink ? 1 : 0;
        this.data.groups[groupId].anti_spam = settings.antiSpam ? 1 : 0;
        this.data.groups[groupId].profanity_filter = settings.profanityFilter ? 1 : 0;
        this.save();
    }

    getGroupSettings(groupId) {
        return this.data.groupSettings[groupId] || null;
    }

    setGroupWelcomeMessage(groupId, message) {
        if (!this.data.groupSettings[groupId]) {
            this.data.groupSettings[groupId] = {};
        }
        this.data.groupSettings[groupId].welcome_message = message;
        this.save();
    }

    setGroupGoodbyeMessage(groupId, message) {
        if (!this.data.groupSettings[groupId]) {
            this.data.groupSettings[groupId] = {};
        }
        this.data.groupSettings[groupId].goodbye_message = message;
        this.save();
    }

    /**
     * Warning operations
     */
    addWarning(userId, groupId, reason, warnedBy) {
        this.data.warnings.push({
            id: this.data.warnings.length + 1,
            user_id: userId,
            group_id: groupId,
            reason: reason,
            warned_by: warnedBy,
            created_at: Date.now()
        });
        this.save();
    }

    getUserWarnings(userId, groupId) {
        return this.data.warnings.filter(w => 
            w.user_id === userId && w.group_id === groupId
        ).sort((a, b) => b.created_at - a.created_at);
    }

    clearUserWarnings(userId, groupId) {
        this.data.warnings = this.data.warnings.filter(w => 
            !(w.user_id === userId && w.group_id === groupId)
        );
        this.save();
    }

    /**
     * Command statistics
     */
    logCommand(command, userId, groupId = null) {
        this.data.commandStats.push({
            id: this.data.commandStats.length + 1,
            command: command,
            user_id: userId,
            group_id: groupId,
            executed_at: Date.now()
        });
        this.save();
    }

    getCommandStats(limit = 10) {
        const stats = {};
        this.data.commandStats.forEach(stat => {
            stats[stat.command] = (stats[stat.command] || 0) + 1;
        });
        
        return Object.entries(stats)
            .map(([command, count]) => ({ command, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * Close database connection
     */
    close() {
        this.save();
        logger.info('Database closed');
    }
}

module.exports = new BotDatabase();
