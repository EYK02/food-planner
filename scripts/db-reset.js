import fs                  from 'fs';
import { settings }             from '../config/settings.js'; // Ensure correct import
import { logger }               from '../src/logger.js';
import dbHelper, { initDb } from '../src/db.js';
import { get } from 'http';

async function resetDatabase() {
    logger.info("Starting database reset...");

    // 1. Delete the old database
    dbHelper.close();
    logger.info("Database connection closed.");

    if (fs.existsSync(settings.db.path)) {
        try {
            fs.unlinkSync(settings.db.path);
            logger.info('Existing database deleted.');
        } catch (err) {
            logger.error(`Error deleting database: ${err.message}`);
            return;
        }
    } else {
        logger.info('No existing database found, proceeding to initialization.');
    }

    // 2. Initialize database
    initDb();
    logger.info("Database schema initialized.");
}

resetDatabase().catch(err => logger.error(`Fatal reset error: ${err.message}`));