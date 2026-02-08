# Hextris - Multiplayer Enhanced Edition 🎮

<img src="images/twitter-opengraph.png" width="200px"><br>

An addictive hexagonal puzzle game inspired by Tetris, now with **multiplayer support**, **user accounts**, **difficulty levels**, **lives system**, and more!

**Original Game:** [www.hextris.io](http://www.hextris.io)

---

## ✨ New Features

### ✅ Implemented
- **👤 User Account System** - Name-based accounts with Appwrite
- **📊 User Stats Panel** - Real-time high score tracking
- **⚙️ Difficulty Levels** - Easy, Medium, Hard (different spawn rates & speeds)
- **❤️ Lives System** - 3 lives per game, bonus lives every 5000 points
- **🎨 Modern UI** - Glass morphism design
- **💾 Persistent Data** - Your stats save across sessions
- **🖥️ Multiplayer Backend** - Node.js + Socket.io server ready

### 🚧 Coming Soon
- **👥 Multiplayer Rooms** - Play with up to 8 friends
- **🏆 Live Leaderboards** - Real-time rankings
- **🎨 Custom Themes** - Spiderman, Avengers, Barbie
- **⚡ Power-ups** - Hammer, freeze, and more

---

## 🚀 Quick Start

### Play Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/hextris.git
   cd hextris
   ```

2. **Set up Appwrite:**
   - Create account at https://cloud.appwrite.io
   - Create new project "Hextris"
   - Create database with "users" collection
   - Update `src/config.js` with your credentials

3. **Start development server:**
   ```bash
   # Python
   python -m http.server 5500
   
   # Or Node.js
   npx live-server --port=5500
   ```

4. **Configure Appwrite CORS:**
   - Go to Appwrite Console → Settings → Platforms
   - Add platform: `http://127.0.0.1:5500`

5. **Open browser:**
   - Navigate to http://127.0.0.1:5500
   - Enter your name and start playing!

### Start Backend (Multiplayer)

```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:3000
```

---

## 🎮 How to Play

1. **Enter Your Name** - First-time setup
2. **Choose Difficulty:**
   - 🌱 Easy - Slower blocks (5s spawn)
   - ⚡ Medium - Normal speed (3.5s)
   - 🔥 Hard - Fast challenge (2.5s)
3. **Controls:**
   - **Arrow Keys** or **A/D** - Rotate hexagon
   - **Down Arrow** or **S** - Speed up blocks
4. **Survive:** Match colors, avoid filling the outer ring!

---

## 🚀 Deploy Backend to Render

### Quick Deploy

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy backend"
   git push origin main
   ```

2. **Create Render Web Service:**
   - Go to https://dashboard.render.com
   - New → Web Service
   - Connect repository
   - Settings:
     - **Root Directory:** `server`
     - **Build:** `npm install`
     - **Start:** `npm start`

3. **Add Environment Variables:**
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: Your frontend URL

See [server/DEPLOYMENT.md](server/DEPLOYMENT.md) for detailed instructions.

---

## 📁 Project Structure

```
hextris/
├── index.html              # Main game
├── src/
│   ├── config.js           # Appwrite config
│   └── network/
│       └── AppwriteClient.js
├── js/
│   ├── life-system.js      # 3 lives system
│   ├── difficulty-config.js # Difficulty levels
│   ├── name-entry.js       # User login
│   └── ...game files
├── server/                 # Multiplayer backend
│   ├── server.js           # Express + Socket.io
│   ├── src/
│   │   ├── RoomManager.js
│   │   └── GameRoom.js
│   └── DEPLOYMENT.md
└── style/                  # CSS files
```

---

## 🛠️ Tech Stack

**Frontend:** Vanilla JS, HTML5 Canvas, Appwrite SDK  
**Backend:** Node.js, Express, Socket.io  
**Database:** Appwrite Cloud  
**Hosting:** Render (backend), Netlify/Render Static (frontend)

---

## 🎯 Difficulty Levels

| Level | Speed | Spawn Time | Colors | Score Multiplier |
|-------|-------|------------|--------|------------------|
| Easy  | 0.5x  | 5.0s       | 3      | 0.8x             |
| Medium| 1.0x  | 3.5s       | 4      | 1.0x             |
| Hard  | 1.8x  | 2.5s       | 5      | 1.5x             |

---

## 🐛 Troubleshooting

**"Appwrite connection failed"**
- Add your URL to Appwrite Console → Settings → Platforms
- Example: `http://127.0.0.1:5500`

**CORS Errors**
- Verify platform added in Appwrite
- Clear browser cache

**Lives Not Working**
- Check browser console for errors
- Ensure scripts load in correct order

---

## 🌟 Original Credits

Created by:
- Logan Engstrom ([@lengstrom](http://loganengstrom.com/))
- Garrett Finucane ([@garrettdreyfus](http://github.com/garrettdreyfus))
- Noah Moroze ([@nmoroze](http://github.com/nmoroze))
- Michael Yang ([@themichaelyang](http://github.com/themichaelyang))

### Enhanced by
- Multiplayer & Features: [Your Name]
- Powered by: Appwrite, Render, Socket.io

---

## 📜 License

Original Hextris: GNU General Public License v3.0  
Enhancements: MIT License

Copyright (C) 2018 Logan Engstrom (Original)  
Copyright (C) 2026 [Your Name] (Enhancements)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

See <https://www.gnu.org/licenses/> for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push: `git push origin feature/name`
5. Open Pull Request

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/hextris/issues)
- **Documentation:** [server/DEPLOYMENT.md](server/DEPLOYMENT.md)
- **Original Presskit:** http://hextris.github.io/presskit/info.html

---

Made with ❤️ for puzzle game enthusiasts
