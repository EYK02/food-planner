import { exec } from 'child_process';

// Simple delay helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Run a script and wait for it to finish
const runScript = (scriptPath) => {
    return new Promise((resolve, reject) => {
        console.log(`--- Starting ${scriptPath} ---`);
        exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if (error) reject(error);
            else {
                console.log(stdout);
                resolve();
            }
        });
    });
};

async function startScheduler() {
    while (true) {
        const now = new Date();
        const day = now.getDay(); // 1 = Monday
        const hour = now.getHours();

        // 1. Monday Morning Sales Sync (04:05 AM)
        if (day === 1 && hour === 4) {
            await runScript('./scripts/seed_sales.js');
        }

        // 2. Monthly Full Refresh (1st of the month, 04:00 AM)
        if (now.getDate() === 1 && hour === 4) {
            await runScript('./scripts/seed_queue.js');
        }

        // Check again in 30 minutes
        await sleep(30 * 60 * 1000);
    }
}

startScheduler().catch(console.error);