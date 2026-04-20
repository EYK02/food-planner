import { chromium } from 'playwright';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { settings } from '../config/settings.js';

export const scraper = {
    // Discovery: Get list of URLs from sitemap XML
    async getUrlsFromSitemap(storeName) {
        const url = settings.stores[storeName].sitemapUrl;
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
        const parsed = await parseStringPromise(data);
        return parsed.urlset.url.map(u => u.loc[0]);
    },

    // Discovery: Get list of Sale URLs using dynamic selectors
    async getSalesUrls(storeName) {
        const config = settings.stores[storeName];
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto(config.salesUrl, { waitUntil: 'networkidle' });
        
        // Use the store-specific selector from config
        const urls = await page.$$eval(config.selectors.offerLink, links => 
            links.map(a => a.href)
        );
        
        await browser.close();
        return urls;
    },

    // Extraction: Scrape specific data using dynamic selectors
    async scrapeProductData(url, storeName, browser) {
        const config = settings.stores[storeName];
        const page = await browser.newPage();
        try {
            await page.goto(url, { waitUntil: 'networkidle' });
            
            const name = await page.textContent(config.selectors.productName);
            
            // Use attribute if defined, otherwise fall back to textContent
            const rawPrice = 
                await page.getAttribute(config.selectors.productPrice, 'content') 
                || await page.textContent(config.selectors.productPrice);
            
            return { 
                name: name?.trim(), 
                price: config.parsePrice(rawPrice) 
            };
        } finally {
            await page.close();
        }
    }
};