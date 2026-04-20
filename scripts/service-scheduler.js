import { exec }                 from 'child_process';
import { isAllowedTime, sleep } from '../src/utils.js';
import { logger }               from '../src/logger.js';

const runScript = (scriptPath) => {
    return new Promise((resolve, reject) => {
        logger.info(`--- Starting ${scriptPath} ---`);
        exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                logger.error(`Error running ${scriptPath}: ${stderr || error.message}`);
                reject(error);
            } else {
                logger.info(`Finished ${scriptPath}: ${stdout}`);
                resolve();
            }
        });
    });
};

async function startScheduler() {
    logger.info("Scheduler service started.");
    while (true) {
        if (isAllowedTime()) {
            const now = new Date();
            const day = now.getDay(); 

            // Use try/catch so one failing task doesn't kill the whole scheduler
            try {
                if (day === 1) {
                    await runScript('./scripts/task-seed-offers.js');
                }

                if (now.getDate() === 1) {
                    await runScript('./scripts/task-seed-products.js');
                }
            } catch (err) {
                logger.error("A scheduled task failed.");
            }
        } else {
            // Optional: Log that we are sleeping to save log noise
            // logger.info("Outside allowed window. Scheduler idling.");
        }

        await sleep(settings.scheduler.checkIntervals); 
    }
}

startScheduler().catch(err => logger.error(`Fatal scheduler crash: ${err.message}`));