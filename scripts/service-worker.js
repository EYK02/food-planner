import { chromium } from 'playwright';
import dbHelper from '../src/db.js';
import { scraper } from '../src/scraper.js';
import { isAllowedTime, sleep } from '../src/utils.js';

async function runWorker() {
    console.log("Worker started. Waiting for jobs...");
    
    let browser = await chromium.launch({ headless: true });
    
    while (true) {
        if (!isAllowedTime()) {
            console.log("Outside allowed window. Pausing worker...");
            await sleep(60000); 
            continue;
        }

        // Use the DAO helper method
        const job = dbHelper.getNextJob();

        if (!job) {
            await sleep(60000);
            continue;
        }

        console.log(`Scraping: ${job.url}`);
        
        try {
            const productData = await scraper.scrapeProductData(job.url, browser);
            
            if (productData) {
                // Use the DAO helper methods
                const product = dbHelper.addStoreProduct(1, productData.name, job.url, job.url);
                dbHelper.recordPrice(product.id, productData.price);
                
                // Use the DAO helper method instead of raw SQL
                dbHelper.updateJobStatus(job.url, 'completed', 0);
            }
        } catch (e) {
            console.error(`Failed to scrape ${job.url}:`, e.message);
            // Use the DAO helper method instead of raw SQL
            dbHelper.markJobFailed(job.url);
            
            if (!browser.isConnected()) {
                console.log("Browser disconnected, relaunching...");
                browser = await chromium.launch({ headless: true });
            }
        }

        await sleep(10000);
    }
}

runWorker().catch(console.error);