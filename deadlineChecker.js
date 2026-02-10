import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hasAlertBeenSent, recordAlert } from './alertTracker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

/**
 * Calculate days between two dates
 * @param {Date} date1 
 * @param {Date} date2 
 * @returns {number} - Days difference
 */
function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2 - date1) / oneDay);
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Create Discord embed message for deadline alert
 * @param {Object} project - Project object
 * @param {number} daysUntil - Days until deadline
 * @param {string} alertType - '3-day' or '1-day'
 * @returns {Object} - Discord message payload
 */
function createAlertMessage(project, daysUntil, alertType) {
    const urgencyEmoji = alertType === '1-day' ? '🚨' : '⚠️';
    const urgencyColor = alertType === '1-day' ? 0xFF0000 : 0xFFA500; // Red for 1-day, Orange for 3-day

    const urgencyMessage = alertType === '1-day'
        ? '**URGENT:** This project deadline is tomorrow! Please ensure all tasks are completed.'
        : 'This project deadline is approaching. Please ensure all tasks are on track!';

    // Format user mentions
    const userMentions = project.assignedUsers && project.assignedUsers.length > 0
        ? project.assignedUsers.map(user => `@${user}`).join(' ')
        : 'No users assigned';

    return {
        content: project.assignedUsers && project.assignedUsers.length > 0
            ? project.assignedUsers.map(user => `<@${user}>`).join(' ')
            : null,
        embeds: [{
            title: `${urgencyEmoji} Deadline Alert: ${project.name}`,
            description: urgencyMessage,
            color: urgencyColor,
            fields: [
                {
                    name: '📅 Deadline',
                    value: `${formatDate(project.deadline)} (in ${daysUntil} day${daysUntil !== 1 ? 's' : ''})`,
                    inline: false
                },
                {
                    name: '👥 Assigned To',
                    value: userMentions,
                    inline: false
                }
            ],
            footer: {
                text: `Project ID: ${project.id}`
            },
            timestamp: new Date().toISOString()
        }]
    };
}

/**
 * Send alert to Discord webhook
 * @param {Object} message - Discord message payload
 * @param {string} webhookUrl - Discord webhook URL
 */
async function sendDiscordAlert(message, webhookUrl) {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Discord API error:', errorText);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending Discord alert:', error);
        return false;
    }
}

/**
 * Check all projects and send deadline alerts
 * @param {string} webhookUrl - Discord webhook URL for project-updates channel
 */
export async function checkDeadlines(webhookUrl) {
    console.log('\n🔍 Checking project deadlines...');

    if (!webhookUrl) {
        console.error('❌ PROJECT_UPDATES_WEBHOOK_URL not configured');
        return;
    }

    // Check if projects file exists
    if (!fs.existsSync(PROJECTS_FILE)) {
        console.log('ℹ️  No projects file found. Waiting for project data sync.');
        return;
    }

    try {
        // Read projects
        const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
        const projects = projectsData.projects || [];

        if (projects.length === 0) {
            console.log('ℹ️  No projects to check.');
            return;
        }

        console.log(`📊 Found ${projects.length} project(s) to check.`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let alertsSent = 0;

        for (const project of projects) {
            const deadline = new Date(project.deadline);
            deadline.setHours(0, 0, 0, 0);

            const daysUntil = daysBetween(today, deadline);

            console.log(`  📌 ${project.name}: ${daysUntil} days until deadline`);

            // Check for 3-day alert
            if (daysUntil === 3) {
                if (!hasAlertBeenSent(project.id, '3-day')) {
                    console.log(`    ⚠️  Sending 3-day alert...`);
                    const message = createAlertMessage(project, daysUntil, '3-day');
                    const success = await sendDiscordAlert(message, webhookUrl);

                    if (success) {
                        recordAlert(project.id, '3-day');
                        alertsSent++;
                        console.log(`    ✅ 3-day alert sent successfully`);
                    } else {
                        console.log(`    ❌ Failed to send 3-day alert`);
                    }
                } else {
                    console.log(`    ℹ️  3-day alert already sent`);
                }
            }

            // Check for 1-day alert
            if (daysUntil === 1) {
                if (!hasAlertBeenSent(project.id, '1-day')) {
                    console.log(`    🚨 Sending 1-day alert...`);
                    const message = createAlertMessage(project, daysUntil, '1-day');
                    const success = await sendDiscordAlert(message, webhookUrl);

                    if (success) {
                        recordAlert(project.id, '1-day');
                        alertsSent++;
                        console.log(`    ✅ 1-day alert sent successfully`);
                    } else {
                        console.log(`    ❌ Failed to send 1-day alert`);
                    }
                } else {
                    console.log(`    ℹ️  1-day alert already sent`);
                }
            }

            // Log if deadline passed
            if (daysUntil < 0) {
                console.log(`    ⏰ Deadline has passed`);
            }
        }

        console.log(`\n✨ Deadline check complete. Sent ${alertsSent} alert(s).\n`);

    } catch (error) {
        console.error('❌ Error checking deadlines:', error);
    }
}
