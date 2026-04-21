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
    if (!config) throw new Error(`Configuration for '${storeName}' not found.`);

    const { windowStartHour, windowStartMinute, windowEndHour, windowEndMinute } = config;
    if (windowStartHour === undefined) return true;

    const now = new Date();
    
    // Get current time in UTC
    const nowMinutes = (now.getUTCHours() * 60) + now.getUTCMinutes();
    
    // Convert your local-time config to UTC-minutes
    // To do this, we need to know the offset. 
    // New Date() already knows the offset!
    const localStart = new Date(now);
    localStart.setHours(windowStartHour, windowStartMinute, 0, 0);
    
    const localEnd = new Date(now);
    localEnd.setHours(windowEndHour, windowEndMinute, 0, 0);
    
    const startMinutesUTC = (localStart.getUTCHours() * 60) + localStart.getUTCMinutes();
    const endMinutesUTC = (localEnd.getUTCHours() * 60) + localEnd.getUTCMinutes();

    // Logic: Is current UTC time within the UTC-converted window?
    if (startMinutesUTC < endMinutesUTC) {
        return nowMinutes >= startMinutesUTC && nowMinutes < endMinutesUTC;
    } else {
        // Handles midnight crossing in UTC
        return nowMinutes >= startMinutesUTC || nowMinutes < endMinutesUTC;
    }
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));