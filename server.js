import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startScheduler, triggerManualCheck } from './scheduler.js';
import { clearProjectAlerts } from './alertTracker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const DATA_DIR = path.join(__dirname, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware to parse JSON
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'GitHub to Discord webhook server is running',
    features: ['GitHub push notifications', 'Project deadline alerts']
  });
});

// GitHub webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    // Verify it's a push event
    const event = req.headers['x-github-event'];

    if (event !== 'push') {
      console.log(`Received non-push event: ${event}`);
      return res.status(200).json({ message: 'Event ignored (not a push)' });
    }

    const payload = req.body;

    // Extract push information
    const repository = payload.repository.name;
    const repoUrl = payload.repository.html_url;
    const branch = payload.ref.replace('refs/heads/', '');
    const pusher = payload.pusher.name;
    const commits = payload.commits || [];

    // Get the latest commit for the main message
    const latestCommit = commits[commits.length - 1];

    if (!latestCommit) {
      console.log('No commits in push event');
      return res.status(200).json({ message: 'No commits to report' });
    }

    const commitAuthor = latestCommit.author.name;
    const commitMessage = latestCommit.message;
    const commitUrl = latestCommit.url;
    const commitSha = latestCommit.id.substring(0, 7);

    // Format Discord message with embed
    const discordMessage = {
      embeds: [{
        title: `📦 New Push to ${repository}`,
        description: `**${commitAuthor}** pushed to \`${branch}\``,
        color: 0x7289DA, // Discord blurple color
        fields: [
          {
            name: '📝 Commit Message',
            value: commitMessage.length > 256 ? commitMessage.substring(0, 253) + '...' : commitMessage,
            inline: false
          },
          {
            name: '🔗 Commit',
            value: `[\`${commitSha}\`](${commitUrl})`,
            inline: true
          },
          {
            name: '🌿 Branch',
            value: `\`${branch}\``,
            inline: true
          },
          {
            name: '👤 Author',
            value: commitAuthor,
            inline: true
          }
        ],
        footer: {
          text: `${commits.length} commit${commits.length > 1 ? 's' : ''} pushed`
        },
        timestamp: new Date().toISOString()
      }]
    };

    // Send to Discord
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordMessage)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord API error:', errorText);
      return res.status(500).json({ error: 'Failed to send Discord message' });
    }

    console.log(`✅ Push notification sent for ${repository}/${branch}`);
    res.status(200).json({ message: 'Notification sent successfully' });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Project sync endpoint - receives project data from Project Update page
app.post('/api/projects/sync', (req, res) => {
  try {
    const { projects } = req.body;

    if (!projects || !Array.isArray(projects)) {
      return res.status(400).json({
        error: 'Invalid data format. Expected { projects: [...] }'
      });
    }

    // Validate project structure
    for (const project of projects) {
      if (!project.id || !project.name || !project.deadline) {
        return res.status(400).json({
          error: 'Each project must have id, name, and deadline fields'
        });
      }
    }

    // Save projects to file
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify({ projects }, null, 2));

    console.log(`✅ Synced ${projects.length} project(s) from Project Update page`);

    res.status(200).json({
      message: 'Projects synced successfully',
      count: projects.length
    });

  } catch (error) {
    console.error('Error syncing projects:', error);
    res.status(500).json({ error: 'Failed to sync projects' });
  }
});

// Get all projects
app.get('/api/projects', (req, res) => {
  try {
    if (!fs.existsSync(PROJECTS_FILE)) {
      return res.status(200).json({ projects: [] });
    }

    const data = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
    res.status(200).json(data);

  } catch (error) {
    console.error('Error reading projects:', error);
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

// Manual trigger for deadline check (useful for testing)
app.post('/api/deadlines/check', async (req, res) => {
  try {
    console.log('🔧 Manual deadline check triggered via API');
    await triggerManualCheck();
    res.status(200).json({ message: 'Deadline check completed' });
  } catch (error) {
    console.error('Error during manual deadline check:', error);
    res.status(500).json({ error: 'Failed to check deadlines' });
  }
});

// Clear alerts for a specific project (useful when deadline changes)
app.delete('/api/projects/:id/alerts', (req, res) => {
  try {
    const { id } = req.params;
    clearProjectAlerts(id);
    res.status(200).json({ message: 'Project alerts cleared' });
  } catch (error) {
    console.error('Error clearing alerts:', error);
    res.status(500).json({ error: 'Failed to clear alerts' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`📊 Project sync endpoint: http://localhost:${PORT}/api/projects/sync`);

  if (!DISCORD_WEBHOOK_URL) {
    console.warn('⚠️  WARNING: DISCORD_WEBHOOK_URL not set in .env file');
  }

  // Start the deadline alert scheduler
  console.log('');
  startScheduler();
});

