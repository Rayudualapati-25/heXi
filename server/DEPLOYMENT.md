# Hextris Backend Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ GitHub account
- ✅ Render account (https://render.com - free tier available)
- ✅ Backend code pushed to GitHub repository
- ✅ Appwrite project configured (optional for testing)

---

## 🚀 Deployment Steps

### Step 1: Prepare Your GitHub Repository

1. **Ensure your repository structure is correct:**
   ```
   your-repo/
   ├── server/
   │   ├── server.js
   │   ├── package.json
   │   ├── .env.example
   │   └── src/
   │       ├── socket/
   │       ├── RoomManager.js
   │       └── GameRoom.js
   ├── index.html
   ├── js/
   └── ...other frontend files
   ```

2. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare backend for Render deployment"
   git push origin main
   ```

### Step 2: Create Render Web Service

1. **Go to Render Dashboard:**
   - Navigate to https://dashboard.render.com
   - Click "New" → "Web Service"

2. **Connect GitHub Repository:**
   - Click "Connect account" if not already connected
   - Select your Hextris repository
   - Click "Connect"

3. **Configure Service Settings:**
   
   **Basic Settings:**
   - **Name:** `hextris-server` (or your preferred name)
   - **Region:** Choose closest to your target audience
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

   **Instance Type:**
   - Select **Free** (includes 750 hours/month)
   - Note: Free tier spins down after 15 minutes of inactivity

4. **Set Environment Variables:**
   
   Click "Advanced" → "Add Environment Variable" and add:
   
   | Key | Value | Notes |
   |-----|-------|-------|
   | `NODE_ENV` | `production` | Sets production mode |
   | `PORT` | `10000` | Render default (auto-set) |
   | `CLIENT_URL` | `http://127.0.0.1:5500` | Update after frontend deploy |

   > **Note:** You'll update `CLIENT_URL` later with your actual frontend URL

5. **Create Web Service:**
   - Click "Create Web Service"
   - Wait for deployment (usually 2-3 minutes)
   - Monitor logs for any errors

### Step 3: Verify Deployment

1. **Check Health Endpoint:**
   - Your service will be available at: `https://hextris-server.onrender.com`
   - Test health check: `https://hextris-server.onrender.com/api/health`
   - Should return:
     ```json
     {
       "status": "ok",
       "timestamp": "2026-02-06T...",
       "uptime": 123
     }
     ```

2. **Check Logs:**
   - In Render dashboard, click on your service
   - Go to "Logs" tab
   - Look for:
     ```
     🚀 Server running on port 10000
     📡 WebSocket ready for connections
     ```

### Step 4: Update Frontend Configuration

1. **Create frontend config file** (`src/network/config.js`):
   ```javascript
   export const API_CONFIG = {
     // Development
     dev: {
       baseURL: 'http://localhost:3000',
       socketURL: 'http://localhost:3000'
     },
     // Production (Render)
     prod: {
       baseURL: 'https://hextris-server.onrender.com',
       socketURL: 'https://hextris-server.onrender.com'
     }
   };

   // Auto-detect environment
   const isDev = window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1';
   
   export const API_URL = isDev ? API_CONFIG.dev.socketURL : API_CONFIG.prod.socketURL;
   ```

2. **Update Socket.io client connection:**
   - Open `src/network/MultiplayerClient.js` (when created)
   - Use `API_URL` from config:
     ```javascript
     import { API_URL } from './config.js';
     
     this.socket = io(API_URL, {
       transports: ['websocket', 'polling'],
       reconnection: true
     });
     ```

### Step 5: Update CORS Settings

Once your frontend is deployed (e.g., on Render Static, Netlify, Vercel):

1. **Go to Render Dashboard → Your Service → Environment**
2. **Update `CLIENT_URL`:**
   ```
   CLIENT_URL=https://your-frontend-url.com
   ```
3. **Save Changes** (service will auto-redeploy)

For local development, add both URLs:
```javascript
// In server.js, update CORS:
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    process.env.CLIENT_URL
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));
```

---

## 🔧 Deploy Frontend (Optional)

### Option A: Render Static Site

1. **Render Dashboard → New → Static Site**
2. **Repository:** Same GitHub repo
3. **Settings:**
   - **Branch:** `main`
   - **Root Directory:** `.` (root)
   - **Build Command:** Empty (no build needed for vanilla JS)
   - **Publish Directory:** `.` (root)
4. **Create Static Site**
5. **Copy the URL** (e.g., `https://hextris.onrender.com`)
6. **Update backend `CLIENT_URL`** with this URL

### Option B: Netlify (Alternative)

1. **Go to https://app.netlify.com**
2. **Drag and drop your project folder** (excluding server/)
3. **Copy the URL** (e.g., `https://hextris.netlify.app`)
4. **Update Render `CLIENT_URL`**

---

## 📊 Monitoring & Troubleshooting

### Check Service Status

**Render Dashboard:**
- **Logs:** Real-time server logs
- **Metrics:** CPU, memory usage
- **Events:** Deployment history

### Common Issues

#### 1. Service Won't Start
**Error:** "Application failed to respond"
- Check logs for errors
- Verify `package.json` scripts
- Ensure `PORT` uses `process.env.PORT`

#### 2. WebSocket Connection Fails
**Error:** "WebSocket connection failed"
- Check CORS settings
- Verify `CLIENT_URL` is correct
- Ensure frontend uses correct Render URL

#### 3. Free Tier Spin Down
**Issue:** Service takes 30+ seconds to respond after inactivity

**Solutions:**
- Implement UptimeRobot ping (https://uptimerobot.com)
- Upgrade to paid Render plan ($7/month)
- Show "Waking up server..." message in frontend

**UptimeRobot Setup:**
1. Create free account
2. Add new monitor (HTTPS)
3. URL: `https://hextris-server.onrender.com/api/health`
4. Interval: 5 minutes
5. This keeps service awake

#### 4. CORS Errors
**Error:** "blocked by CORS policy"
- Add frontend URL to `CLIENT_URL` env variable
- Restart Render service
- Clear browser cache

---

## 🎯 Post-Deployment Checklist

- [ ] Backend health check responds
- [ ] WebSocket connections work
- [ ] CORS configured for frontend domain
- [ ] Environment variables set correctly
- [ ] SSL/HTTPS working (Render provides free SSL)
- [ ] Server logs show no errors
- [ ] Test room creation/joining
- [ ] Test multiplayer game session
- [ ] Update Appwrite CORS settings (if using Appwrite)

---

## 🔄 Continuous Deployment

Render automatically deploys when you push to GitHub:

```bash
# Make changes to server code
git add server/
git commit -m "Update server logic"
git push origin main

# Render will auto-detect changes and redeploy
# Check logs in Render dashboard
```

---

## 📝 Environment Variables Reference

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `NODE_ENV` | `development` | `production` | Runtime environment |
| `PORT` | `3000` | `10000` (auto) | Server port |
| `CLIENT_URL` | `http://localhost:5500` | `https://your-frontend.com` | Frontend origin for CORS |

---

## 🆘 Support Resources

- **Render Docs:** https://render.com/docs
- **Socket.io Docs:** https://socket.io/docs/v4/
- **Express Docs:** https://expressjs.com/

---

## 🎉 Success!

Your backend is now live at: `https://hextris-server.onrender.com`

Test it:
```bash
curl https://hextris-server.onrender.com/api/health
```

Next steps:
1. Deploy frontend to Render Static or Netlify
2. Update `CLIENT_URL` environment variable
3. Test multiplayer functionality
4. Share room codes with friends!
