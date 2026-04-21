import { spawn } from 'child_process';
import { settings } from '../config/settings.js';
import { isAllowedTime, sleep } from '../src/utils.js';
import { logger } from '../src/logger.js';
import dbHelper from '../src/db.js';

const runScript = (scriptPath, storeName) => {
    return new Promise((resolve) => {
        logger.info(`--- Starting ${scriptPath} for ${storeName} ---`);
        // Use spawn to prevent command injection
        const child = spawn('node', [scriptPath, storeName]);
        
        child.stdout.on('data', (data) => logger.info(`[${scriptPath}] ${data}`));
        child.stderr.on('data', (data) => logger.error(`[${scriptPath}] ${data}`));
        
        child.on('close', (code) => {
            if (code !== 0) logger.error(`Finished ${storeName} with exit code ${code}`);
            else logger.info(`Finished ${storeName} successfully`);
            resolve();
        });
    });
};

async function startScheduler() {
    logger.info("Scheduler service started.");
    while (true) {
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
                            logger.error(`Task ${task.name} failed for ${store}: ${err.message}`);
                        }
                    }
                }
            }
        }
        await sleep(settings.scheduler.checkInterval);
    }
}

startScheduler().catch(err => logger.error(`Fatal scheduler crash: ${err.message}`));