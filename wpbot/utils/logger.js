const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class Logger {
    constructor() {
        this.logFile = path.join(__dirname, '../logs', `bot-${moment().format('YYYY-MM-DD')}.log`);
        this.ensureLogFile();
    }

    ensureLogFile() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    writeToFile(message) {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
        const logMessage = `[${timestamp}] ${message}\n`;
        fs.appendFileSync(this.logFile, logMessage);
    }

    info(message, ...args) {
        const msg = `${message} ${args.join(' ')}`;
        console.log(chalk.blue('[INFO]'), msg);
        this.writeToFile(`[INFO] ${msg}`);
    }

    success(message, ...args) {
        const msg = `${message} ${args.join(' ')}`;
        console.log(chalk.green('[SUCCESS]'), msg);
        this.writeToFile(`[SUCCESS] ${msg}`);
    }

    warn(message, ...args) {
        const msg = `${message} ${args.join(' ')}`;
        console.log(chalk.yellow('[WARN]'), msg);
        this.writeToFile(`[WARN] ${msg}`);
    }

    error(message, ...args) {
        const msg = `${message} ${args.join(' ')}`;
        console.log(chalk.red('[ERROR]'), msg);
        this.writeToFile(`[ERROR] ${msg}`);
    }

    debug(message, ...args) {
        const msg = `${message} ${args.join(' ')}`;
        console.log(chalk.gray('[DEBUG]'), msg);
        this.writeToFile(`[DEBUG] ${msg}`);
    }

    command(user, command, chat) {
        const msg = `Command: ${command} | User: ${user} | Chat: ${chat}`;
        console.log(chalk.cyan('[COMMAND]'), msg);
        this.writeToFile(`[COMMAND] ${msg}`);
    }

    logMessage(message) {
        const from = message.from || 'Unknown';
        const body = message.body || '[Media/No Text]';
        const msg = `Message from ${from}: ${body.substring(0, 100)}`;
        this.writeToFile(`[MESSAGE] ${msg}`);
    }
}

module.exports = new Logger();
