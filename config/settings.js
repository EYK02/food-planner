import path from 'path';
import { fileURLToPath } from 'url';
import { defaults } from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const settings = {
    db: {
        path: path.resolve(__dirname, '../data/planner.db')
    },
    defaults: {
        politenessDelay: 10000,
        retryLimit: 3
    },
    willys: {
        id: 1,
        sitemapUrl: 'https://www.willys.se/medias/Product-en-SEK-16568801874525431602.xml',
        salesUrl: 'https://www.willys.se/erbjudanden',
        // Willys robots.txt window (UTC)
        windowStartHour: 4,
        windowStartMinute: 0,
        windowEndHour: 8,
        windowEndMinute: 45
    },
    ica: {
        id: 2,
        salesUrl: 'https://www.ica.se/erbjudanden/ica-kvantum-uppsala-1003871/',
    },
    scheduler: {
        checkInterval: 30 * 60 * 1000 // 30 minutes
    }
};