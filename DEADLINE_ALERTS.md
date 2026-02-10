# Deadline Alert System - Integration Guide

## Overview
The deadline alert system automatically monitors project deadlines and sends alerts to Discord's #project-updates channel 3 days and 1 day before each deadline.

## Setup Instructions

### 1. Configure Webhook URL

Add the following to your `.env` file:

```env
PROJECT_UPDATES_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN
ALERT_CHECK_TIME=0 9 * * *
```

**To get your webhook URL:**
1. Go to Discord Server Settings
2. Navigate to Integrations → Webhooks
3. Create a new webhook for #project-updates channel
4. Copy the webhook URL

### 2. Restart the Server

```bash
npm start
```

You should see:
```
📅 Deadline Alert Scheduler initialized
⏰ Schedule: 0 9 * * * (Daily at 9:00 AM)
✅ Scheduler is running. Deadline checks will run daily at 9:00 AM.
```

## Integration with Project Update Page

Your existing Project Update page needs to call the sync endpoint whenever projects are added or updated.

### API Endpoint

**POST** `http://localhost:3000/api/projects/sync`

### Request Format

```json
{
  "projects": [
    {
      "id": "unique-project-id",
      "name": "Project Name",
      "deadline": "2026-02-20",
      "assignedUsers": ["discord_user_id_1", "discord_user_id_2"]
    }
  ]
}
```

### Example Integration Code

```javascript
// Call this function when projects are added/updated in your Project Update page
async function syncProjectsToDeadlineSystem(projects) {
  try {
    const response = await fetch('http://localhost:3000/api/projects/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects })
    });
    
    const result = await response.json();
    console.log('Projects synced:', result);
  } catch (error) {
    console.error('Failed to sync projects:', error);
  }
}
```

### Important Notes

- **User IDs**: The `assignedUsers` array should contain Discord user IDs (numeric), not usernames
- **Date Format**: Deadlines should be in ISO format (YYYY-MM-DD)
- **Unique IDs**: Each project must have a unique `id` field

## Testing

### 1. Test Project Sync

```bash
curl -X POST http://localhost:3000/api/projects/sync \
  -H "Content-Type: application/json" \
  -d "{\"projects\":[{\"id\":\"test1\",\"name\":\"Test Project\",\"deadline\":\"2026-02-13\",\"assignedUsers\":[\"123456789\"]}]}"
```

### 2. Manual Deadline Check

```bash
curl -X POST http://localhost:3000/api/deadlines/check
```

This will immediately check all projects and send alerts if needed (useful for testing).

### 3. View Current Projects

```bash
curl http://localhost:3000/api/projects
```

### 4. Clear Alerts for a Project

If you change a project's deadline and want to reset alerts:

```bash
curl -X DELETE http://localhost:3000/api/projects/PROJECT_ID/alerts
```

## Alert Rules

- **3-Day Alert**: Sent exactly 3 days before the deadline
- **1-Day Alert**: Sent exactly 1 day before the deadline
- **Duplicate Prevention**: Each alert is sent only once per project
- **User Mentions**: Only users assigned to the project are mentioned

## Discord Message Format

Alerts appear in #project-updates as embedded messages:

```
🚨 Deadline Alert: Project Name

⚠️ This project deadline is approaching. Please ensure all tasks are on track!

📅 Deadline: February 13, 2026 (in 3 days)
👥 Assigned To: @user1 @user2

Project ID: test1
```

## Troubleshooting

### Alerts Not Sending

1. Check webhook URL is configured in `.env`
2. Verify projects are synced: `curl http://localhost:3000/api/projects`
3. Check server logs for errors
4. Manually trigger check: `curl -X POST http://localhost:3000/api/deadlines/check`

### Wrong Users Mentioned

- Ensure `assignedUsers` contains Discord user IDs (numeric), not usernames
- User IDs can be found by enabling Developer Mode in Discord and right-clicking users

### Duplicate Alerts

- Alerts are tracked in `data/alerts.json`
- To reset: delete the file or use the clear endpoint

## File Structure

```
discord_github/
├── server.js              # Main server with API endpoints
├── scheduler.js           # Cron job scheduler
├── deadlineChecker.js     # Alert logic
├── alertTracker.js        # Duplicate prevention
├── data/
│   ├── projects.json      # Synced project data
│   └── alerts.json        # Sent alert tracking
└── .env                   # Configuration
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects/sync` | POST | Sync projects from Project Update page |
| `/api/projects` | GET | Get all current projects |
| `/api/deadlines/check` | POST | Manually trigger deadline check |
| `/api/projects/:id/alerts` | DELETE | Clear alerts for a project |
