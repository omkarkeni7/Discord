# ngrok Setup Instructions

## Quick Setup

### 1. Download ngrok
Visit: https://ngrok.com/download

Or download directly for Windows:
https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip

### 2. Extract and Install
1. Extract the downloaded ZIP file
2. Move `ngrok.exe` to a folder in your PATH, or to this project folder

### 3. Run ngrok
```bash
# If ngrok.exe is in this folder:
.\ngrok.exe http 3000

# If ngrok is in PATH:
ngrok http 3000
```

### 4. Get the Public URL
After running ngrok, you'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

Copy the `https://abc123.ngrok.io` URL.

### 5. Configure GitHub Webhook
1. Go to your GitHub repository
2. Settings → Webhooks → Add webhook
3. **Payload URL**: `https://abc123.ngrok.io/webhook` (add `/webhook` to the end!)
4. **Content type**: `application/json`
5. **Which events**: Select "Just the push event"
6. **Active**: ✅ Checked
7. Click "Add webhook"

### 6. Test It!
Make a commit and push:
```bash
git add .
git commit -m "Test Discord webhook"
git push
```

Check your Discord #dev-updates channel! 🎉

---

## Alternative: Download ngrok via PowerShell

```powershell
# Download ngrok
Invoke-WebRequest -Uri "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip" -OutFile "ngrok.zip"

# Extract
Expand-Archive -Path "ngrok.zip" -DestinationPath "." -Force

# Run
.\ngrok.exe http 3000
```

---

## Current Status

✅ Webhook server is running on port 3000  
✅ Discord webhook URL is configured  
⏳ Need to expose server with ngrok  
⏳ Need to configure GitHub webhook  

Your server is ready and waiting for GitHub events!
