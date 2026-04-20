import fs from 'fs';
import Database from 'better-sqlite3';
import settings from '../config/settings.js';

async function resetDatabase() {
    console.log("Starting database reset...");

    // 1. Delete the old database
    if (fs.existsSync(settings.dp.path)) {
        try {
            fs.unlinkSync(settings.dp.path);
            console.log('Existing database deleted.');
        } catch (err) {
            console.error('Error deleting database:', err);
            return;
        }
    } else {
        console.log('No existing database found, proceeding to initialization.');
    }

    // 2. Initialize new database
    const db = new Database(settings.dp.path);
    console.log("Database file settings.dp.path.");

    const schema = `
        -- Core Tables
        CREATE TABLE IF NOT EXISTS stores (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS units (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT NOT NULL UNIQUE, 
            abbreviation TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT NOT NULL UNIQUE, 
            is_active BOOLEAN DEFAULT 1
        );

        -- Scraping/Price Tables
        CREATE TABLE IF NOT EXISTS store_products (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            store_id INTEGER, 
            name TEXT, 
            sku TEXT UNIQUE, 
            url TEXT, 
            FOREIGN KEY (store_id) REFERENCES stores(id)
        );

        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            product_id INTEGER, 
            price REAL NOT NULL, 
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
            FOREIGN KEY (product_id) REFERENCES store_products(id)
        );

        -- Queue table
        CREATE TABLE IF NOT EXISTS scrape_queue (
            url TEXT PRIMARY KEY,
            status TEXT DEFAULT 'pending',
            priority INTEGER DEFAULT 0,
            last_attempt TIMESTAMP,
            last_checked TIMESTAMP
        );
    `;

    db.exec(schema);
    console.log("Database schema initialized.");

    // 3. Seed basic data
    const seed = db.transaction(() => {
        const insertUnit = db.prepare('INSERT INTO units (name, abbreviation) VALUES (?, ?)');
        [['gram', 'g'], ['milliliter', 'ml'], ['piece', 'pc']].forEach(u => insertUnit.run(u[0], u[1]));

        const insertStore = db.prepare('INSERT INTO stores (name) VALUES (?)');
        insertStore.run("Willy's");
    });
    
    seed();

    console.log("Basic data seeded.");
}

resetDatabase().catch(console.error);