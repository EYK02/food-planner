import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import dbHelper from '../src/db_helper.js';

const db = dbHelper.db;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function seedQueue() {
    const INDEX_URL = 'https://www.willys.se/medias/Product-en-SEK-16568801874525431602.xml';
    
    const { data } = await axios.get(INDEX_URL, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    const parsedIndex = await parseStringPromise(data);
    const sitemaps = parsedIndex.sitemapindex.sitemap.map(s => s.loc[0]);

    for (const sitemapUrl of sitemaps) {
        await sleep(10000); // Politeness delay
        const { data: subXml } = await axios.get(sitemapUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }});
        const parsedSub = await parseStringPromise(subXml);
        
        const insertStmt = db.prepare('INSERT OR IGNORE INTO scrape_queue (url, priority) VALUES (?, 0)');
        const transaction = db.transaction((urls) => {
            for (const url of urls) insertStmt.run(url);
        });

        transaction(parsedSub.urlset.url.map(u => u.loc[0]));
        console.log(`Processed batch from: ${sitemapUrl}`);
    }
}

seedQueue().catch(console.error);