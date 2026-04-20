import { fs }           from 'fs';
import { Database }     from 'better-sqlite3';
import { settings }     from '../config/settings.js'; // Ensure correct import
import { logger }       from '../src/logger.js';

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

    // 2. Initialize new database
    const db = new Database(settings.db.path);
    logger.info(`Database file created at ${settings.db.path}`);

    const schema = `
        CREATE TABLE IF NOT EXISTS stores (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
        CREATE TABLE IF NOT EXISTS units (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, abbreviation TEXT NOT NULL UNIQUE);
        CREATE TABLE IF NOT EXISTS ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, is_active BOOLEAN DEFAULT 1);
        CREATE TABLE IF NOT EXISTS store_products (id INTEGER PRIMARY KEY AUTOINCREMENT, store_id INTEGER, name TEXT, sku TEXT UNIQUE, url TEXT, FOREIGN KEY (store_id) REFERENCES stores(id));
        CREATE TABLE IF NOT EXISTS price_history (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, price REAL NOT NULL, recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES store_products(id));
        CREATE TABLE IF NOT EXISTS scrape_queue (url TEXT PRIMARY KEY, status TEXT DEFAULT 'pending', priority INTEGER DEFAULT 0, last_attempt TIMESTAMP, last_checked TIMESTAMP);
    `;

    db.exec(schema);
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