#!/bin/bash

# WhatsApp Bot Startup Script
# This script helps you start the bot with proper checks

echo "🤖 WhatsApp Bot Startup Script"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies!"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file and add your configuration!"
    echo "Especially set OWNER_NUMBERS to your WhatsApp number."
    echo ""
    read -p "Press Enter after editing .env file..."
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p database
mkdir -p media/downloads
mkdir -p media/temp
mkdir -p media/stickers
mkdir -p logs
echo "✅ Directories created"
echo ""

# Start the bot
echo "🚀 Starting WhatsApp Bot..."
echo "================================"
echo ""
echo "📱 A QR code will appear below."
echo "Scan it with WhatsApp on your phone:"
echo "   Settings → Linked Devices → Link a Device"
echo ""
echo "================================"
echo ""

# Start with node
node index.js
