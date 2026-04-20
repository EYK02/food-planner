import { chromium } from 'playwright';
import db from './db_helper.js';

const CRAWL_DELAY_MS = 10000; // 10 seconds for Willy's

async function scrapeProducts(urls) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    for (const url of urls) {
        try {
            console.log(`Navigating to: ${url}...`);
            await page.goto(url, { waitUntil: 'networkidle' });

            const name = await page.textContent('[itemprop="name"]');
            const price = await page.getAttribute('[itemprop="price"]', 'content');
            const description = await page.getAttribute('[itemprop="description"]', 'content');

            if (name && price) {
                // Save to database
                const product = db.addStoreProduct(1, name.trim(), url, url); // Assuming store_id 1
                db.recordPrice(product.lastInsertRowid, parseFloat(price.replace(',', '.')));
                console.log(`Successfully saved: ${name.trim()} - ${price} SEK`);
            }

            // Respect robots.txt delay
            await new Promise(resolve => setTimeout(resolve, CRAWL_DELAY_MS));

        } catch (error) {
            console.error(`Error scraping ${url}:`, error.message);
        }
    }

    await browser.close();
}

module.exports = { scrapeProducts };