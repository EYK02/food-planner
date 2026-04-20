import { scrapeProducts } from '../src/scraper.js';

const productUrls = [
    'https://www.willys.se/produkt/Hamburgergurka-Langskivade-101310324_ST',
    'https://www.willys.se/produkt/Mjolk-3-Latt-101234567_ST'
];

scrapeProducts(productUrls);