import fs from 'fs';
import path from 'path';
import { settings } from '../config/settings.js';

// Ensure logs directory exists
const logDir = path.resolve(path.dirname(settings.db.path), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);

const writeLog = (level, message) => {
    const timestamp = new Date().toLocaleString('sv-SE', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    });
    const entry = `[${timestamp}] [${level}] ${message}\n`;
    
    // Log to console AND file
    console.log(entry.trim());
    fs.appendFileSync(logFile, entry);
};

export const logger = {
    info: (msg) => writeLog('INFO', msg),
    warn: (msg) => writeLog('WARN', msg),
    error: (msg) => writeLog('ERROR', msg)
};