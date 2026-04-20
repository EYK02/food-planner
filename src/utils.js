import { settings } from '../config/settings.js';

export const isAllowedTime = () => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();

    const { windowStartHour, windowEndHour, windowEndMinute } = settings.scrape;

    if (utcHour >= windowStartHour && utcHour < windowEndHour) return true;
    if (utcHour === windowEndHour && utcMinute < windowEndMinute) return true;
    return false;
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));