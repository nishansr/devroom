# 🚀 DevRoom Deployment Guide

## Overview

DevRoom requires a WebSocket server to be running. Here's how to deploy it for production use.

---

## 🌐 Option 1: Render.com (Recommended - Free Tier Available)

### Steps:

1. **Push your server code to GitHub**

   ```bash
   cd server
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO
   git push -u origin main
   ```

2. **Deploy on Render**

   - Go to https://render.com
   - Sign up / Log in
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Configure:
     - **Name**: devroom-server
     - **Root Directory**: `server`
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free
   - Click "Create Web Service"

3. **Get your server URL**

   - After deployment, you'll get a URL like: `https://devroom-server.onrender.com`
   - Copy this URL

4. **Update the extension**

   - Edit `src/socketClient.ts` line 21:
     ```typescript
     serverUrl: "wss://devroom-server.onrender.com";
     ```
   - Or edit `src/ChatPanel.ts` line 57:
     ```typescript
     serverUrl: process.env.DEVROOM_SERVER_URL ||
       "wss://devroom-server.onrender.com";
     ```
   - Rebuild: `npm run build`
   - Package: `npx vsce package --allow-missing-repository --allow-star-activation --no-dependencies`

5. **Done!** Your extension now connects to the production server.

---

## 🚂 Option 2: Railway.app (Easy, Free Tier)

### Steps:

1. **Install Railway CLI**

   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy**

   ```bash
   cd server
   railway login
   railway init
   railway up
   ```

3. **Get URL**

   ```bash
   railway domain
   ```

   - Copy the URL (e.g., `https://devroom-production.up.railway.app`)

4. **Update extension** (same as above with your Railway URL)

---

## ✈️ Option 3: Fly.io (Global Edge Network)

### Steps:

1. **Install Fly CLI**

   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login and Deploy**

   ```bash
   cd server
   fly auth login
   fly launch
   # Follow the prompts
   fly deploy
   ```

3. **Get URL**

   ```bash
   fly info
   ```

   - Use the hostname (e.g., `https://devroom.fly.dev`)

4. **Update extension** with your Fly.io URL

---

## 🔵 Option 4: Heroku (Classic)

### Steps:

1. **Install Heroku CLI**

   ```bash
   brew install heroku/brew/heroku
   ```

2. **Deploy**

   ```bash
   cd server
   heroku login
   heroku create devroom-server
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

3. **Get URL**

   - Your app will be at `https://devroom-server.herokuapp.com`

4. **Update extension** with Heroku URL

---

## ☁️ Option 5: AWS/GCP/Azure (Advanced)

### For AWS EC2:

1. Launch an EC2 instance (Ubuntu)
2. SSH into instance
3. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
4. Clone your server code
5. Run with PM2:
   ```bash
   npm install -g pm2
   cd server
   npm install
   pm2 start index.js --name devroom-server
   pm2 save
   pm2 startup
   ```
6. Set up NGINX as reverse proxy
7. Use your EC2 public IP or domain

---

## 🔒 Environment Variables

### For Extension:

Set in your shell before packaging:

```bash
export DEVROOM_SERVER_URL=wss://your-server.com
npm run build
npx vsce package
```

### For Server:

Most platforms allow setting environment variables:

- **Render**: Dashboard → Environment → Add Variable
- **Railway**: `railway variables set PORT=3000`
- **Heroku**: `heroku config:set PORT=3000`

---

## 📝 Important Notes

### WebSocket Protocol:

- Use `wss://` (secure) for HTTPS deployments
- Use `ws://` only for localhost

### Port Configuration:

- Most platforms automatically set the `PORT` environment variable
- Your server already handles this: `const PORT = process.env.PORT || 3000`

### Free Tier Limitations:

- **Render Free**: Spins down after 15 min of inactivity, cold starts ~30s
- **Railway Free**: 500 hours/month, $5 credit
- **Fly.io Free**: 3 VMs, limited resources
- **Heroku Free**: Removed (now requires paid plan)

---

## 🧪 Testing Production Deployment

After deployment:

1. **Test with curl:**

   ```bash
   curl https://your-server.com
   # Should return: "DevRoom WebSocket Server"
   ```

2. **Test WebSocket:**

   ```bash
   npm install -g wscat
   wscat -c wss://your-server.com/room/test123
   # Should connect successfully
   ```

3. **Update Extension:**
   - Rebuild with production URL
   - Install and test
   - Should connect to your deployed server

---

## 🎯 Recommended Setup for Production

1. **Deploy server to Render.com** (free, reliable)
2. **Update extension** with production URL
3. **Package extension** with production settings
4. **Publish to VS Code Marketplace**
5. **Users install** → Automatically connects to your server

---

## 🔄 Auto-Deploy Setup

### With GitHub Actions (for Render/Railway):

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Server
on:
  push:
    branches: [main]
    paths:
      - "server/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          curl -X POST YOUR_RENDER_DEPLOY_HOOK_URL
```

---

## 💰 Cost Estimates

| Platform | Free Tier  | Paid (Starting) |
| -------- | ---------- | --------------- |
| Render   | ✅ Yes     | $7/month        |
| Railway  | ✅ Limited | $5/month        |
| Fly.io   | ✅ Limited | $5/month        |
| Heroku   | ❌ No      | $7/month        |
| AWS EC2  | ⚠️ 12mo    | $5-10/month     |

---

## 🆘 Troubleshooting

### Connection Issues:

1. Check server logs on platform dashboard
2. Verify WebSocket protocol (ws vs wss)
3. Test with wscat first
4. Check firewall/security groups

### Server Sleeping (Render Free):

- First connection takes ~30s (cold start)
- Consider using a ping service or upgrading

### CORS Issues:

- Not applicable for WebSocket (no CORS)
- If issues persist, check server logs

---

## 📦 Quick Deploy Commands Summary

```bash
# Render (via CLI)
render deploy

# Railway
railway up

# Fly.io
fly deploy

# Heroku
git push heroku main

# Then update extension
export DEVROOM_SERVER_URL=wss://your-server.com
npm run build
npx vsce package --allow-missing-repository --allow-star-activation --no-dependencies
```

---

## ✅ Checklist

- [ ] Server deployed to cloud platform
- [ ] Server URL obtained (wss://...)
- [ ] Extension updated with production URL
- [ ] Extension rebuilt
- [ ] Tested connection
- [ ] Extension packaged
- [ ] Ready for distribution

---

**For most users, Render.com is the easiest option with generous free tier!**
