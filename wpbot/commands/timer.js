// Store active timers
const activeTimers = new Map();

module.exports = {
    name: 'timer',
    aliases: ['stopwatch', 'time'],
    description: 'Start a countdown timer or stopwatch',
    usage: '/timer <start|stop|check> [duration]',
    category: 'utility',
    cooldown: 2000,
    
    async execute(client, message, args) {
        try {
            const userId = message.author || message.from;
            const chatId = message.from;
            const timerId = `${chatId}_${userId}`;
            
            if (args.length === 0) {
                const helpText = `⏱️ *Timer & Stopwatch*\n\n` +
                    `*Commands:*\n` +
                    `• /timer start - Start stopwatch\n` +
                    `• /timer start <duration> - Start countdown\n` +
                    `• /timer stop - Stop timer\n` +
                    `• /timer check - Check timer status\n\n` +
                    `*Duration Format:*\n` +
                    `• 5m - 5 minutes\n` +
                    `• 10s - 10 seconds\n` +
                    `• 1h30m - 1 hour 30 minutes\n\n` +
                    `*Examples:*\n` +
                    `• /timer start - Start stopwatch\n` +
                    `• /timer start 5m - 5 minute countdown\n` +
                    `• /timer start 30s - 30 second countdown\n` +
                    `• /timer stop - Stop current timer\n` +
                    `• /timer check - Check elapsed time`;
                await message.reply(helpText);
                return;
            }

            const action = args[0].toLowerCase();
            
            switch (action) {
                case 'start':
                    await this.startTimer(message, args.slice(1), timerId);
                    break;
                    
                case 'stop':
                case 'end':
                    await this.stopTimer(message, timerId);
                    break;
                    
                case 'check':
                case 'status':
                    await this.checkTimer(message, timerId);
                    break;
                    
                default:
                    await message.reply('❌ Invalid action. Use: start, stop, or check');
            }

        } catch (error) {
            console.error('Error in timer command:', error);
            await message.reply('❌ An error occurred with the timer.');
        }
    },
    
    async startTimer(message, args, timerId) {
        try {
            // Check if timer already exists
            if (activeTimers.has(timerId)) {
                await message.reply('⚠️ You already have an active timer. Use /timer stop to end it first.');
                return;
            }
            
            let duration = 0;
            let isCountdown = false;
            
            // Parse duration if provided (countdown)
            if (args.length > 0) {
                const timeStr = args[0].toLowerCase();
                const timeRegex = /(\d+)([dhms])/g;
                let match;
                
                while ((match = timeRegex.exec(timeStr)) !== null) {
                    const value = parseInt(match[1]);
                    const unit = match[2];
                    
                    switch (unit) {
                        case 'd': duration += value * 24 * 60 * 60 * 1000; break;
                        case 'h': duration += value * 60 * 60 * 1000; break;
                        case 'm': duration += value * 60 * 1000; break;
                        case 's': duration += value * 1000; break;
                    }
                }
                
                if (duration > 0) {
                    isCountdown = true;
                }
            }
            
            const timer = {
                startTime: Date.now(),
                duration: duration,
                isCountdown: isCountdown,
                userId: message.author || message.from,
                chatId: message.from
            };
            
            activeTimers.set(timerId, timer);
            
            if (isCountdown) {
                // Set countdown notification
                setTimeout(async () => {
                    if (activeTimers.has(timerId)) {
                        activeTimers.delete(timerId);
                        
                        let alertMsg = `⏰ *TIMER FINISHED!*\n\n`;
                        alertMsg += `⏱️ Your ${this.formatDuration(duration)} timer has ended!`;
                        
                        await message.reply(alertMsg);
                        
                        // Send notification sound (bell emoji)
                        await message.reply('🔔🔔🔔');
                    }
                }, duration);
                
                let replyText = `⏱️ *Countdown Started!*\n\n`;
                replyText += `⏳ *Duration:* ${this.formatDuration(duration)}\n`;
                replyText += `⏰ *Ends at:* ${new Date(Date.now() + duration).toLocaleTimeString()}\n\n`;
                replyText += `Use /timer check to see remaining time\n`;
                replyText += `Use /timer stop to cancel`;
                
                await message.reply(replyText);
            } else {
                // Stopwatch mode
                await message.reply('⏱️ *Stopwatch Started!*\n\nUse /timer check to see elapsed time\nUse /timer stop to stop');
            }
            
        } catch (error) {
            console.error('Error starting timer:', error);
            await message.reply('❌ Failed to start timer');
        }
    },
    
    async stopTimer(message, timerId) {
        try {
            const timer = activeTimers.get(timerId);
            
            if (!timer) {
                await message.reply('❌ You don\'t have an active timer');
                return;
            }
            
            const elapsed = Date.now() - timer.startTime;
            activeTimers.delete(timerId);
            
            let replyText = `⏹️ *Timer Stopped!*\n\n`;
            
            if (timer.isCountdown) {
                const remaining = timer.duration - elapsed;
                if (remaining > 0) {
                    replyText += `⏱️ *Remaining:* ${this.formatDuration(remaining)}\n`;
                    replyText += `✅ *Completed:* ${Math.round((elapsed / timer.duration) * 100)}%`;
                } else {
                    replyText += `✅ *Countdown completed!*`;
                }
            } else {
                replyText += `⏱️ *Elapsed Time:* ${this.formatDuration(elapsed)}`;
            }
            
            await message.reply(replyText);
            
        } catch (error) {
            console.error('Error stopping timer:', error);
            await message.reply('❌ Failed to stop timer');
        }
    },
    
    async checkTimer(message, timerId) {
        try {
            const timer = activeTimers.get(timerId);
            
            if (!timer) {
                await message.reply('❌ You don\'t have an active timer\n\nUse /timer start to begin');
                return;
            }
            
            const elapsed = Date.now() - timer.startTime;
            let replyText = `⏱️ *Timer Status*\n\n`;
            
            if (timer.isCountdown) {
                const remaining = timer.duration - elapsed;
                if (remaining > 0) {
                    const progress = Math.round((elapsed / timer.duration) * 100);
                    const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
                    
                    replyText += `⏳ *Remaining:* ${this.formatDuration(remaining)}\n`;
                    replyText += `📊 *Progress:* ${progressBar} ${progress}%\n`;
                    replyText += `⏰ *Ends at:* ${new Date(timer.startTime + timer.duration).toLocaleTimeString()}`;
                } else {
                    replyText += `✅ *Countdown completed!*\n`;
                    replyText += `⏱️ *Overtime:* ${this.formatDuration(Math.abs(remaining))}`;
                }
            } else {
                replyText += `⏱️ *Elapsed:* ${this.formatDuration(elapsed)}\n`;
                replyText += `▶️ *Started at:* ${new Date(timer.startTime).toLocaleTimeString()}`;
            }
            
            await message.reply(replyText);
            
        } catch (error) {
            console.error('Error checking timer:', error);
            await message.reply('❌ Failed to check timer');
        }
    },
    
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
};
