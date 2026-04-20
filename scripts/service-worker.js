import { chromium } from 'playwright';
import dbHelper from '../src/db.js';
import { scraper } from '../src/scraper.js';
import { isAllowedTime, sleep, getStoreConfig } from '../src/utils.js';
import { logger } from '../src/logger.js';

async function runWorker(storeName = 'willys') {
    const config = getStoreConfig(storeName);
    logger.info(`Worker initialized for store: ${storeName}`);
    
    let browser = await chromium.launch({ headless: true });
    
    while (true) {
        if (!isAllowedTime(storeName)) {
            logger.info(`Outside allowed window for ${storeName}. Idling...`);
            await sleep(60000); 
            continue;
        }

        const job = dbHelper.getNextJob();

        if (!job) {
            await sleep(60000);
            continue;
        }

        logger.info(`Scraping: ${job.url}`);
        
        try {
            const productData = await scraper.scrapeProductData(job.url, browser);
            
            if (productData) {
                // Use config.id instead of hard-coded '1'
                const product = dbHelper.addStoreProduct(config.id, productData.name, job.url, job.url);
                dbHelper.recordPrice(product.id, productData.price);
                
                dbHelper.updateJobStatus(job.url, 'completed', 0);
                logger.info(`Successfully processed: ${job.url}`);
            }
        } catch (e) {
            logger.error(`Failed to scrape ${job.url}: ${e.message}`);
            dbHelper.markJobFailed(job.url);
            
            if (!browser.isConnected()) {
                logger.warn("Browser disconnected, relaunching...");
                browser = await chromium.launch({ headless: true });
            }
        }

        // Implementation of Jitter: delay ± 20%
        const jitter = config.politenessDelay * (0.8 + Math.random() * 0.4);
        await sleep(jitter);
    }
}

const storeArg = process.argv[2] || 'willys';
runWorker(storeArg).catch(err => logger.error(`Fatal crash: ${err.message}`));