@echo off
REM WhatsApp Bot Startup Script for Windows
REM This script helps you start the bot with proper checks

echo.
echo ========================================
echo    WhatsApp Bot Startup Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js is installed
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

echo [OK] npm is installed
npm --version
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo [IMPORTANT] Please edit .env file and add your configuration!
    echo Especially set OWNER_NUMBERS to your WhatsApp number.
    echo.
    pause
)

REM Create necessary directories
echo [INFO] Creating directories...
if not exist "database" mkdir database
if not exist "media\downloads" mkdir media\downloads
if not exist "media\temp" mkdir media\temp
if not exist "media\stickers" mkdir media\stickers
if not exist "logs" mkdir logs
echo [OK] Directories created
echo.

REM Start the bot
echo ========================================
echo    Starting WhatsApp Bot...
echo ========================================
echo.
echo A QR code will appear below.
echo Scan it with WhatsApp on your phone:
echo    Settings - Linked Devices - Link a Device
echo.
echo ========================================
echo.

REM Start with node
node index.js

pause
