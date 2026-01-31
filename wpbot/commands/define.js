const axios = require('axios');

module.exports = {
    name: 'define',
    aliases: ['dict', 'dictionary', 'meaning'],
    description: 'Get word definition from dictionary',
    usage: '/define <word>',
    category: 'utility',
    cooldown: 3000,
    
    async execute(client, message, args) {
        try {
            if (args.length === 0) {
                await message.reply('❌ Please provide a word to define\n\n*Usage:* /define serendipity');
                return;
            }

            const word = args[0].toLowerCase();

            // Validate word length (dictionary words are typically short)
            if (word.length > 50) {
                await message.reply('❌ Word too long. Please enter a valid word.');
                return;
            }

            // Validate word format (letters only)
            if (!/^[a-z]+$/i.test(word)) {
                await message.reply('❌ Please enter a valid English word (letters only).');
                return;
            }

            // Using Free Dictionary API
            const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
            
            const response = await axios.get(url);
            const data = response.data[0];
            
            let definitionText = `📚 *Dictionary: ${word.charAt(0).toUpperCase() + word.slice(1)}*\n\n`;
            
            // Phonetics
            if (data.phonetic) {
                definitionText += `🔊 *Pronunciation:* ${data.phonetic}\n\n`;
            }
            
            // Meanings by part of speech
            data.meanings.forEach((meaning, index) => {
                definitionText += `*${meaning.partOfSpeech.toUpperCase()}*\n`;
                
                // Take first 3 definitions for each part of speech
                meaning.definitions.slice(0, 3).forEach((def, i) => {
                    definitionText += `${i + 1}. ${def.definition}\n`;
                    if (def.example) {
                        definitionText += `   _Example: "${def.example}"_\n`;
                    }
                });
                
                // Synonyms
                if (meaning.synonyms && meaning.synonyms.length > 0) {
                    definitionText += `   *Synonyms:* ${meaning.synonyms.slice(0, 5).join(', ')}\n`;
                }
                
                // Antonyms  
                if (meaning.antonyms && meaning.antonyms.length > 0) {
                    definitionText += `   *Antonyms:* ${meaning.antonyms.slice(0, 5).join(', ')}\n`;
                }
                
                definitionText += '\n';
            });
            
            // Origin/Etymology if available
            if (data.origin) {
                definitionText += `📖 *Origin:* ${data.origin}\n`;
            }
            
            await message.reply(definitionText);

        } catch (error) {
            console.error('Error in define command:', error);
            if (error.response && error.response.status === 404) {
                // Try to suggest similar words
                const word = args[0];
                let suggestions = `❌ Word "${word}" not found in dictionary.\n\n`;
                suggestions += `💡 *Suggestions:*\n`;
                suggestions += `• Check spelling\n`;
                suggestions += `• Try singular/plural form\n`;
                suggestions += `• Use base form of verb\n\n`;
                suggestions += `Example: /define happy`;
                
                await message.reply(suggestions);
            } else {
                await message.reply('❌ Unable to fetch definition. Please try again later.');
            }
        }
    }
};
