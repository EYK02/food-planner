import { chromium } from 'playwright';
import dbHelper from '../src/db.js';
import { scraper } from '../src/scraper.js'; // Ensure you import the scraper object
import { isAllowedTime, sleep } from '../src/utils.js';

const { db } = dbHelper;

async function runWorker() {
    console.log("Worker started. Waiting for jobs...");
    
    // We launch the browser outside the loop for efficiency
    let browser = await chromium.launch({ headless: true });
    
    while (true) {
        if (!isAllowedTime()) {
            console.log("Outside allowed window. Pausing worker...");
            await sleep(60000); // Sleep 1 min
            continue;
        }

        const job = db.prepare(`
            SELECT url FROM scrape_queue 
            ORDER BY priority DESC, last_checked ASC NULLS FIRST 
            LIMIT 1
        `).get();

        if (!job) {
            await sleep(60000);
            continue;
        }

        console.log(`Scraping: ${job.url}`);
        
        try {
            // Using the centralized scraper engine
            const productData = await scraper.scrapeProductData(job.url, browser);
            
            if (productData) {
                const product = dbHelper.addStoreProduct(1, productData.name, job.url, job.url);
                dbHelper.recordPrice(product.lastInsertRowid, productData.price);
                
                db.prepare(`
                    UPDATE scrape_queue 
                    SET status = 'completed', priority = 0, last_checked = CURRENT_TIMESTAMP 
                    WHERE url = ?
                `).run(job.url);
            }
        } catch (e) {
            console.error(`Failed to scrape ${job.url}:`, e.message);
            db.prepare("UPDATE scrape_queue SET status = 'failed', last_attempt = CURRENT_TIMESTAMP WHERE url = ?").run(job.url);
            
            // If the browser crashes, restart it
            if (!browser.isConnected()) {
                console.log("Browser disconnected, relaunching...");
                browser = await chromium.launch({ headless: true });
            }
        }

        await sleep(10000); // Politeness delay
    }
}

runWorker().catch(console.error);