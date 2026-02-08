# 🚀 Backend Deployment Checklist

Follow this checklist to deploy your Hextris backend to Render.

---

## ✅ Pre-Deployment Checklist

### 1. Code Preparation
- [x] ✅ Backend code is complete and tested locally
- [x] ✅ `package.json` includes all dependencies
- [x] ✅ `package.json` specifies Node.js version (engines field)
- [x] ✅ `.env.example` file created
- [x] ✅ `.gitignore` excludes `.env` and `node_modules/`
- [x] ✅ Server uses `process.env.PORT` (Render requirement)
- [x] ✅ CORS configured for multiple origins
- [x] ✅ Health check endpoint exists (`/api/health`)

### 2. GitHub Repository
- [ ] Code pushed to GitHub
- [ ] Repository is public or connected to Render
- [ ] `main` branch is up to date
- [ ] All commits have descriptive messages

### 3. Documentation
- [x] ✅ `DEPLOYMENT.md` created
- [x] ✅ `README.md` updated with deployment info
- [x] ✅ `render.yaml` blueprint created (optional)

---

## 🎯 Deployment Steps

### Step 1: Push to GitHub

```bash
# Check current status
git status

# Add all changes
git add .

# Commit with message
git commit -m "Prepare backend for Render deployment"

# Push to GitHub
git push origin main
```

**Status:** ⬜ Not Started

---

### Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Verify your email

**Status:** ⬜ Not Started

---

### Step 3: Create New Web Service

1. **Click "New +" → "Web Service"**
2. **Connect GitHub:**
   - Click "Connect account" if needed
   - Authorize Render to access your repositories
   - Select your Hextris repository
   - Click "Connect"

**Status:** ⬜ Not Started

---

### Step 4: Configure Service

Fill in these settings:

#### Basic Settings
- **Name:** `hextris-server` ✏️ _(or your choice)_
- **Region:** `Oregon (US West)` ✏️ _(choose closest to users)_
- **Branch:** `main`
- **Root Directory:** `server` ⚠️ **IMPORTANT**
- **Runtime:** `Node`

#### Build & Start Commands
- **Build Command:** `npm install`
- **Start Command:** `npm start`

#### Instance Type
- **Plan:** Free ✅ (750 hours/month)

**Status:** ⬜ Not Started

---

### Step 5: Set Environment Variables

Click **"Advanced"** → Scroll to **"Environment Variables"**

Add these:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `CLIENT_URL` | `http://127.0.0.1:5500` | Update later with frontend URL |

**Status:** ⬜ Not Started

---

### Step 6: Deploy!

1. **Review all settings**
2. **Click "Create Web Service"**
3. **Wait for deployment** (2-3 minutes)
4. **Monitor logs** for errors

**Your server URL will be:**
```
https://hextris-server.onrender.com
```
_(Replace with your actual service name)_

**Status:** ⬜ Not Started

---

### Step 7: Verify Deployment

Test the health endpoint:

**Option A: Browser**
- Open: `https://hextris-server.onrender.com/api/health`
- Should see:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-02-06T...",
    "uptime": 123
  }
  ```

**Option B: Command Line**
```bash
curl https://hextris-server.onrender.com/api/health
```

**Status:** ⬜ Not Started

---

## 📝 Post-Deployment Tasks

### 1. Note Your Server URL
**My Render URL:** `https://_____________________.onrender.com`

### 2. Update Frontend Config

When you create the multiplayer client, use your Render URL:

```javascript
// src/network/MultiplayerClient.js
const SOCKET_URL = 'https://hextris-server.onrender.com'; // Your URL
this.socket = io(SOCKET_URL);
```

**Status:** ⬜ Not Started

---

### 3. Keep Server Awake (Optional)

Render free tier spins down after 15 minutes. To prevent this:

**Option A: UptimeRobot (Free)**
1. Sign up at https://uptimerobot.com
2. Add new monitor:
   - **Monitor Type:** HTTPS
   - **URL:** `https://hextris-server.onrender.com/api/health`
   - **Monitoring Interval:** 5 minutes
3. Save monitor

**Option B: Upgrade to Paid Plan**
- Render Standard: $7/month
- Always on, no spin down

**Status:** ⬜ Not Started

---

### 4. Update CORS After Frontend Deploy

Once you deploy your frontend (e.g., Netlify, Vercel):

1. Copy your frontend URL (e.g., `https://hextris.netlify.app`)
2. Go to Render Dashboard → Your Service → Environment
3. Update `CLIENT_URL`:
   ```
   CLIENT_URL=https://hextris.netlify.app
   ```
4. Save (service will auto-redeploy)

**Frontend URL:** `https://_____________________`

**Status:** ⬜ Not Started

---

## 🎉 Success Criteria

You've successfully deployed when:

- ✅ Health endpoint returns `{"status": "ok"}`
- ✅ Render dashboard shows "Live" status
- ✅ No errors in server logs
- ✅ Can connect to WebSocket from frontend (after integration)

---

## 🐛 Troubleshooting

### Issue: "Application failed to respond"
**Solution:**
- Check logs in Render dashboard
- Verify `server/package.json` exists
- Ensure `npm start` command is correct

### Issue: "Build failed"
**Solution:**
- Check for `package-lock.json` in server folder
- Try deleting it and running `npm install` locally
- Push changes and redeploy

### Issue: CORS errors in browser
**Solution:**
- Verify `CLIENT_URL` in environment variables
- Clear browser cache
- Check server logs for CORS errors

### Issue: WebSocket connection failed
**Solution:**
- Ensure frontend uses `https://` not `http://`
- Check browser console for specific error
- Verify Socket.io client version matches server

---

## 📞 Need Help?

1. **Check Render Logs:**
   - Dashboard → Your Service → Logs
   - Look for error messages

2. **Review Documentation:**
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed guide
   - [README.md](README.md) - Server architecture

3. **Render Support:**
   - https://render.com/docs
   - Community Discord

4. **Test Locally First:**
   ```bash
   cd server
   npm install
   npm start
   # Visit http://localhost:3000/api/health
   ```

---

## 🔄 Redeployment

Render auto-deploys on every push to `main`:

```bash
# Make changes
git add .
git commit -m "Update server logic"
git push origin main

# Render automatically detects and redeploys
# Check dashboard for deployment status
```

---

## ✨ Next Steps

After deployment:
1. ✅ Backend is live
2. 🎮 Test multiplayer functionality locally (connect to Render URL)
3. 🌐 Deploy frontend to Render Static or Netlify
4. 🔗 Update environment variables with frontend URL
5. 🚀 Launch and play!

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Server URL:** `https://_____________________`

**Status:** 🟡 In Progress → 🟢 Complete
