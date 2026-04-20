export const isAllowedTime = () => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    
    // Willys robots.txt window: 04:00 to 08:45 UTC
    if (utcHour >= 4 && utcHour < 8) return true;
    if (utcHour === 8 && utcMinute < 45) return true;
    
    return false;
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));