import { settings } from '../config/settings.js';

export const isAllowedTime = (storeName = 'willys') => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    
    const config = settings.stores[storeName];
    if (!config) throw new Error(`Configuration for store '${storeName}' not found.`);

    const { windowStartHour, windowStartMinute, windowEndHour, windowEndMinute } = config;

    // Convert everything to "minutes from midnight" for simple comparison
    const nowMinutes = (utcHour * 60) + utcMinute;
    const startMinutes = (windowStartHour * 60) + windowStartMinute;
    const endMinutes = (windowEndHour * 60) + windowEndMinute;

    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));