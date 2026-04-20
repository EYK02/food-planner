import { scraper } from '../src/scraper.js';
import dbHelper from '../src/db.js';

async function seedSales() {
    const urls = await scraper.getSalesUrls();
    
    // Database logic remains here because it's a "Script" task, not "Scraper" logic
    dbHelper.db.prepare('UPDATE scrape_queue SET priority = 0').run();
    const update = dbHelper.db.prepare('UPDATE scrape_queue SET priority = 1 WHERE url = ?');
    const transaction = dbHelper.db.transaction((urls) => urls.forEach(u => update.run(u)));
    transaction(urls);
}
seedSales();