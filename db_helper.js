import Database from 'better-sqlite3';
import config from '../config/database.js';

const db = new Database(config.dbPath);

const dbHelper = {
    db: db,
    addIngredient: (name) => {
        return db.prepare('INSERT OR IGNORE INTO ingredients (name) VALUES (?)').run(name);
    },
    addStoreProduct: (store_id, name, sku, url) => {
        return db.prepare('INSERT OR IGNORE INTO store_products (store_id, name, sku, url) VALUES (?, ?, ?, ?)').run(store_id, name, sku, url);
    },
    recordPrice: (productId, price) => {
        return db.prepare('INSERT INTO price_history (product_id, price) VALUES (?, ?)').run(productId, price);
    },
    mapIngredient: (ingId, prodId, factor) => {
        return db.prepare('INSERT OR REPLACE INTO ingredient_mappings (ingredient_id, store_product_id, conversion_factor) VALUES (?, ?, ?)').run(ingId, prodId, factor);
    },
    getRecipeIngredients: (recipeId) => {
        const sql = `
            SELECT i.name, ri.amount, u.abbreviation 
            FROM recipe_ingredients ri
            JOIN ingredients i ON ri.ingredient_id = i.id
            JOIN units u ON ri.unit_id = u.id
            WHERE ri.recipe_id = ?
        `;
        return db.prepare(sql).all(recipeId);
    }
};

export default dbHelper;