import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const settings = {
    db: {
        path: path.resolve(__dirname, '../data/planner.db')
    },
    willys: {
        id: 1,
        sitemapUrl: 'https://www.willys.se/medias/Product-en-SEK-16568801874525431602.xml',
        salesUrl: 'https://www.willys.se/erbjudanden',
        // Willys robots.txt window (UTC)
        windowStartHour: 4,
        windowStartMinute: 0,
        windowEndHour: 8,
        windowEndMinute: 45,
        politenessDelay: 10000, // 10 seconds
        retryLimit: 3
    },
    ica: {
        id: 2
    },
    scheduler: {
        checkInterval: 30 * 60 * 1000 // 30 minutes
    }
};