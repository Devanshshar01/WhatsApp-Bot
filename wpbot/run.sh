#!/bin/bash

echo "🚀 Starting WhatsApp Bot..."
echo "================================"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clear any old auth sessions (optional - remove if you want to keep sessions)
# rm -rf .wwebjs_auth

# Start the bot
echo "✅ Starting bot server..."
echo "📱 Scan the QR code when it appears"
echo "🌐 Webhook available at http://localhost:3000"
echo "================================"

node bot-server.js
