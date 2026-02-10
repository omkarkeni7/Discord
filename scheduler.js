import cron from 'node-cron';
import dotenv from 'dotenv';
import { checkDeadlines } from './deadlineChecker.js';

dotenv.config();

const WEBHOOK_URL = process.env.PROJECT_UPDATES_WEBHOOK_URL;
const CRON_SCHEDULE = process.env.ALERT_CHECK_TIME || '0 9 * * *'; // Default: 9:00 AM daily

/**
 * Initialize the deadline alert scheduler
 */
export function startScheduler() {
    console.log('📅 Deadline Alert Scheduler initialized');
    console.log(`⏰ Schedule: ${CRON_SCHEDULE} (Daily at 9:00 AM)`);

    if (!WEBHOOK_URL) {
        console.warn('⚠️  WARNING: PROJECT_UPDATES_WEBHOOK_URL not set in .env file');
        console.warn('⚠️  Deadline alerts will not be sent until webhook URL is configured.');
    }

    // Schedule the deadline check
    cron.schedule(CRON_SCHEDULE, async () => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`⏰ Scheduled deadline check triggered at ${new Date().toLocaleString()}`);
        console.log('='.repeat(60));

        await checkDeadlines(WEBHOOK_URL);
    });

    console.log('✅ Scheduler is running. Deadline checks will run daily at 9:00 AM.\n');
}

/**
 * Manually trigger a deadline check (useful for testing)
 */
export async function triggerManualCheck() {
    console.log('\n🔧 Manual deadline check triggered...\n');
    await checkDeadlines(WEBHOOK_URL);
}
