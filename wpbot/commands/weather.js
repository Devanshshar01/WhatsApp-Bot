const axios = require('axios');

module.exports = {
    name: 'weather',
    aliases: ['w', 'temp'],
    description: 'Get current weather for a city',
    usage: '/weather <city>',
    category: 'utility',
    cooldown: 5000,
    
    async execute(client, message, args) {
        try {
            if (args.length === 0) {
                await message.reply('❌ Please provide a city name\n\n*Usage:* /weather Mumbai');
                return;
            }

            const city = args.join(' ');
            
            // Using OpenWeatherMap free API (no key needed for basic info)
            // Alternative: use wttr.in for free weather data
            const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
            
            const response = await axios.get(url);
            const data = response.data;
            
            const current = data.current_condition[0];
            const location = data.nearest_area[0];
            
            const weatherEmoji = {
                'Clear': '☀️',
                'Sunny': '☀️',
                'Partly cloudy': '⛅',
                'Cloudy': '☁️',
                'Overcast': '☁️',
                'Mist': '🌫️',
                'Fog': '🌫️',
                'Light rain': '🌦️',
                'Moderate rain': '🌧️',
                'Heavy rain': '⛈️',
                'Snow': '❄️',
                'Thunderstorm': '⛈️'
            };

            const desc = current.weatherDesc[0].value;
            const emoji = Object.keys(weatherEmoji).find(key => desc.includes(key)) 
                ? weatherEmoji[Object.keys(weatherEmoji).find(key => desc.includes(key))] 
                : '🌡️';

            let weatherText = `${emoji} *Weather in ${location.areaName[0].value}, ${location.country[0].value}*\n\n`;
            weatherText += `🌡️ *Temperature:* ${current.temp_C}°C (${current.temp_F}°F)\n`;
            weatherText += `🤔 *Feels Like:* ${current.FeelsLikeC}°C\n`;
            weatherText += `📝 *Condition:* ${desc}\n`;
            weatherText += `💨 *Wind:* ${current.windspeedKmph} km/h ${current.winddir16Point}\n`;
            weatherText += `💧 *Humidity:* ${current.humidity}%\n`;
            weatherText += `🌧️ *Precipitation:* ${current.precipMM} mm\n`;
            weatherText += `👁️ *Visibility:* ${current.visibility} km\n`;
            weatherText += `☁️ *Cloud Cover:* ${current.cloudcover}%\n`;
            weatherText += `🌅 *UV Index:* ${current.uvIndex}\n\n`;
            weatherText += `🕐 *Last Updated:* ${current.observation_time}`;

            await message.reply(weatherText);

        } catch (error) {
            console.error('Error in weather command:', error);
            if (error.response && error.response.status === 404) {
                await message.reply('❌ City not found. Please check the spelling and try again.');
            } else {
                await message.reply('❌ Unable to fetch weather data. Please try again later.');
            }
        }
    }
};
