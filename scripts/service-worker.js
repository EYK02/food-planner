import { chromium } from 'playwright';
import dbHelper from '../src/db.js';
import { scraper } from '../src/scraper.js';
import { isAllowedTime, sleep, getStoreConfig } from '../src/utils.js';
import { logger } from '../src/logger.js';
import robotsParser from 'robots-parser';
import axios from 'axios';

// Cache for robots.txt
const robotsCache = new Map();

async function isUrlAllowed(url, userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36') {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.origin;
    
    if (!robotsCache.has(domain)) {
        try {
            const response = await axios.get(`${domain}/robots.txt`);
            robotsCache.set(domain, robotsParser(`${domain}/robots.txt`, response.data));
        } catch (e) {
            return true;
        }
    }
    return robotsCache.get(domain).isAllowed(url, userAgent);
}

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

        // 1. Robots.txt Check
        const allowed = await isUrlAllowed(job.url);
        if (!allowed) {
            logger.warn(`Skipping disallowed URL: ${job.url}`);
            dbHelper.updateJobStatus(job.url, 'failed', 0); // Marking failed so it doesn't loop
            continue;
        }

        logger.info(`Scraping: ${job.url}`);
        
        try {
            // 2. Pass storeName to the scraper
            const productData = await scraper.scrapeProductData(job.url, storeName, browser);
            
            if (productData) {
                const product = dbHelper.addStoreProduct(config.id, productData.name, job.url, job.url);
                dbHelper.recordPrice(product.id, productData.price);
                
                dbHelper.updateJobStatus(job.url, 'completed', 0);
                logger.info(`Successfully processed: ${job.url}`);
            } else {
                throw new Error("No product data returned");
            }
        } catch (e) {
            logger.error(`Failed to scrape ${job.url}: ${e.message}`);
            dbHelper.markJobFailed(job.url); // This now handles retry_count logic
            
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