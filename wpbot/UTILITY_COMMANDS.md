# 🛠️ Utility Commands Guide

## ✅ New Utility Commands Added

All these commands have been added to your WhatsApp bot. Just restart the bot to use them!

### 📋 Command List

1. **📍 /translate** - Language translation
2. **🌤️ /weather** - Weather information
3. **⏰ /remind** - Set reminders
4. **📊 /poll** - Create and manage polls
5. **🧮 /calc** - Calculator
6. **⏱️ /timer** - Timer & stopwatch
7. **📚 /define** - Dictionary definitions
8. **🔗 /shorturl** - URL shortener
9. **📱 /qrcode** - QR code generator
10. **💱 /currency** - Currency converter

---

## 📖 Detailed Usage

### 1. 🌐 Translate Command
```
/translate <language> <text>
/translate es Hello world
/translate hi How are you?
/translate fr Good morning
```
- Supports all major languages
- Auto-detects source language
- Uses Google Translate API

### 2. 🌤️ Weather Command
```
/weather <city>
/weather Mumbai
/weather New York
/weather London
```
- Current weather conditions
- Temperature, humidity, wind
- UV index and visibility

### 3. ⏰ Remind Command
```
/remind <time> <message>
/remind 10m Check the oven
/remind 1h Meeting with team
/remind 30m Take medicine
```
- Supports: m (minutes), h (hours), d (days)
- Maximum: 7 days
- Sends notification when time is up

### 4. 📊 Poll Command
```
/poll <question> | <option1> | <option2> | ...
/poll What's for lunch? | Pizza | Burger | Salad
/poll 1                    # Vote for option 1
/poll results              # Show results
/poll end                  # End poll (admin only)
```
- Up to 10 options
- Live results
- Visual progress bars

### 5. 🧮 Calculator Command
```
/calc <expression>
/calc 2 + 2
/calc (10 + 5) * 3
/calc sqrt(144)
/calc 2^8
```
- Basic arithmetic
- Parentheses support
- Functions: sqrt, abs, sin, cos, tan, log
- Fun facts for special numbers

### 6. ⏱️ Timer Command
```
/timer start              # Start stopwatch
/timer start 5m          # 5-minute countdown
/timer check             # Check status
/timer stop              # Stop timer
```
- Stopwatch mode
- Countdown timer
- Real-time progress

### 7. 📚 Define Command
```
/define <word>
/define serendipity
/define ephemeral
/define paradigm
```
- Multiple definitions
- Parts of speech
- Examples and usage
- Synonyms & antonyms
- Etymology/origin

### 8. 🔗 ShortURL Command
```
/shorturl <url>
/shorturl https://example.com/very/long/url
/shorturl google.com
```
- Creates short links
- Uses TinyURL service
- Shows characters saved

### 9. 📱 QR Code Command
```
/qrcode <text/url>
/qrcode https://google.com
/qrcode Hello World
/qrcode +919876543210
/qrcode WIFI:T:WPA;S:NetworkName;P:Password;;
```
- Generate QR for any text
- URLs, phone numbers, WiFi
- High-quality images
- Auto-detects content type

### 10. 💱 Currency Command
```
/currency <amount> <from> <to>
/currency 100 USD INR
/currency 50 EUR GBP
/currency 1000 JPY USD
```
- Real-time exchange rates
- All major currencies
- Shows exchange rate
- Includes trend indicators

---

## 🚀 Installation & Setup

### Install Dependencies
The bot already has axios in package.json, but if needed:
```bash
npm install axios
```

### Restart Bot
```bash
npm start
# or
node bot-server.js
```

---

## 💡 Features & Tips

### Smart Features
- **Auto-detection**: Translation detects source language
- **Progress bars**: Polls and timers show visual progress
- **Content recognition**: QR codes detect URLs, phones, WiFi
- **Error handling**: Friendly error messages
- **Rate limiting**: Commands have cooldowns to prevent spam

### Pro Tips
1. **Chain commands**: Set reminder then timer for same task
2. **Poll + Timer**: Create timed polls with countdown
3. **Translate + Define**: Learn new words in different languages
4. **Weather + Currency**: Check both when planning travel
5. **ShortURL + QRCode**: Create scannable short links

---

## 🔧 Customization

### Adding API Keys (Optional)
Some commands work better with API keys:

1. **Weather**: Can use OpenWeatherMap API
2. **Translation**: Can use Google Cloud Translation API
3. **Currency**: Can use premium exchange rate APIs

Edit in respective command files if you have premium APIs.

### Command Aliases
Each command has shortcuts:
- `/tr` = `/translate`
- `/w` = `/weather`  
- `/rem` = `/remind`
- `/calc` = `/calculate`
- `/dict` = `/define`
- `/qr` = `/qrcode`
- `/cur` = `/currency`

---

## ⚠️ Notes

1. **API Limits**: Free APIs have rate limits
2. **Cooldowns**: Commands have cooldown periods
3. **Group Only**: Poll command works in groups only
4. **Max Limits**: 
   - Reminders: 7 days max
   - QR Code: 1000 characters max
   - Polls: 10 options max

---

## 🎯 Coming Soon

Ideas for future utilities:
- `/todo` - Task management
- `/note` - Save notes
- `/search` - Web search
- `/news` - Latest news
- `/crypto` - Cryptocurrency prices
- `/stock` - Stock prices
- `/youtube` - YouTube search
- `/spotify` - Music search

---

**All commands are ready to use! Just restart your bot!** 🚀
