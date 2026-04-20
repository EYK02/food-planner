import { chromium } from 'playwright';
import dbHelper from '../src/db_helper.js';

const db = dbHelper.db;

async function seedSales() {
    console.log("Launching browser to find current sales...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Visit the Willys offers page
    await page.goto('https://www.willys.se/erbjudanden', { waitUntil: 'networkidle' });

    // Extract all product links
    const productUrls = await page.$$eval('a[data-test="product-item-link"]', links => 
        links.map(a => a.href)
    );

    console.log(`Found ${productUrls.length} products on sale. Updating priority...`);

    // Reset priority for everything first
    db.prepare('UPDATE scrape_queue SET priority = 0').run();

    // Mark these as priority 1
    const updateStmt = db.prepare('UPDATE scrape_queue SET priority = 1 WHERE url = ?');
    const transaction = db.transaction((urls) => {
        for (const url of urls) {
            updateStmt.run(url);
        }
    });

    transaction(productUrls);
    
    await browser.close();
    console.log("Sales seeding complete.");
}

seedSales().catch(console.error);