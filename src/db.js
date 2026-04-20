import Database from 'better-sqlite3';
import config from '../config/database.js';

// 1. Initialize the connection
const db = new Database(config.dbPath);

// 2. Define the Schema
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

// 3. Ensure schema exists upon import
db.exec(schema);

// 4. Export the DB instance and helper methods
const dbHelper = {
    db,

    // Helper: Record a new price
    recordPrice: (productId, price) => {
        return db.prepare('INSERT INTO price_history (product_id, price) VALUES (?, ?)').run(productId, price);
    },

    // Helper: Add or get a store product
    addStoreProduct: (storeId, name, sku, url) => {
        const stmt = db.prepare('INSERT OR IGNORE INTO store_products (store_id, name, sku, url) VALUES (?, ?, ?, ?)');
        const info = stmt.run(storeId, name, sku, url);
        
        // If it was ignored (already exists), find the ID
        if (info.changes === 0) {
            return db.prepare('SELECT id FROM store_products WHERE sku = ?').get(sku);
        }
        return { lastInsertRowid: info.lastInsertRowid };
    }
};

export default dbHelper;