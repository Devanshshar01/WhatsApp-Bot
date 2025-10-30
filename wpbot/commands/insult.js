const phrases = [
    "Hey {{target}}, if brains were dynamite you couldn’t blow your nose.",
    "{{target}}, you’re like a cloud—when you disappear, the day gets brighter.",
    "I’d explain it to you, {{target}}, but I left my crayons at home.",
    "{{target}}, you have the perfect face for radio.",
    "Somewhere out there is a tree working hard to replace your CO₂, {{target}}. You should go apologize.",
    "{{target}}, if laziness were an Olympic sport, you’d take gold without even showing up.",
    "Bless your heart, {{target}}—it must be exhausting trying to be this clueless."
];

module.exports = {
    name: 'insult',
    aliases: ['roast'],
    description: 'Send a playful roast to someone',
    usage: '/insult [@mention|reply|number]',
    category: 'fun',
    cooldown: 15000,
    groupOnly: false,
    
    async execute(client, message, args) {
        try {
            const { target, mention } = await resolveTarget(client, message, args);
            const name = target;
            const phrase = phrases[Math.floor(Math.random() * phrases.length)];
            const text = phrase.replace(/{{target}}/g, name);

            if (mention) {
                await message.reply(text, undefined, { mentions: [mention] });
            } else {
                await message.reply(text);
            }
        } catch (error) {
            console.error('Error in insult command:', error);
            await message.reply('❌ Could not roast anyone right now.');
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

    const displayName = contact.pushname || contact.name || contact.number || 'buddy';
    const actorId = message.author || message.from;

    let targetName = displayName;
    if (contact.id._serialized === actorId) {
        targetName = (await message.getContact()).pushname || 'bestie';
    }

    return {
        target: targetName,
        mention: contact
    };
}
