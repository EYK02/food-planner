import { chromium } from 'playwright';
import robotsParser from 'robots-parser';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { getStoreConfig } from '../src/utils.js';

const robotsCache = new Map();

async function isUrlAllowed(url, userAgent = 'MyBot/1.0') {
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
    
    const robots = robotsCache.get(domain);
    return robots.isAllowed(url, userAgent);
}

export const scraper = {
    async getUrlsFromSitemap(storeName) {
        const config = getStoreConfig(storeName);

        if (!(await isUrlAllowed(config.sitemapUrl))) {
            console.warn(`Blocked by robots.txt: ${config.sitemapUrl}`);
            return [];
        }

        const { data } = await axios.get(config.sitemapUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' }
        });
        const parsed = await parseStringPromise(data);
        return parsed.urlset.url.map(u => u.loc[0]);
    },

    async getProductUrlsFromOfferPage(storeName, browser) {
        const config = getStoreConfig(storeName);

        if (!(await isUrlAllowed(config.salesUrl))) {
            console.warn(`Blocked by robots.txt: ${config.salesUrl}`);
            return [];
        }

        const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' });
        const page = await context.newPage();
        try {
            // Add timeout for safety
            await page.goto(config.salesUrl, { waitUntil: 'networkidle', timeout: 30000 });
            return await page.$$eval(config.selectors.offerLink, links => links.map(a => a.href));
        } finally {
            await page.close();
            await context.close();
        }
    },

    async scrapeProductData(url, storeName, browser) {
        if (!(await isUrlAllowed(url))) {
            console.warn(`Blocked by robots.txt: ${url}`);
            return null;
        }
        const config = getStoreConfig(storeName);
        const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' });
        const page = await context.newPage();
        try {
            // Add timeout for safety
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            const name = await page.textContent(config.selectors.productName);
            
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