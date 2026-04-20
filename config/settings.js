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
    stores: {
        willys: {
            id: 1,
            sitemapUrl: 'https://www.willys.se/medias/Product-en-SEK-16568801874525431602.xml',
            salesUrl: 'https://www.willys.se/erbjudanden',
            selectors: {
                offerLink: 'a[data-test="product-item-link"]',
                productName: '[itemprop="name"]',
                productPrice: '[itemprop="price"]'
            },
            parsePrice: (val) => parseFloat(val),
            // Willys robots.txt window (UTC)
            windowStartHour: 4,
            windowStartMinute: 0,
            windowEndHour: 8,
            windowEndMinute: 45
        },
        ica: {
            id: 2,
            salesUrl: 'https://www.ica.se/erbjudanden/ica-supermarket-torgkassen-1003821/',
            selectors: {
                offerLink: 'a[data-test="fop-product-link"]', // Update this based on ICA's actual DOM
                productName: 'h3[data-test="fop-title"]', // Placeholder - update as needed
                productPrice: 'span[data-test="fop-price"]'   // Placeholder - update as needed
            },
            parsePrice: (val) => parseFloat(val.replace('SEK', '').replace(',', '.').trim())
        }
    },
    scheduler: {
        checkInterval: 30 * 60 * 1000 // 30 minutes
    },
    scheduledTasks: [
        { name: 'Weekly Offers', script: './scripts/task-seed-offers.js', day: 2 }, // Tuesday = 2
        { name: 'Monthly Products', script: './scripts/task-seed-products.js', date: 21 }
    ]
};