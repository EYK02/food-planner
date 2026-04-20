import { chromium }                 from 'playwright';
import { dbHelper }                 from '../src/db.js';
import { scraper }                  from '../src/scraper.js';
import { isAllowedTime, sleep }     from '../src/utils.js';
import { logger }                   from '../src/logger.js';

async function runWorker() {
    logger.info("Worker started. Waiting for jobs...");
    
    let browser = await chromium.launch({ headless: true });
    
    while (true) {
        if (!isAllowedTime()) {
            // Log as info to avoid filling logs with constant idle messages
            // Alternatively, comment this out if you prefer silent idling
            logger.info("Outside allowed scraping window. Pausing worker...");
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
                const product = dbHelper.addStoreProduct(1, productData.name, job.url, job.url);
                dbHelper.recordPrice(product.id, productData.price);
                
                dbHelper.updateJobStatus(job.url, 'completed', 0);
                logger.info(`Successfully completed job: ${job.url}`);
            }
        } catch (e) {
            logger.error(`Failed to scrape ${job.url}: ${e.message}`);
            dbHelper.markJobFailed(job.url);
            
            if (!browser.isConnected()) {
                logger.warn("Browser disconnected, relaunching...");
                browser = await chromium.launch({ headless: true });
            }
        }

        await sleep(10000); // Politeness delay
    }
}

// Ensure even fatal unhandled errors are logged
runWorker().catch(err => logger.error(`Fatal worker crash: ${err.message}`));