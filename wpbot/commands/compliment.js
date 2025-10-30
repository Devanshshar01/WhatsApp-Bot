const compliments = [
    "{{target}}, your smile could light up the whole group chat.",
    "If kindness were a currency, {{target}} would be the richest person here.",
    "{{target}}, you’re proof that the best things in life aren’t things.",
    "Every conversation gets better when {{target}} joins in.",
    "{{target}}, you’re the glitter in a world full of glue.",
    "There’s ordinary, there’s extraordinary, and then there’s {{target}}.",
    "{{target}}, your energy is the kind we all need more of."
];

module.exports = {
    name: 'compliment',
    aliases: ['praise'],
    description: 'Send a wholesome compliment to someone',
    usage: '/compliment [@mention|reply|number]',
    category: 'fun',
    cooldown: 10000,
    
    async execute(client, message, args) {
        try {
            const { target, mention } = await resolveTarget(client, message, args);
            const phrase = compliments[Math.floor(Math.random() * compliments.length)];
            const text = phrase.replace(/{{target}}/g, target);

            if (mention) {
                await message.reply(text, undefined, { mentions: [mention] });
            } else {
                await message.reply(text);
            }
        } catch (error) {
            console.error('Error in compliment command:', error);
            await message.reply('❌ Could not send a compliment right now.');
        }
    }
};

async function resolveTarget(client, message, args) {
    let contact;

    if (message.hasQuotedMsg) {
        const quoted = await message.getQuotedMessage();
        contact = await quoted.getContact();
    } else if (message.mentionedIds && message.mentionedIds.length > 0) {
        contact = await client.getContactById(message.mentionedIds[0]);
    } else if (args.length > 0) {
        const cleaned = args[0].replace(/[^0-9]/g, '');
        if (cleaned.length >= 8) {
            const id = cleaned.endsWith('@c.us') || cleaned.endsWith('@lid') ? cleaned : `${cleaned}@c.us`;
            try {
                contact = await client.getContactById(id);
            } catch (err) {
                console.warn('Unable to resolve contact from argument', err);
            }
        }
    }

    if (!contact) {
        contact = await message.getContact();
    }

    const name = contact.pushname || contact.name || contact.number || 'friend';

    return {
        target: name,
        mention: contact
    };
}
