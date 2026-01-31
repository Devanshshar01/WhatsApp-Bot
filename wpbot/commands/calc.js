const { Parser } = require('expr-eval');

// Create a safe math parser instance
const parser = new Parser({
    operators: {
        // Enable safe math operators only
        add: true, subtract: true, multiply: true, divide: true,
        power: true, factorial: true, remainder: true,
        // Disable potentially dangerous operators
        logical: false, comparison: false, 'in': false, assignment: false
    }
});

module.exports = {
    name: 'calc',
    aliases: ['calculate', 'math'],
    description: 'Calculate mathematical expressions',
    usage: '/calc <expression>',
    category: 'utility',
    cooldown: 2000,
    
    async execute(client, message, args) {
        try {
            if (args.length === 0) {
                const helpText = `🧮 *Calculator Command*\n\n` +
                    `*Usage:* /calc <expression>\n\n` +
                    `*Supported Operations:*\n` +
                    `• Addition: +\n` +
                    `• Subtraction: -\n` +
                    `• Multiplication: *\n` +
                    `• Division: /\n` +
                    `• Parentheses: ( )\n` +
                    `• Power: ^ or **\n` +
                    `• Modulo: %\n` +
                    `• Square root: sqrt()\n` +
                    `• Absolute: abs()\n\n` +
                    `*Examples:*\n` +
                    `• /calc 2 + 2\n` +
                    `• /calc (10 + 5) * 3\n` +
                    `• /calc 2^8\n` +
                    `• /calc sqrt(144)\n` +
                    `• /calc 100 / 5 + 10`;
                await message.reply(helpText);
                return;
            }

            const expression = args.join(' ');
            
            // Limit expression length to prevent abuse
            if (expression.length > 200) {
                await message.reply('❌ Expression too long. Maximum 200 characters.');
                return;
            }
            
            // Evaluate expression safely using expr-eval
            let result;
            try {
                result = parser.evaluate(expression);
            } catch (evalError) {
                await message.reply('❌ Invalid mathematical expression');
                return;
            }
            
            // Format result
            if (typeof result !== 'number' || isNaN(result)) {
                await message.reply('❌ Could not calculate the result');
                return;
            }
            
            // Round if needed
            if (result % 1 !== 0) {
                result = Math.round(result * 1000000) / 1000000;
            }

            let replyText = `🧮 *Calculator Result*\n\n`;
            replyText += `*Expression:* ${args.join(' ')}\n`;
            replyText += `*Result:* ${result.toLocaleString()}`;
            
            // Add fun facts for certain results
            const funFacts = {
                '42': '\n\n💫 _Fun fact: 42 is the answer to life, universe, and everything!_',
                '69': '\n\n😏 _Nice!_',
                '420': '\n\n🌿 _Blaze it!_',
                '1337': '\n\n💻 _L33T!_',
                '404': '\n\n🔍 _Result not found... just kidding!_',
                '3.14159': '\n\n🥧 _That\'s π (pi)!_',
                '2.71828': '\n\n📊 _That\'s e (Euler\'s number)!_'
            };
            
            const resultStr = result.toString();
            if (funFacts[resultStr] || (resultStr.startsWith('3.14') && resultStr.length > 3)) {
                replyText += funFacts[resultStr] || funFacts['3.14159'];
            }

            await message.reply(replyText);

        } catch (error) {
            console.error('Error in calc command:', error);
            await message.reply('❌ An error occurred while calculating.');
        }
    }
};
