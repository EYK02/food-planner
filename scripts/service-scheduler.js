import { exec } from 'child_process';
import { settings } from '../config/settings.js';
import { isAllowedTime, sleep } from '../src/utils.js';
import { logger } from '../src/logger.js';
import dbHelper from '../src/db.js';

const runScript = (scriptPath, storeName) => {
    return new Promise((resolve) => {
        logger.info(`--- Starting ${scriptPath} for ${storeName} ---`);
        // Pass the store name as an argument to the child process
        exec(`node ${scriptPath} ${storeName}`, (error, stdout, stderr) => {
            if (error) logger.error(`Error: ${stderr || error.message}`);
            else logger.info(`Finished ${storeName}: ${stdout}`);
            resolve();
        });
    });
};

async function startScheduler() {
    logger.info("Scheduler service started.");
    while (true) {
        // We check if the current time is valid generally
        // You may want to iterate through each store to check their specific windows
        const now = new Date();
        const stores = dbHelper.getAllStoreNames();

        for (const store of stores) {
            if (isAllowedTime(store)) {
                for (const task of settings.scheduledTasks) {
                    const dayMatch = task.day === undefined || task.day === now.getDay();
                    const dateMatch = task.date === undefined || task.date === now.getDate();

                    if (dayMatch && dateMatch) {
                        try {
                            await runScript(task.script, store);
                        } catch (err) {
                            logger.error(`Task ${task.name} failed for ${store}.`);
                        }
                    }
                }
            }
        }
        await sleep(settings.scheduler.checkInterval);
    }
}