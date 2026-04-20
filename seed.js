import Database from 'better-sqlite3';
import config from '../config/database.js';

const conn = new Database(config.dbPath);

// Populate Units
const insertUnit = conn.prepare('INSERT OR IGNORE INTO units (name, abbreviation) VALUES (?, ?)');
const units = [['gram', 'g'], ['milliliter', 'ml'], ['piece', 'pc']];
units.forEach(u => insertUnit.run(u[0], u[1]));

// Populate Stores
const insertStore = conn.prepare('INSERT OR IGNORE INTO stores (name) VALUES (?)');
insertStore.run("Willy's");

console.log("Database seeded with units and stores.");