const database = require('../database/database');

// Store active polls in memory (or you could use database)
const activePolls = new Map();

module.exports = {
    name: 'poll',
    aliases: ['vote', 'survey'],
    description: 'Create a poll or vote on one',
    usage: '/poll <question> | <option1> | <option2> | ...',
    category: 'utility',
    cooldown: 5000,
    groupOnly: true,
    
    async execute(client, message, args) {
        try {
            // Check if voting on existing poll
            if (args.length === 1 && !isNaN(args[0])) {
                return await this.vote(message, parseInt(args[0]));
            }
            
            // Check for end poll command
            if (args[0] === 'end') {
                return await this.endPoll(message);
            }
            
            // Check for results command
            if (args[0] === 'results' || args[0] === 'result') {
                return await this.showResults(message);
            }

            // Creating new poll
            const pollText = args.join(' ');
            
            if (!pollText.includes('|')) {
                const helpText = `📊 *Poll Command*\n\n` +
                    `*Create Poll:*\n` +
                    `/poll <question> | <option1> | <option2> | ...\n\n` +
                    `*Example:*\n` +
                    `/poll What's for lunch? | Pizza | Burger | Salad | Skip lunch\n\n` +
                    `*Vote:*\n` +
                    `/poll <number> - Vote for an option\n\n` +
                    `*Other Commands:*\n` +
                    `/poll results - Show current results\n` +
                    `/poll end - End the poll (admin only)`;
                await message.reply(helpText);
                return;
            }

            const parts = pollText.split('|').map(p => p.trim()).filter(p => p);
            
            if (parts.length < 3) {
                await message.reply('❌ Poll must have a question and at least 2 options\n\nFormat: /poll Question | Option1 | Option2');
                return;
            }
            
            if (parts.length > 11) {
                await message.reply('❌ Maximum 10 options allowed');
                return;
            }

            const question = parts[0];
            const options = parts.slice(1);
            const chatId = message.from;
            
            // Create poll object
            const poll = {
                id: Date.now(),
                question,
                options: options.map((opt, i) => ({
                    text: opt,
                    number: i + 1,
                    votes: []
                })),
                creator: message.author || message.from,
                createdAt: new Date(),
                active: true
            };
            
            // Store poll
            activePolls.set(chatId, poll);
            
            // Create poll message
            const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            
            let pollMsg = `📊 *POLL*\n\n`;
            pollMsg += `❓ *${question}*\n\n`;
            pollMsg += `*Options:*\n`;
            
            options.forEach((opt, i) => {
                pollMsg += `${numberEmojis[i]} ${opt}\n`;
            });
            
            pollMsg += `\n📝 *How to vote:*\n`;
            pollMsg += `Type /poll <number> to vote\n`;
            pollMsg += `Example: /poll 1 for option 1\n\n`;
            pollMsg += `📈 Type /poll results to see results\n`;
            pollMsg += `🔚 Admin can type /poll end to close poll`;
            
            await message.reply(pollMsg);

        } catch (error) {
            console.error('Error in poll command:', error);
            await message.reply('❌ An error occurred while creating the poll.');
        }
    },
    
    async vote(message, optionNumber) {
        try {
            const chatId = message.from;
            const poll = activePolls.get(chatId);
            
            if (!poll) {
                await message.reply('❌ No active poll in this chat. Create one with /poll');
                return;
            }
            
            if (!poll.active) {
                await message.reply('❌ This poll has ended');
                return;
            }
            
            if (optionNumber < 1 || optionNumber > poll.options.length) {
                await message.reply(`❌ Invalid option. Choose between 1 and ${poll.options.length}`);
                return;
            }
            
            const userId = message.author || message.from;
            const userName = (await message.getContact()).pushname || 'User';
            
            // Remove previous vote if exists
            poll.options.forEach(option => {
                option.votes = option.votes.filter(v => v.userId !== userId);
            });
            
            // Add new vote
            poll.options[optionNumber - 1].votes.push({
                userId,
                userName,
                timestamp: new Date()
            });
            
            await message.reply(`✅ Vote recorded for option ${optionNumber}: *${poll.options[optionNumber - 1].text}*`);
            
            // Show live results if more than 3 votes
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
            if (totalVotes >= 3 && totalVotes % 3 === 0) {
                await this.showResults(message);
            }
            
        } catch (error) {
            console.error('Error voting:', error);
            await message.reply('❌ Failed to record vote');
        }
    },
    
    async showResults(message) {
        try {
            const chatId = message.from;
            const poll = activePolls.get(chatId);
            
            if (!poll) {
                await message.reply('❌ No active poll in this chat');
                return;
            }
            
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
            
            let resultsMsg = `📊 *POLL RESULTS*\n\n`;
            resultsMsg += `❓ *${poll.question}*\n\n`;
            
            if (totalVotes === 0) {
                resultsMsg += `_No votes yet_`;
            } else {
                // Sort by votes
                const sortedOptions = [...poll.options].sort((a, b) => b.votes.length - a.votes.length);
                
                sortedOptions.forEach((opt, i) => {
                    const percentage = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
                    
                    resultsMsg += `*${opt.text}*\n`;
                    resultsMsg += `${bar} ${percentage}% (${opt.votes.length} votes)\n`;
                    
                    if (i === 0 && opt.votes.length > 0) {
                        resultsMsg += `👑 _Leading_\n`;
                    }
                    resultsMsg += '\n';
                });
                
                resultsMsg += `📊 *Total votes:* ${totalVotes}`;
            }
            
            resultsMsg += `\n\n${poll.active ? '🟢 Poll is active' : '🔴 Poll has ended'}`;
            
            await message.reply(resultsMsg);
            
        } catch (error) {
            console.error('Error showing results:', error);
            await message.reply('❌ Failed to show results');
        }
    },
    
    async endPoll(message) {
        try {
            const chatId = message.from;
            const poll = activePolls.get(chatId);
            
            if (!poll) {
                await message.reply('❌ No active poll in this chat');
                return;
            }
            
            // Check if user is admin or poll creator
            const userId = message.author || message.from;
            const helpers = require('../utils/helpers');
            const isAdmin = await helpers.isGroupAdmin(message);
            const isCreator = poll.creator === userId;
            
            if (!isAdmin && !isCreator && !helpers.isOwner(userId)) {
                await message.reply('❌ Only admins or the poll creator can end the poll');
                return;
            }
            
            poll.active = false;
            await this.showResults(message);
            
            await message.reply('🔚 *Poll has been closed!*');
            
            // Remove poll after showing final results
            setTimeout(() => {
                activePolls.delete(chatId);
            }, 60000); // Keep for 1 minute for reference
            
        } catch (error) {
            console.error('Error ending poll:', error);
            await message.reply('❌ Failed to end poll');
        }
    }
};
