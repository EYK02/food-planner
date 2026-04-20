import Database from 'better-sqlite3';
import { settings } from '../config/settings.js';

// Initialize private connection
export const db = new Database(settings.db.path);

const schema = `
    CREATE TABLE IF NOT EXISTS stores (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS units (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, abbreviation TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, is_active BOOLEAN DEFAULT 1);
    CREATE TABLE IF NOT EXISTS store_products (id INTEGER PRIMARY KEY AUTOINCREMENT, store_id INTEGER, name TEXT, sku TEXT UNIQUE, url TEXT, FOREIGN KEY (store_id) REFERENCES stores(id));
    CREATE TABLE IF NOT EXISTS price_history (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, price REAL NOT NULL, recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES store_products(id));
    CREATE TABLE IF NOT EXISTS scrape_queue (url TEXT PRIMARY KEY, status TEXT DEFAULT 'pending', priority INTEGER DEFAULT 0, last_attempt TIMESTAMP, last_checked TIMESTAMP);
`;
export const initDb = () => {
    db.exec(schema)
};

initDb

/**
 * DB Helper API
 */
const dbHelper = {
    // --- Scrape Queue Operations ---
    getNextJob: () => db.prepare(`
        SELECT url FROM scrape_queue 
        ORDER BY priority DESC, last_checked ASC NULLS FIRST LIMIT 1
    `).get(),

    updateJobStatus: (url, status, priority = 0) => db.prepare(`
        UPDATE scrape_queue SET status = ?, priority = ?, last_checked = CURRENT_TIMESTAMP WHERE url = ?
    `).run(status, priority, url),

    markJobFailed: (url) => db.prepare(`
        UPDATE scrape_queue SET status = 'failed', last_attempt = CURRENT_TIMESTAMP WHERE url = ?
    `).run(url),

    // --- Product Operations ---
    addStoreProduct: (storeId, name, sku, url) => {
        const stmt = db.prepare('INSERT OR IGNORE INTO store_products (store_id, name, sku, url) VALUES (?, ?, ?, ?)');
        const info = stmt.run(storeId, name, sku, url);
        if (info.changes === 0) return db.prepare('SELECT id FROM store_products WHERE sku = ?').get(sku);
        return { id: info.lastInsertRowid };
    },

    recordPrice: (productId, price) => db.prepare(
        'INSERT INTO price_history (product_id, price) VALUES (?, ?)'
    ).run(productId, price),
    
    // --- Bulk Operations (for seeds) ---
    transaction: (callback) => db.transaction(callback)
};

export default dbHelper;