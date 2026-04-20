import { chromium } from 'playwright';
import dbHelper from '../src/db.js';
import { scrapeUrl } from '../src/scraper.js';

const { db } = dbHelper;

async function runWorker() {
    console.log("Worker started. Waiting for jobs...");
    const browser = await chromium.launch({ headless: true });
    
    while (true) {
        // 1. Pick highest priority (Sales) first, then oldest last_checked
        const job = db.prepare(`
            SELECT url FROM scrape_queue 
            ORDER BY priority DESC, last_checked ASC NULLS FIRST 
            LIMIT 1
        `).get();

        if (!job) {
            console.log("Queue empty. Sleeping for 60 seconds...");
            await new Promise(r => setTimeout(r, 60000));
            continue;
        }

        console.log(`Scraping priority job: ${job.url}`);
        
        try {
            // Use the centralized scraper
            const productData = await scrapeUrl(job.url, browser);
            
            if (productData) {
                // Record results using our unified db helper
                const product = dbHelper.addStoreProduct(1, productData.name, job.url, job.url);
                dbHelper.recordPrice(product.lastInsertRowid, productData.price);
                
                // Mark success
                db.prepare(`
                    UPDATE scrape_queue 
                    SET status = 'completed', priority = 0, last_checked = CURRENT_TIMESTAMP 
                    WHERE url = ?
                `).run(job.url);
            }
        } catch (e) {
            console.error(`Failed to scrape ${job.url}:`, e.message);
            db.prepare("UPDATE scrape_queue SET status = 'failed', last_attempt = CURRENT_TIMESTAMP WHERE url = ?").run(job.url);
        }

        // Always respect politeness delay
        await new Promise(r => setTimeout(r, 10000));
    }
}

runWorker().catch(console.error);