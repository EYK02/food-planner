import Sitemapper from 'sitemapper';
import scraper from '../src/scraper.js';
const { scrapeProducts } = scraper;

async function runFullScrape() {
    const sitemap = new Sitemapper({
        url: 'https://www.willys.se/medias/Product-en-SEK-16568801874525431602.xml', // The specific product sitemap
        timeout: 15000 // 15 seconds
    });

    console.log("Fetching sitemap...");
    const { sites } = await sitemap.fetch();
    
    console.log(`Found ${sites.length} products. Starting scrape...`);

    // Note: If the sitemap has thousands of items, DO NOT scrape them all at once!
    // Start with a small slice for testing:
    const testSlice = sites.slice(0, 10); 
    
    await scrapeProducts(testSlice);
}

runFullScrape();