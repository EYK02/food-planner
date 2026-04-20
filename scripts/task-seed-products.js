import { scraper }  from '../src/scraper.js';
import { dbHelper } from '../src/db.js';
import { logger }   from '../src/logger.js';

async function seedQueue() {
    const INDEX_URL = 'https://www.willys.se/medias/Product-en-SEK-16568801874525431602.xml';
    
    logger.info(`Starting product seed from sitemap: ${INDEX_URL}`);
    
    try {
        const urls = await scraper.getUrlsFromSitemap(INDEX_URL);
        
        if (!urls || urls.length === 0) {
            logger.warn("No URLs found in sitemap or failed to fetch.");
            return;
        }

        // Use the DAO helper transaction
        dbHelper.transaction(() => {
            const stmt = dbHelper.db.prepare('INSERT OR IGNORE INTO scrape_queue (url, priority) VALUES (?, 0)');
            for (const url of urls) {
                stmt.run(url);
            }
        })();

        logger.info(`Seeding complete. Added ${urls.length} products to queue.`);
    } catch (err) {
        logger.error(`Failed to seed products: ${err.message}`);
    }
}

seedQueue().catch(err => logger.error(`Fatal seed crash: ${err.message}`));