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

            let expression = args.join(' ');
            
            // Basic sanitization
            expression = expression.replace(/[^0-9+\-*/().\s^%]/g, '');
            expression = expression.replace(/\^/g, '**');
            
            // Add support for common functions
            expression = expression.replace(/sqrt\(/g, 'Math.sqrt(');
            expression = expression.replace(/abs\(/g, 'Math.abs(');
            expression = expression.replace(/sin\(/g, 'Math.sin(');
            expression = expression.replace(/cos\(/g, 'Math.cos(');
            expression = expression.replace(/tan\(/g, 'Math.tan(');
            expression = expression.replace(/log\(/g, 'Math.log(');
            expression = expression.replace(/pi/gi, 'Math.PI');
            
            // Evaluate expression safely
            let result;
            try {
                // Create a safe evaluation context
                const safeEval = (expr) => {
                    return Function('"use strict"; return (' + expr + ')')();
                };
                result = safeEval(expression);
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
