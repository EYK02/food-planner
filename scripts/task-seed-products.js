import { scraper } from '../src/scraper.js';
import dbHelper from '../src/db.js';
import { logger } from '../src/logger.js';

async function seedQueue(storeName = 'willys') { 
    logger.info(`Starting product seed for: ${storeName}`);
    
    try {
        const urls = await scraper.getUrlsFromSitemap(storeName);
        
        if (!urls || urls.length === 0) {
            logger.warn(`No URLs found in sitemap for ${storeName} or failed to fetch.`);
            return;
        }

        // Use the DAO helper transaction
        dbHelper.transaction(() => {
            const stmt = dbHelper.db.prepare('INSERT OR IGNORE INTO scrape_queue (url, priority) VALUES (?, 0)');
            for (const url of urls) {
                stmt.run(url);
            }
        })();

        logger.info(`Seeding complete. Added ${urls.length} products for ${storeName} to queue.`);
    } catch (err) {
        logger.error(`Failed to seed products for ${storeName}: ${err.message}`);
    }
}

// Support command line argument, e.g., node task-seed-products.js ica
const storeArg = process.argv[2] || 'willys';
seedQueue(storeArg).catch(err => logger.error(`Fatal seed crash: ${err.message}`));