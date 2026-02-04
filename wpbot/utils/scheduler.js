const cron = require('node-cron');
const database = require('../database/database');
const logger = require('./logger');

// Store active cron jobs
const activeJobs = new Map();

/**
 * Parse human-readable schedule to cron expression
 * Examples:
 * - "9:00 daily" -> "0 9 * * *"
 * - "14:30 weekly monday" -> "30 14 * * 1"
 * - "10:00 monthly 1" -> "0 10 1 * *"
 * - " * * * *" -> passed through as-is (already cron format)*/5
function parseToCron(input) {
    const lower = input.toLowerCase().trim();
    
    // If already a cron expression, validate and return
    if (lower.split(' ').length === 5 && /^[\d\*\/\-\,]+/.test(lower.split(' ')[0])) {
        if (cron.validate(lower)) {
            return lower;
        }
        return null;
    }
    
    // Parse human-readable format
    const timeMatch = lower.match(/^(\d{1,2}):(\d{2})/);
    if (!timeMatch) {
        return null;
    }
    
    const hour = parseInt(timeMatch[1]);
    const minute = parseInt(timeMatch[2]);
    
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return null;
    }
    
    const rest = lower.slice(timeMatch[0].length).trim();
    
    // Daily: "9:00 daily"
    if (rest === 'daily' || rest === 'everyday' || rest === '') {
        return `${minute} ${hour} * * *`;
    }
    
    // Weekly: "14:30 weekly monday"
    const weeklyMatch = rest.match(/^weekly\s+(\w+)$/);
    if (weeklyMatch) {
        const days = {
            'sunday': 0, 'sun': 0,
            'monday': 1, 'mon': 1,
            'tuesday': 2, 'tue': 2,
            'wednesday': 3, 'wed': 3,
            'thursday': 4, 'thu': 4,
            'friday': 5, 'fri': 5,
            'saturday': 6, 'sat': 6
        };
        const dayNum = days[weeklyMatch[1].toLowerCase()];
        if (dayNum !== undefined) {
            return `${minute} ${hour} * * ${dayNum}`;
        }
    }
    
    // Monthly: "10:00 monthly 15" (15th of each month)
    const monthlyMatch = rest.match(/^monthly\s+(\d{1,2})$/);
    if (monthlyMatch) {
        const dayOfMonth = parseInt(monthlyMatch[1]);
        if (dayOfMonth >= 1 && dayOfMonth <= 31) {
            return `${minute} ${hour} ${dayOfMonth} * *`;
        }
    }
    
    // Hourly: "hourly" or "every hour"
    if (rest === 'hourly' || rest === 'every hour') {
        return `${minute} * * * *`;
    }
    
    return null;
}

/**
 * Get human-readable description of cron expression
 */
function describeCron(cronExpr) {
    const parts = cronExpr.split(' ');
    if (parts.length !== 5) return cronExpr;
    
    const [min, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    const time = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
    
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return `Daily at ${time}`;
    }
    
    if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Every ${days[parseInt(dayOfWeek)] || dayOfWeek} at ${time}`;
    }
    
    if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
        return `Monthly on day ${dayOfMonth} at ${time}`;
    }
    
    return `${cronExpr} (${time})`;
}

/**
 * Start a scheduled message job
 */
function startJob(schedule, client) {
    if (activeJobs.has(schedule.id)) {
        activeJobs.get(schedule.id).stop();
    }
    
    if (!schedule.enabled) {
        return null;
    }
    
    const job = cron.schedule(schedule.cronExpression, async () => {
        try {
            await client.sendMessage(schedule.chatId, schedule.message);
            database.updateScheduledMessage(schedule.id, { lastRun: Date.now() });
            logger.info(`[SCHEDULER] Sent scheduled message #${schedule.id} to ${schedule.chatId}`);
        } catch (error) {
            logger.error(`[SCHEDULER] Failed to send scheduled message #${schedule.id}:`, error);
        }
    });
    
    activeJobs.set(schedule.id, job);
    return job;
}

/**
 * Stop a scheduled message job
 */
function stopJob(scheduleId) {
    if (activeJobs.has(scheduleId)) {
        activeJobs.get(scheduleId).stop();
        activeJobs.delete(scheduleId);
        return true;
    }
    return false;
}

/**
 * Initialize all scheduled messages from database
 */
function initializeScheduler(db, client) {
    // db parameter for compatibility but we import database directly
    const schedules = database.getScheduledMessages();
    let count = 0;
    
    for (const schedule of schedules) {
        if (schedule.enabled) {
            startJob(schedule, client);
            count++;
        }
    }
    
    logger.info(`[SCHEDULER] Initialized ${count} scheduled messages`);
    return count;
}

/**
 * Stop all scheduled jobs
 */
function stopAllJobs() {
    for (const [id, job] of activeJobs) {
        job.stop();
    }
    activeJobs.clear();
}

module.exports = {
    parseToCron,
    describeCron,
    startJob,
    stopJob,
    initializeScheduler,
    stopAllJobs,
    activeJobs
};
