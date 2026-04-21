import Database from 'better-sqlite3';
import { settings } from '../config/settings.js';

// Initialize private connection
let _db = null;

const getOrOpenDb = () => {
    if (!_db) {
        _db = new Database(settings.db.path);
    }
    return _db;
};

const schema = `
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
    CREATE TABLE IF NOT EXISTS scrape_queue (
        url TEXT PRIMARY KEY, 
        status TEXT DEFAULT 'pending', 
        priority INTEGER DEFAULT 0, 
        retry_count INTEGER DEFAULT 0, 
        last_attempt TIMESTAMP, 
        last_checked TIMESTAMP
    );
`;

export const initDb = () => {
    const db = getOrOpenDb();
    db.exec(schema);

    // Seed Data if empty
    const unitCount = db.prepare('SELECT COUNT(*) as count FROM units').get().count;
    if (unitCount === 0) {
        const insertUnit = db.prepare('INSERT INTO units (name, abbreviation) VALUES (?, ?)');
        const units = [['gram', 'g'], ['milliliter', 'ml'], ['piece', 'pc']];
        units.forEach(u => insertUnit.run(u[0], u[1]));
    }

    const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get().count;
    if (storeCount === 0) {
        const addStore = db.prepare('INSERT INTO stores (name) VALUES (?)');
        addStore.run("willys");
        addStore.run("ica");
    }
};

// Auto-initialize on module load
initDb();

export const getDb = () => getOrOpenDb();

/**
 * DB Helper API
 */
export const dbHelper = {
    // Only fetch jobs that aren't marked 'failed' and haven't exceeded retry limits
    getNextJob: () => getOrOpenDb().prepare(`
        SELECT url FROM scrape_queue 
        WHERE status != 'failed' AND retry_count < 3
        ORDER BY priority DESC, last_checked ASC NULLS FIRST LIMIT 1
    `).get(),

    updateJobStatus: (url, status, priority = 0) => getOrOpenDb().prepare(`
        UPDATE scrape_queue SET status = ?, priority = ?, last_checked = CURRENT_TIMESTAMP WHERE url = ?
    `).run(status, priority, url),

    // Increment retry count and mark as 'failed' if we hit the limit
    markJobFailed: (url) => getOrOpenDb().prepare(`
        UPDATE scrape_queue 
        SET status = CASE WHEN retry_count >= 2 THEN 'failed' ELSE 'pending' END,
            retry_count = retry_count + 1, 
            last_attempt = CURRENT_TIMESTAMP 
        WHERE url = ?
    `).run(url),

    // --- Product Operations ---
    addStoreProduct: (storeId, name, sku, url) => {
        const stmt = getOrOpenDb().prepare('INSERT OR IGNORE INTO store_products (store_id, name, sku, url) VALUES (?, ?, ?, ?)');
        const info = stmt.run(storeId, name, sku, url);
        if (info.changes === 0) return getOrOpenDb().prepare('SELECT id FROM store_products WHERE sku = ?').get(sku);
        return { id: info.lastInsertRowid };
    },

    recordPrice: (productId, price) => getOrOpenDb().prepare(
        'INSERT INTO price_history (product_id, price) VALUES (?, ?)'
    ).run(productId, price),
    
    // Get helpers
    getAllStoreNames: () => getOrOpenDb().prepare('SELECT name FROM stores').all().map(s => s.name.toLowerCase()),

    // Bulk Operations
    transaction: (callback) => getOrOpenDb().transaction(callback),

    // Close connection
    close: () => {
        if (_db) {
            _db.close();
            _db = null;
        }
    }
};

export default dbHelper;