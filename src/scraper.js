import { chromium } from 'playwright';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { getStoreConfig } from '../src/utils.js';

export const scraper = {
    // Discovery: Get list of URLs from sitemap XML
    async getUrlsFromSitemap(storeName) {
        const config = getStoreConfig(storeName);
        const { data } = await axios.get(config.sitemapUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' }
        });
        const parsed = await parseStringPromise(data);
        // Note: adjust this if the XML structure varies (e.g. some sitemaps use <urlset><url><loc>...)
        return parsed.urlset.url.map(u => u.loc[0]);
    },

    // Discovery: Get list of Sale URLs
    async getProductUrlsFromOfferPage(storeName, browser) {
        const config = getStoreConfig(storeName);
        const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' });
        const page = await context.newPage();
        try {
            await page.goto(config.salesUrl, { waitUntil: 'networkidle' });
            return await page.$$eval(config.selectors.offerLink, links => links.map(a => a.href));
        } finally {
            await page.close();
            await context.close();
        }
    },

    // Extraction: Scrape specific data
    async scrapeProductData(url, storeName, browser) {
        const config = getStoreConfig(storeName);
        const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' });
        const page = await context.newPage();
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            
            const name = await page.textContent(config.selectors.productName);
            
            // Try getting price from meta tag first (often more reliable), then fallback to text
            const rawPrice = await page.getAttribute(config.selectors.productPrice, 'content') 
                          || await page.textContent(config.selectors.productPrice);
            
            return { 
                name: name?.trim(), 
                price: config.parsePrice(rawPrice) 
            };
        } finally {
            await page.close();
            await context.close();
        }
    }
};