const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.currentDate = this.getCurrentDate();
        this.logFile = this.buildLogFilePath(this.currentDate);
        this.ensureLogFile();
    }

    getCurrentDate() {
        return moment().format('YYYY-MM-DD');
    }

    buildLogFilePath(date) {
        return path.join(this.logDir, `bot-${date}.log`);
    }

    ensureLogFile() {
        fs.ensureDirSync(this.logDir);
        fs.ensureFileSync(this.logFile);
    }

    refreshLogFile() {
        const today = this.getCurrentDate();
        if (today !== this.currentDate) {
            this.currentDate = today;
            this.logFile = this.buildLogFilePath(today);
            this.ensureLogFile();
        }
    }

    writeToFile(message) {
        this.refreshLogFile();
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

    getLogFilePath() {
        this.refreshLogFile();
        return this.logFile;
    }

    getLatestLogLines(limit = 200) {
        try {
            const filePath = this.getLogFilePath();
            if (!fs.existsSync(filePath)) {
                return [];
            }

            const fileContent = fs.readFileSync(filePath, 'utf8');
            const lines = fileContent.split(/\r?\n/).filter(Boolean);
            return lines.slice(-limit);
        } catch (error) {
            console.error('[LOGGER] Failed to read log file:', error);
            return [];
        }
    }
}

module.exports = new Logger();
