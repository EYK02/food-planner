import { fs }                   from 'fs';
import { Database }             from 'better-sqlite3';
import { settings }             from '../config/settings.js'; // Ensure correct import
import { logger }               from '../src/logger.js';
import dbHelper, { initDb, db } from '../src/db.js';

async function resetDatabase() {
    logger.info("Starting database reset...");

    // 1. Delete the old database
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

    // 3. Seed basic data
    const seed = db.transaction(() => {
        const insertUnit = db.prepare('INSERT INTO units (name, abbreviation) VALUES (?, ?)');
        [['gram', 'g'], ['milliliter', 'ml'], ['piece', 'pc']].forEach(u => insertUnit.run(u[0], u[1]));

        const insertStore = db.prepare('INSERT INTO stores (name) VALUES (?)');
        insertStore.run("Willy's");
    });
    
    try {
        seed();
        logger.info("Basic data seeded successfully.");
    } catch (err) {
        logger.error(`Failed to seed data: ${err.message}`);
    }
}

resetDatabase().catch(err => logger.error(`Fatal reset error: ${err.message}`));