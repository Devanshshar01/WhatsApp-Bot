const config = require('../config');

class CooldownManager {
    constructor() {
        this.cooldowns = new Map();
        this.messageCounts = new Map();
    }

    /**
     * Check if user is on cooldown for a command
     */
    isOnCooldown(userId, commandName) {
        const key = `${userId}-${commandName}`;
        
        if (!this.cooldowns.has(key)) {
            return false;
        }

        const expirationTime = this.cooldowns.get(key);
        
        if (Date.now() < expirationTime) {
            return true;
        }

        this.cooldowns.delete(key);
        return false;
    }

    /**
     * Set cooldown for user and command
     */
    setCooldown(userId, commandName, duration = config.commandCooldown) {
        const key = `${userId}-${commandName}`;
        const expirationTime = Date.now() + duration;
        this.cooldowns.set(key, expirationTime);
    }

    /**
     * Get remaining cooldown time
     */
    getRemainingTime(userId, commandName) {
        const key = `${userId}-${commandName}`;
        
        if (!this.cooldowns.has(key)) {
            return 0;
        }

        const expirationTime = this.cooldowns.get(key);
        const remaining = expirationTime - Date.now();
        
        return remaining > 0 ? remaining : 0;
    }

    /**
     * Check if user is spamming
     */
    isSpamming(userId) {
        const now = Date.now();
        const userKey = userId;
        
        if (!this.messageCounts.has(userKey)) {
            this.messageCounts.set(userKey, []);
        }

        const timestamps = this.messageCounts.get(userKey);
        
        // Remove timestamps older than 1 minute
        const recentTimestamps = timestamps.filter(ts => now - ts < 60000);
        
        // Add current timestamp
        recentTimestamps.push(now);
        this.messageCounts.set(userKey, recentTimestamps);

        // Check if exceeded limit
        return recentTimestamps.length > config.maxMessagesPerMinute;
    }

    /**
     * Clear all cooldowns for a user
     */
    clearUserCooldowns(userId) {
        for (const [key] of this.cooldowns) {
            if (key.startsWith(userId)) {
                this.cooldowns.delete(key);
            }
        }
    }

    /**
     * Clear all cooldowns
     */
    clearAll() {
        this.cooldowns.clear();
        this.messageCounts.clear();
    }
}

module.exports = new CooldownManager();
