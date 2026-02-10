import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Middleware to parse JSON
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'GitHub to Discord webhook server is running' });
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
  
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('⚠️  WARNING: DISCORD_WEBHOOK_URL not set in .env file');
  }
});
