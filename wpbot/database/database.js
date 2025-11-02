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
            mutes: [],
            moderationLogs: [],
            commandStats: [],
            settings: {
                features: {},
                commandToggles: {}
            },
            analytics: {
                totalMessagesProcessed: 0
            },
            counters: {
                nextCase: 1
            }
        };
    }

    _formatCaseId(number) {
        return `CASE-${String(number).padStart(5, '0')}`;
    }

    _normalizeCaseId(caseId) {
        if (caseId === null || caseId === undefined) {
            return null;
        }
        const value = String(caseId).trim();
        if (!value) {
            return null;
        }
        return value.toUpperCase();
    }

    _extractCaseNumber(caseId) {
        if (typeof caseId !== 'string') {
            return null;
        }
        const match = caseId.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
    }

    _nextCaseId() {
        const current = Number.isFinite(this.data.counters?.nextCase) ? this.data.counters.nextCase : 1;
        const caseId = this._formatCaseId(current);
        this.data.counters = this.data.counters || { nextCase: current };
        this.data.counters.nextCase = current + 1;
        return caseId;
    }

    _backfillCaseIds() {
        this.data.counters = this.data.counters || { nextCase: 1 };
        let nextCase = Number.isFinite(this.data.counters.nextCase) && this.data.counters.nextCase > 0
            ? this.data.counters.nextCase
            : 1;

        const ensureCaseId = (record) => {
            if (!record || typeof record !== 'object') {
                return;
            }

            if (record.case_id) {
                record.case_id = this._normalizeCaseId(record.case_id) || this._formatCaseId(nextCase);
            }

            const existingNumber = this._extractCaseNumber(record.case_id);
            if (existingNumber) {
                nextCase = Math.max(nextCase, existingNumber + 1);
                if (record.payload && typeof record.payload === 'object') {
                    record.payload.case_id = record.case_id || record.payload.case_id;
                }
                return;
            }

            record.case_id = this._formatCaseId(nextCase);
            if (record.payload && typeof record.payload === 'object') {
                record.payload.case_id = record.case_id;
            }
            nextCase += 1;
        };

        (this.data.warnings || []).forEach(ensureCaseId);
        (this.data.mutes || []).forEach(ensureCaseId);
        (this.data.moderationLogs || []).forEach(ensureCaseId);

        this.data.counters.nextCase = nextCase;
    }

    _removeLogsForCaseIds(caseIds = []) {
        if (!Array.isArray(caseIds) || caseIds.length === 0) {
            return 0;
        }

        const normalizedIds = new Set(caseIds.map((id) => this._normalizeCaseId(id)).filter(Boolean));
        if (!normalizedIds.size) {
            return 0;
        }

        const before = this.data.moderationLogs.length;
        this.data.moderationLogs = this.data.moderationLogs.filter((log) => {
            const logCaseId = this._normalizeCaseId(log.case_id || log.payload?.case_id || null);
            return !normalizedIds.has(logCaseId);
        });

        return before - this.data.moderationLogs.length;
    }

    getModerationCase(caseId) {
        const targetCaseId = this._normalizeCaseId(caseId);
        if (!targetCaseId) {
            return null;
        }

        const warning = this.data.warnings.find((w) => this._normalizeCaseId(w.case_id) === targetCaseId);
        if (warning) {
            return { type: 'warning', record: { ...warning } };
        }

        const mute = this.data.mutes.find((m) => this._normalizeCaseId(m.case_id) === targetCaseId);
        if (mute) {
            return { type: 'mute', record: { ...mute } };
        }

        const log = this.data.moderationLogs.find((entry) => {
            const entryCase = this._normalizeCaseId(entry.case_id || entry.payload?.case_id || null);
            return entryCase === targetCaseId;
        });

        if (log) {
            return { type: 'log', record: { ...log } };
        }

        return null;
    }

    deleteModerationCase(caseId) {
        const caseInfo = this.getModerationCase(caseId);
        if (!caseInfo) {
            return null;
        }

        const targetCaseId = this._normalizeCaseId(caseInfo.record.case_id || caseInfo.record.payload?.case_id || caseId);
        let changed = false;

        if (caseInfo.type === 'warning') {
            this.data.warnings = this.data.warnings.filter((warning) => this._normalizeCaseId(warning.case_id) !== targetCaseId);
            changed = true;
        }

        if (caseInfo.type === 'mute') {
            this.data.mutes = this.data.mutes.filter((mute) => this._normalizeCaseId(mute.case_id) !== targetCaseId);
            changed = true;
        }

        if (caseInfo.type === 'log') {
            this.data.moderationLogs = this.data.moderationLogs.filter((entry) => {
                const entryCase = this._normalizeCaseId(entry.case_id || entry.payload?.case_id || null);
                return entryCase !== targetCaseId;
            });
            changed = true;
        } else {
            const removedLogs = this._removeLogsForCaseIds([targetCaseId]);
            changed = changed || removedLogs > 0;
        }

        if (changed) {
            this.save();
        }

        return caseInfo;
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
            this.data.mutes = this.data.mutes || [];
            this.data.moderationLogs = this.data.moderationLogs || [];
            this.data.settings = this.data.settings || { features: {}, commandToggles: {} };
            this.data.settings.features = this.data.settings.features || {};
            this.data.settings.commandToggles = this.data.settings.commandToggles || {};
            this.data.analytics = this.data.analytics || { totalMessagesProcessed: 0 };
            this.data.counters = this.data.counters || { nextCase: 1 };
            if (!Number.isFinite(this.data.counters.nextCase) || this.data.counters.nextCase < 1) {
                this.data.counters.nextCase = 1;
            }

            this._backfillCaseIds();

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
        const isNew = !this.data.users[userId];

        if (isNew) {
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
        }

        this.data.users[userId].message_count++;
        this.data.analytics.totalMessagesProcessed++;
        this.save();
        return this.data.users[userId];
    }

    getAllUsers() {
        return Object.values(this.data.users)
            .sort((a, b) => (b.last_seen || 0) - (a.last_seen || 0));
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

    getUserCount() {
        return Object.keys(this.data.users).length;
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

    getAllGroups() {
        return Object.values(this.data.groups)
            .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    }

    getGroupCount() {
        return Object.keys(this.data.groups).length;
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
        const caseId = this._nextCaseId();
        const warning = {
            id: this.data.warnings.length + 1,
            user_id: userId,
            group_id: groupId,
            reason: reason,
            warned_by: warnedBy,
            created_at: Date.now(),
            case_id: caseId
        };

        this.data.warnings.push(warning);
        this.addModerationLog('warn', {
            user_id: userId,
            group_id: groupId,
            reason,
            actor: warnedBy,
            case_id: caseId
        });
        this.save();

        const warnings = this.getUserWarnings(userId, groupId);
        let autoMute = null;

        if (warnings.length >= 10 && !this.getActiveMute(userId, groupId)) {
            const autoReason = `Auto-mute after ${warnings.length} warnings`;
            autoMute = this.addMute(userId, groupId, 30 * 60 * 1000, autoReason, 'system', { type: 'auto' });
        }

        return {
            warning,
            totalWarnings: warnings.length,
            autoMute,
            caseId: caseId
        };
    }

    getUserWarnings(userId, groupId) {
        return this.data.warnings.filter(w => 
            w.user_id === userId && w.group_id === groupId
        ).sort((a, b) => b.created_at - a.created_at);
    }

    clearUserWarnings(userId, groupId) {
        const before = this.data.warnings.length;
        const removedCaseIds = [];
        this.data.warnings = this.data.warnings.filter((warning) => {
            if (warning.user_id === userId && warning.group_id === groupId) {
                if (warning.case_id) {
                    removedCaseIds.push(warning.case_id);
                }
                return false;
            }
            return true;
        });
        const cleared = before - this.data.warnings.length;
        if (cleared > 0) {
            this._removeLogsForCaseIds(removedCaseIds);
            this.save();
        }
        return {
            cleared,
            caseIds: removedCaseIds
        };
    }

    getAllWarningsForUser(userId) {
        return this.data.warnings
            .filter(w => w.user_id === userId)
            .sort((a, b) => b.created_at - a.created_at);
    }

    clearAllWarningsForUser(userId) {
        const before = this.data.warnings.length;
        const removedCaseIds = [];
        this.data.warnings = this.data.warnings.filter((warning) => {
            if (warning.user_id === userId) {
                if (warning.case_id) {
                    removedCaseIds.push(warning.case_id);
                }
                return false;
            }
            return true;
        });
        const cleared = before - this.data.warnings.length;
        if (cleared > 0) {
            this._removeLogsForCaseIds(removedCaseIds);
            this.save();
        }
        return {
            cleared,
            caseIds: removedCaseIds
        };
    }

    getWarningCount(userId, groupId = null) {
        if (groupId) {
            return this.data.warnings.filter(w => w.user_id === userId && w.group_id === groupId).length;
        }
        return this.data.warnings.filter(w => w.user_id === userId).length;
    }

    /**
     * Mute operations
     */
    _cleanupExpiredMutes() {
        const now = Date.now();
        let mutated = false;

        this.data.mutes.forEach((mute) => {
            if (mute.active && mute.expires_at && mute.expires_at <= now) {
                mute.active = false;
                mute.ended_at = now;
                mutated = true;
            }
        });

        if (mutated) {
            this.save();
        }
    }

    addMute(userId, groupId, durationMs, reason, mutedBy, options = {}) {
        this._cleanupExpiredMutes();

        const now = Date.now();
        const expiresAt = durationMs ? now + durationMs : null;
        const existing = this.data.mutes.find(m => m.user_id === userId && m.group_id === groupId && m.active);

        let record;

        if (existing) {
            existing.reason = reason;
            existing.muted_by = mutedBy;
            existing.updated_at = now;
            existing.expires_at = expiresAt;
            existing.type = options.type || existing.type || 'manual';
            record = existing;
        } else {
            const caseId = this._nextCaseId();
            record = {
                id: this.data.mutes.length + 1,
                user_id: userId,
                group_id: groupId,
                reason,
                muted_by: mutedBy,
                created_at: now,
                updated_at: now,
                expires_at: expiresAt,
                active: true,
                type: options.type || 'manual',
                auto: options.type === 'auto',
                last_notified_at: null,
                case_id: caseId
            };
            this.data.mutes.push(record);
        }

        if (!record.case_id) {
            record.case_id = this._nextCaseId();
        }

        this.addModerationLog('mute', {
            user_id: userId,
            group_id: groupId,
            reason,
            actor: mutedBy,
            duration_ms: durationMs,
            type: record.type,
            case_id: record.case_id
        });

        this.save();
        return record;
    }

    removeMute(userId, groupId, removedBy, reason = 'Unmuted manually') {
        this._cleanupExpiredMutes();
        const mute = this.data.mutes.find(m => m.user_id === userId && m.group_id === groupId && m.active);

        if (mute) {
            mute.active = false;
            mute.ended_at = Date.now();
            mute.unmuted_by = removedBy;
            mute.unmute_reason = reason;

            this.addModerationLog('unmute', {
                user_id: userId,
                group_id: groupId,
                reason,
                actor: removedBy,
                case_id: mute.case_id || this._nextCaseId()
            });

            this.save();
        }

        return mute || null;
    }

    clearUserMutes(userId, groupId) {
        this._cleanupExpiredMutes();
        const removedCaseIds = [];
        const before = this.data.mutes.length;
        this.data.mutes = this.data.mutes.filter((mute) => {
            if (mute.user_id === userId && mute.group_id === groupId) {
                if (mute.case_id) {
                    removedCaseIds.push(mute.case_id);
                }
                return false;
            }
            return true;
        });

        const cleared = before - this.data.mutes.length;
        if (cleared > 0) {
            this._removeLogsForCaseIds(removedCaseIds);
            this.save();
        }

        return {
            cleared,
            caseIds: removedCaseIds
        };
    }

    clearAllMutesForUser(userId) {
        this._cleanupExpiredMutes();
        const removedCaseIds = [];
        const before = this.data.mutes.length;
        this.data.mutes = this.data.mutes.filter((mute) => {
            if (mute.user_id === userId) {
                if (mute.case_id) {
                    removedCaseIds.push(mute.case_id);
                }
                return false;
            }
            return true;
        });

        const cleared = before - this.data.mutes.length;
        if (cleared > 0) {
            this._removeLogsForCaseIds(removedCaseIds);
            this.save();
        }

        return {
            cleared,
            caseIds: removedCaseIds
        };
    }

    getActiveMute(userId, groupId) {
        this._cleanupExpiredMutes();
        return this.data.mutes.find(m => m.user_id === userId && m.group_id === groupId && m.active) || null;
    }

    getActiveMutesForUser(userId) {
        this._cleanupExpiredMutes();
        return this.data.mutes
            .filter(m => m.user_id === userId && m.active)
            .sort((a, b) => (a.expires_at || Infinity) - (b.expires_at || Infinity));
    }

    getUserMutes(userId) {
        this._cleanupExpiredMutes();
        return this.data.mutes
            .filter(m => m.user_id === userId)
            .sort((a, b) => b.created_at - a.created_at);
    }

    touchMuteNotification(muteId) {
        const mute = this.data.mutes.find(m => m.id === muteId);
        if (mute) {
            mute.last_notified_at = Date.now();
            this.save();
        }
    }

    isUserMuted(userId, groupId) {
        return !!this.getActiveMute(userId, groupId);
    }

    /**
     * Moderation log helpers
     */
    addModerationLog(action, payload = {}) {
        const normalizedPayload = { ...payload };
        if (!normalizedPayload.case_id) {
            normalizedPayload.case_id = this._nextCaseId();
        } else {
            normalizedPayload.case_id = this._normalizeCaseId(normalizedPayload.case_id);
        }

        const record = {
            id: this.data.moderationLogs.length + 1,
            action,
            payload: normalizedPayload,
            case_id: normalizedPayload.case_id,
            created_at: Date.now()
        };

        this.data.moderationLogs.push(record);
        this.save();
        return record;
    }

    getModerationLogs({ userId = null, groupId = null, limit = 50 } = {}) {
        return this.data.moderationLogs
            .filter(log => {
                const payload = log.payload || {};
                if (userId && payload.user_id !== userId) return false;
                if (groupId && payload.group_id !== groupId) return false;
                return true;
            })
            .sort((a, b) => b.created_at - a.created_at)
            .slice(0, limit);
    }

    getModerationSummaryForUser(userId) {
        const warnings = this.getAllWarningsForUser(userId);
        const mutes = this.getUserMutes(userId);
        const activeMutes = mutes.filter(m => m.active);

        return {
            warningsCount: warnings.length,
            totalMutes: mutes.length,
            activeMutes,
            lastWarning: warnings[0] || null,
            lastMute: mutes[0] || null
        };
    }

    getModerationOverview() {
        return Object.values(this.data.users).map((user) => {
            const summary = this.getModerationSummaryForUser(user.id);
            return {
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    last_seen: user.last_seen
                },
                warningsCount: summary.warningsCount,
                totalMutes: summary.totalMutes,
                activeMutes: summary.activeMutes,
                lastWarning: summary.lastWarning,
                lastMute: summary.lastMute
            };
        }).sort((a, b) => (b.warningsCount + b.totalMutes) - (a.warningsCount + a.totalMutes));
    }

    getModerationDetail(userId, groupId = null) {
        const user = this.getUser(userId);
        if (!user) {
            return null;
        }

        const summary = this.getModerationSummaryForUser(userId);
        const warnings = groupId ? this.getUserWarnings(userId, groupId) : this.getAllWarningsForUser(userId);
        const mutes = this.getUserMutes(userId);
        const groupedWarnings = warnings.reduce((acc, warning) => {
            const key = warning.group_id || 'direct';
            acc[key] = acc[key] || [];
            acc[key].push(warning);
            return acc;
        }, {});

        Object.values(groupedWarnings).forEach((list) => list.sort((a, b) => b.created_at - a.created_at));

        return {
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                last_seen: user.last_seen,
                created_at: user.created_at
            },
            summary,
            warnings,
            groupedWarnings,
            mutes
        };
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
     * Command toggle helpers
     */
    setCommandEnabled(commandName, enabled) {
        this.data.settings.commandToggles[commandName] = !!enabled;
        this.save();
    }

    isCommandEnabled(commandName) {
        const toggles = this.data.settings.commandToggles || {};
        if (typeof toggles[commandName] === 'boolean') {
            return toggles[commandName];
        }
        return true;
    }

    getCommandToggles() {
        return { ...this.data.settings.commandToggles };
    }

    /**
     * Feature flag helpers
     */
    setFeatureFlag(flag, value) {
        this.data.settings.features[flag] = !!value;
        this.save();
    }

    getFeatureFlag(flag, defaultValue = false) {
        if (typeof this.data.settings.features[flag] === 'boolean') {
            return this.data.settings.features[flag];
        }
        return defaultValue;
    }

    getFeatureFlags(defaults = {}) {
        return {
            ...defaults,
            ...this.data.settings.features
        };
    }

    /**
     * Analytics helpers
     */
    getAnalytics() {
        return {
            totalMessagesProcessed: this.data.analytics.totalMessagesProcessed || 0,
            totalUsers: this.getUserCount(),
            totalGroups: this.getGroupCount()
        };
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
