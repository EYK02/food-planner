import Database from 'better-sqlite3';
import config from '../config/database.js';
const db = new Database(config.dbPath);

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

CREATE TABLE IF NOT EXISTS nutrition_info (
    ingredient_id INTEGER PRIMARY KEY, 
    calories REAL, 
    protein_g REAL, 
    fat_g REAL, 
    carbs_g REAL, 
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    );

-- Recipe Tables
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT NOT NULL, 
    instructions TEXT, 
    prep_time_minutes INTEGER
    );

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    recipe_id INTEGER, 
    ingredient_id INTEGER, 
    amount REAL, 
    unit_id INTEGER, 

    FOREIGN KEY (recipe_id) REFERENCES recipes(id), 
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id), 
    FOREIGN KEY (unit_id) REFERENCES units(id)
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

-- Bridge Table (Crucial for linking ingredients to store items)
CREATE TABLE IF NOT EXISTS ingredient_mappings (
    ingredient_id INTEGER,
    store_product_id INTEGER,
    conversion_factor REAL DEFAULT 1.0,

    PRIMARY KEY (ingredient_id, store_product_id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
    FOREIGN KEY (store_product_id) REFERENCES store_products(id)
);

-- Queue table for scraping
CREATE TABLE IF NOT EXISTS scrape_queue (
    url TEXT PRIMARY KEY,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed',
    priority INTEGER DEFAULT 0,
    last_attempt TIMESTAMP,
    last_checked TIMESTAMP
);

`;

db.exec(schema);
console.log("Database schema initialized.");
