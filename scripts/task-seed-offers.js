import { chromium } from 'playwright';
import { scraper } from '../src/scraper.js';
import dbHelper, { getDb } from '../src/db.js';
import { logger } from '../src/logger.js';

async function seedOffers(storeName) {
    logger.info(`Starting offer seed for: ${storeName}`);
    const browser = await chromium.launch({ headless: true });
    
    try {
        const urls = await scraper.getProductUrlsFromOfferPage(storeName, browser);
        
        dbHelper.transaction(() => {
            const stmt = getDb().prepare('INSERT OR IGNORE INTO scrape_queue (url, priority) VALUES (?, 1)');
            urls.forEach(url => stmt.run(url));
        })();
        
        logger.info(`Seeding complete. Added ${urls.length} products to queue for ${storeName}.`);
    } catch (err) {
        logger.error(`Failed to seed offers for ${storeName}: ${err.message}`);
    } finally {
        await browser.close();
    }
}

const storeArg = process.argv[2];
if (!storeArg) {
    logger.error("Usage: node task-seed-offers.js <storeName>");
} else {
    seedOffers(storeArg).catch(err => logger.error(`Fatal crash: ${err.message}`));
}