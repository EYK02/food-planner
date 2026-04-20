import { chromium } from 'playwright';
import dbHelper from '../src/db_helper.js';

const db = dbHelper.db;

async function runWorker() {
    const browser = await chromium.launch({ headless: true });
    
    while (true) {
        // Pick highest priority first, then oldest last_checked
        const job = db.prepare(`
            SELECT url FROM scrape_queue 
            ORDER BY priority DESC, last_checked ASC NULLS FIRST 
            LIMIT 1
        `).get();

        if (!job) {
            console.log("Queue empty. Sleeping...");
            await new Promise(r => setTimeout(r, 60000));
            continue;
        }

        console.log(`Scraping: ${job.url}`);
        const page = await browser.newPage();
        try {
            await page.goto(job.url);
            const price = await page.textContent('.price-unit-price'); // Update selector
            
            // Logic: Record price, then update queue
            dbHelper.recordPrice(job.url, price);
            db.prepare('UPDATE scrape_queue SET status = "done", priority = 0, last_checked = CURRENT_TIMESTAMP WHERE url = ?').run(job.url);
            
        } catch (e) {
            console.error(`Failed: ${job.url}`);
        } finally {
            await page.close();
            await new Promise(r => setTimeout(r, 10000)); // Politeness delay
        }
    }
}

runWorker().catch(console.error);