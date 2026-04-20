// scripts/seed_queue.js
import { scraper } from '../src/scraper.js';
import dbHelper from '../src/db.js';

const db = dbHelper.db;

async function seedQueue() {
    const INDEX_URL = 'https://www.willys.se/medias/Product-en-SEK-16568801874525431602.xml';
    
    // We now use the reusable library!
    const urls = await scraper.getUrlsFromSitemap(INDEX_URL);

    // Database coordination stays here
    const insertStmt = db.prepare('INSERT OR IGNORE INTO scrape_queue (url, priority) VALUES (?, 0)');
    const transaction = db.transaction((urls) => {
        for (const url of urls) insertStmt.run(url);
    });

    transaction(urls);
    console.log(`Seeding complete. Added ${urls.length} products to queue.`);
}

seedQueue().catch(console.error);