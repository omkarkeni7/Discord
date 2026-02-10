# GitHub to Discord Webhook Integration

Automatically post GitHub push notifications to your Discord #dev-updates channel.

## Features

- ✅ Automatic notifications on every push
- ✅ Clean, professional Discord embeds
- ✅ Shows repository, branch, author, commit message, and link
- ✅ One message per push (no spam)

## Prerequisites

- Node.js installed (v16 or higher)
- Discord server with #dev-updates channel
- GitHub repository
- ngrok for local testing (or cloud hosting for production)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Discord Webhook

1. Open Discord and go to your server
2. Right-click on **#dev-updates** channel → **Edit Channel**
3. Go to **Integrations** → **Webhooks**
4. Click **New Webhook**
5. Name it (e.g., "GitHub Notifications")
6. Copy the **Webhook URL**

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and paste your Discord webhook URL:
   ```
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
   PORT=3000
   ```

### 4. Start the Server

```bash
npm start
```

The server will run on `http://localhost:3000`

### 5. Expose Server with ngrok

1. Install ngrok: https://ngrok.com/download
2. Run ngrok:
   ```bash
   ngrok http 3000
   ```
3. Copy the **Forwarding URL** (e.g., `https://abc123.ngrok.io`)

### 6. Configure GitHub Webhook

1. Go to your GitHub repository
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `https://your-ngrok-url.ngrok.io/webhook`
   - **Content type**: `application/json`
   - **Which events**: Select **Just the push event**
   - **Active**: ✅ Checked
4. Click **Add webhook**

## Testing

1. Make a commit and push to your repository:
   ```bash
   git add .
   git commit -m "Test webhook integration"
   git push
   ```

2. Check your Discord #dev-updates channel for the notification

## Message Format

The Discord message will include:
- 📦 Repository name
- 🌿 Branch name
- 👤 Commit author
- 📝 Commit message
- 🔗 Link to commit
- Footer showing number of commits

## Troubleshooting

- **No message in Discord**: Check server logs and verify webhook URL
- **GitHub webhook failing**: Ensure ngrok URL is correct and server is running
- **Server errors**: Check `.env` file has correct Discord webhook URL

## Moving to Production

When ready to deploy to Railway:
1. Create Railway account
2. Deploy this repository
3. Add `DISCORD_WEBHOOK_URL` environment variable
4. Update GitHub webhook URL to Railway deployment URL

## Server Endpoints

- `GET /` - Health check
- `POST /webhook` - GitHub webhook receiver
