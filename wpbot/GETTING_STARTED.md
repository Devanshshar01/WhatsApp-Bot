# WhatsApp Bot – Quick Start

Follow these steps after cloning the repository.

## 1. Install Dependencies
```bash
cd wpbot
npm install
```

## 2. Configure Environment Variables
Copy the example file and update values as needed.
```bash
cp .env.example .env
# then edit .env
```

Key variables:
- `BOT_NAME`, `PREFIX`, `OWNER_NUMBERS`
- `ENABLE_WELCOME_MESSAGES`, `ENABLE_GOODBYE_MESSAGES`
- `ADMIN_PASSWORD`, `ADMIN_PORT`

## 3. Start the Admin Panel (optional)
```bash
npm run admin:dev --prefix wpbot
```
Runs the dashboard on http://localhost:5173 (proxies API to port 4000).

## 4. Start the Bot
```bash
npm start
```
Scan the QR code with a different WhatsApp account than the one running the bot.

## 5. Useful Commands
```bash
npm run admin:build    # Production build of the admin panel
npm run admin:preview  # Preview built admin panel
npm run dev            # Bot with auto-reload (if nodemon installed)
```

## 6. Deployment Notes
- Ensure `.wwebjs_auth` is persisted to keep the session active.
- Set environment variables securely in production environments.
- Use a process manager (e.g., PM2) to keep the bot running.
