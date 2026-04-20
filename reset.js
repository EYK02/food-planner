import fs from 'fs';
import config from '../config/database.js';
const { dbPath } = config;

if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Database deleted successfully.');
} else {
    console.log('Database file not found, skipping deletion.');
}