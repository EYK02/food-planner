import { scraper }  from '../src/scraper.js';
import { dbHelper } from '../src/db.js';
import { logger }   from '../src/logger.js';

async function seedSales() {
    logger.info("Starting sales sync...");
    
    try {
        const urls = await scraper.getSalesUrls();
        
        if (!urls || urls.length === 0) {
            logger.warn("No sales URLs found. Skipping priority update.");
            return;
        }

        // Use the DAO helper transaction
        dbHelper.transaction(() => {
            // 1. Reset current priorities
            dbHelper.db.prepare('UPDATE scrape_queue SET priority = 0').run();
            
            // 2. Set new priorities
            const update = dbHelper.db.prepare('UPDATE scrape_queue SET priority = 1 WHERE url = ?');
            urls.forEach(u => update.run(u));
        })();

        logger.info(`Sales sync complete. Set priority to 1 for ${urls.length} products.`);
    } catch (err) {
        logger.error(`Failed to seed sales: ${err.message}`);
    }
}

seedSales().catch(err => logger.error(`Fatal sales seed crash: ${err.message}`));