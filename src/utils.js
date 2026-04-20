import { settings } from '../config/settings.js';

export const getStoreConfig = (storeName) => {
    const store = settings.stores[storeName];
    if (!store) throw new Error(`Unknown store: ${storeName}`);
    
    // Merge store config with defaults
    return {
        ...settings.defaults,
        ...store
    };
};

export const isAllowedTime = (storeName = 'willys') => {
    const config = settings.stores[storeName];
    if (!config) throw new Error(`Configuration for store '${storeName}' not found.`);

    // If these values are undefined, null, or not set, we treat it as "always allowed"
    const { windowStartHour, windowStartMinute, windowEndHour, windowEndMinute } = config;

    // Check if the window is defined; if not, return true immediately
    const hasWindow = [windowStartHour, windowStartMinute, windowEndHour, windowEndMinute]
        .every(val => val !== undefined && val !== null);

    if (!hasWindow) {
        return true;
    }

    const now = new Date();
    const nowMinutes = (now.getUTCHours() * 60) + now.getUTCMinutes();
    const startMinutes = (windowStartHour * 60) + windowStartMinute;
    const endMinutes = (windowEndHour * 60) + windowEndMinute;

    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));