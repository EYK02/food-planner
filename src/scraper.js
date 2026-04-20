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

    // Discovery: Get list of Sale URLs from web
    async getSalesUrls(storeName) {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        const url = settings.stores[storeName].salesUrl;
        
        await page.goto(url, { waitUntil: 'networkidle' });
        const urls = await page.$$eval('a[data-test="product-item-link"]', links => links.map(a => a.href));
        await browser.close();
        return urls;
    },

    // Extraction: Scrape specific data (This remains agnostic as it takes the URL directly)
    async scrapeProductData(url, browser) {
        const page = await browser.newPage();
        try {
            await page.goto(url, { waitUntil: 'networkidle' });
            const name = await page.textContent('[itemprop="name"]');
            const price = await page.getAttribute('[itemprop="price"]', 'content');
            
            return { 
                name: name?.trim(), 
                price: parseFloat(price?.replace(',', '.')) 
            };
        } finally {
            await page.close();
        }
    }
};