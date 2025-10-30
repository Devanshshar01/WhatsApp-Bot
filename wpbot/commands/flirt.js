const pickupLines = [
    "Is this chat a botanical garden? Because every time you speak, things bloom, {{target}}.",
    "{{target}}, are you a magician? Because whenever you pop up, everyone else disappears.",
    "If kisses were snowflakes, I'd send you a blizzard, {{target}}.",
    "Do you have a map, {{target}}? Because I just got lost in this conversation.",
    "{{target}}, if being gorgeous were a crime, you'd be serving a life sentence.",
    "Are we Wi-Fi, {{target}}? Because I'm feeling a strong connection.",
    "Do you believe in love at first ping, or should I send /flirt again, {{target}}?",
    "{{target}}, are you a parking ticket? Because you've got FINE written all over you.",
    "Is your name Google? Because you have everything I've been searching for, {{target}}.",
    "{{target}}, do you have a Band-Aid? I just scraped my knee falling for you.",
    "Are you a camera? Every time I look at you, I smile, {{target}}.",
    "{{target}}, if you were a vegetable, you'd be a cute-cumber.",
    "Do you have a sunburn, or are you always this hot, {{target}}?",
    "{{target}}, are you French? Because Eiffel for you.",
    "Is your dad a boxer? Because you're a knockout, {{target}}.",
    "{{target}}, I must be a snowflake because I've fallen for you.",
    "Are you a loan? Because you've got my interest, {{target}}.",
    "{{target}}, do you have a name, or can I call you mine?",
    "If beauty were time, you'd be an eternity, {{target}}.",
    "{{target}}, are you a campfire? Because you're hot and I want s'more.",
    "Is there an airport nearby, or is that just my heart taking off seeing you, {{target}}?",
    "{{target}}, are you a time traveler? Because I see you in my future.",
    "Do you play soccer? Because you're a keeper, {{target}}.",
    "{{target}}, are you a beaver? Because daaaaam.",
    "If I could rearrange the alphabet, I'd put U and I together, {{target}}.",
    "{{target}}, are you made of copper and tellurium? Because you're Cu-Te.",
    "Is your body from McDonald's? Because I'm lovin' it, {{target}}.",
    "{{target}}, are you a dictionary? Because you add meaning to my life.",
    "Do you have a pencil? Because I want to erase your past and write our future, {{target}}.",
    "{{target}}, are you religious? Because you're the answer to all my prayers.",
    "If looks could kill, you'd be a weapon of mass destruction, {{target}}.",
    "{{target}}, are you a magician? Because whenever I look at you, everyone else disappears.",
    "Can I follow you home? Because my parents always told me to follow my dreams, {{target}}.",
    "{{target}}, do you believe in fate? Because I think we've just had a meet-cute.",
    "Are you a light bulb? Because you brighten up my day, {{target}}.",
    "{{target}}, is your name Chapstick? Because you're da balm.",
    "Are you a volcano? Because I lava you, {{target}}.",
    "{{target}}, if you were a fruit, you'd be a fineapple.",
    "Do you have a mirror in your pocket? Because I can see myself in your pants, {{target}}.",
    "{{target}}, are you a thief? Because you just stole my heart.",
    "Is it hot in here, or is it just you, {{target}}?",
    "{{target}}, are you an electrician? Because you're lighting up my life.",
    "Do you have a quarter? Because I want to call my mom and tell her I met the one, {{target}}.",
    "{{target}}, are you a star? Because your beauty lights up the night.",
    "If I had a star for every time you brightened my day, I'd have a galaxy, {{target}}.",
    "{{target}}, are you a bank loan? Because you've got my interest.",
    "Do you know CPR? Because you just took my breath away, {{target}}.",
    "{{target}}, are you a keyboard? Because you're just my type.",
    "Is your dad an artist? Because you're a masterpiece, {{target}}.",
    "{{target}}, are you Netflix? Because I could watch you for hours.",
    "Do you like Star Wars? Because Yoda one for me, {{target}}.",
    "{{target}}, are you a charger? Because I'm dying without you.",
    "If you were a triangle, you'd be acute one, {{target}}.",
    "{{target}}, are you a cat? Because you're purrfect.",
    "Do you have a map? I keep getting lost in your eyes, {{target}}.",
    "{{target}}, are you a baker? Because you've got some nice buns.",
    "Is your name Ariel? Because we mermaid for each other, {{target}}.",
    "{{target}}, are you a tower? Because Eiffel for you.",
    "Do you have a license? Because you're driving me crazy, {{target}}.",
    "{{target}}, are you a candle? Because you light up my world.",
    "If you were a booger, I'd pick you first, {{target}}.",
    "{{target}}, are you a magician? Because abracadabra, you're gorgeous.",
    "Do you have Instagram? Because I want to follow you everywhere, {{target}}.",
    "{{target}}, are you a flower? Because I'm falling for you petal by petal.",
    "Is your name Wifi? Because I'm really feeling a connection, {{target}}.",
    "{{target}}, are you a campfire? Because you're smoking hot.",
    "Do you have a Band-Aid? Because I just hurt myself falling for you, {{target}}.",
    "{{target}}, are you a ninja? Because you snuck into my heart.",
    "If you were a song, you'd be the best track on the album, {{target}}.",
    "{{target}}, are you a sunset? Because you're breathtaking.",
    "Do you have a twin? Because you're twice as beautiful, {{target}}.",
    "{{target}}, are you a dream? Because I never want to wake up.",
    "Is your aura made of stars? Because you're out of this world, {{target}}.",
    "{{target}}, are you a library book? Because I'm checking you out.",
    "Do you have a compass? Because I just found my true north, {{target}}.",
    "{{target}}, are you a firework? Because you light up my sky.",
    "If you were a dessert, you'd be a sweet tart, {{target}}.",
    "{{target}}, are you a puzzle? Because I'm lost without you.",
    "Do you have a flashlight? Because you light up my darkest days, {{target}}.",
    "{{target}}, are you a rainbow? Because you color my world.",
    "Is your smile trademarked? Because it's one of a kind, {{target}}.",
    "{{target}}, are you a comet? Because you're rare and stunning.",
    "Do you have a GPS? Because I'm getting lost in your eyes, {{target}}.",
    "{{target}}, are you a diamond? Because you're precious and rare.",
    "If you were a season, you'd be summer—hot and unforgettable, {{target}}.",
    "{{target}}, are you a melody? Because you're stuck in my head.",
    "Do you have a secret? Because you're mysteriously attractive, {{target}}.",
    "{{target}}, are you a sunrise? Because you make everything better.",
    "If I could hold you for a second, I'd hold you forever, {{target}}.",
    "{{target}}, are you a treasure? Because X marks the spot.",
    "Do you have a favorite song? Because you're music to my ears, {{target}}.",
    "{{target}}, are you a work of art? Because I can't stop staring.",
    "Is your heart a garden? Because I'd love to plant a kiss there, {{target}}.",
    "{{target}}, are you a shooting star? Because I'd make a wish on you.",
    "Do you have a favorite color? Because mine just became you, {{target}}.",
    "{{target}}, are you a poem? Because you're beautifully written.",
    "If you were a spice, you'd be fine-amon, {{target}}.",
    "{{target}}, are you gravity? Because I'm falling for you hard.",
    "Do you have a favorite movie? Because you're the star of mine, {{target}}.",
    "{{target}}, are you a constellation? Because you're written in the stars.",
    "If you were a drink, you'd be a fine wine, {{target}}."
];

module.exports = {
    name: 'flirt',
    aliases: ['pickup', 'pickup line', 'pickup-line'],
    description: 'Drop a flirty pickup line',
    usage: '/flirt [@mention|reply|number]',
    category: 'fun',
    cooldown: 20000,
    
    async execute(client, message, args) {
        try {
            const { target, mention } = await resolveTarget(client, message, args);
            const phrase = pickupLines[Math.floor(Math.random() * pickupLines.length)];
            const text = phrase.replace(/{{target}}/g, target);

            if (mention) {
                await message.reply(text, undefined, { mentions: [mention] });
            } else {
                await message.reply(text);
            }
        } catch (error) {
            console.error('Error in flirt command:', error);
            await message.reply('❌ Could not drop a pickup line right now.');
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
        const cleaned = args.join('').replace(/[^0-9]/g, '');
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

    const name = contact.pushname || contact.name || contact.number || 'you';

    return {
        target: name,
        mention: contact
    };
}
