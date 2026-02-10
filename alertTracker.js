import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize alerts file if it doesn't exist
if (!fs.existsSync(ALERTS_FILE)) {
    fs.writeFileSync(ALERTS_FILE, JSON.stringify({}, null, 2));
}

/**
 * Check if an alert has already been sent for a project
 * @param {string} projectId - Unique project identifier
 * @param {string} alertType - '3-day' or '1-day'
 * @returns {boolean} - True if alert was already sent
 */
export function hasAlertBeenSent(projectId, alertType) {
    try {
        const data = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
        return data[projectId] && data[projectId][alertType];
    } catch (error) {
        console.error('Error reading alerts file:', error);
        return false;
    }
}

/**
 * Record that an alert has been sent
 * @param {string} projectId - Unique project identifier
 * @param {string} alertType - '3-day' or '1-day'
 */
export function recordAlert(projectId, alertType) {
    try {
        const data = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));

        if (!data[projectId]) {
            data[projectId] = {};
        }

        data[projectId][alertType] = new Date().toISOString();

        fs.writeFileSync(ALERTS_FILE, JSON.stringify(data, null, 2));
        console.log(`✅ Recorded ${alertType} alert for project: ${projectId}`);
    } catch (error) {
        console.error('Error recording alert:', error);
    }
}

/**
 * Get all recorded alerts
 * @returns {Object} - All alert records
 */
export function getAllAlerts() {
    try {
        return JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
    } catch (error) {
        console.error('Error reading alerts:', error);
        return {};
    }
}

/**
 * Clear alerts for a specific project (useful when project is deleted or deadline changes)
 * @param {string} projectId - Unique project identifier
 */
export function clearProjectAlerts(projectId) {
    try {
        const data = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
        delete data[projectId];
        fs.writeFileSync(ALERTS_FILE, JSON.stringify(data, null, 2));
        console.log(`🗑️  Cleared alerts for project: ${projectId}`);
    } catch (error) {
        console.error('Error clearing alerts:', error);
    }
}
