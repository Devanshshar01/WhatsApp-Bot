module.exports = {
    name: 'leave',
    aliases: ['exit'],
    description: 'Make bot leave the group',
    usage: '/leave',
    groupOnly: true,
    ownerOnly: true,
    cooldown: 5000,
    
    async execute(client, message, args) {
        try {
            const chat = await message.getChat();
            
            if (!chat.isGroup) {
                await message.reply('❌ This command can only be used in groups.');
                return;
            }

            await message.reply('👋 Goodbye! Leaving the group...');
            
            // Wait a bit before leaving
            setTimeout(async () => {
                try {
                    await chat.leave();
                } catch (error) {
                    console.error('Error leaving group:', error);
                }
            }, 2000);

        } catch (error) {
            console.error('Error in leave command:', error);
            await message.reply('❌ An error occurred while leaving group.');
        }
    }
};
