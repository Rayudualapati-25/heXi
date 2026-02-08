# Hextris Server

🎮 Multiplayer game server for Hextris - built with Node.js, Express, and Socket.io

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5500
   ```

3. **Start server:**
   ```bash
   # Development (with auto-reload)
   npm run dev
   
   # Production
   npm start
   ```

4. **Test health endpoint:**
   ```bash
   curl http://localhost:3000/api/health
   ```

## 📦 Deploy to Render

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Set root directory: `server`
5. Deploy!

Your server will be live at: `https://your-service.onrender.com`

## 🏗️ Architecture

```
server/
├── server.js              # Main Express + Socket.io server
├── package.json           # Dependencies
├── .env.example           # Environment template
└── src/
    ├── socket/
    │   └── index.js       # Socket.io event handlers
    ├── RoomManager.js     # Room creation & management
    └── GameRoom.js        # Individual game room logic
```

## 🔌 API Endpoints

### REST API

- **GET `/api/health`** - Health check endpoint
  ```json
  {
    "status": "ok",
    "timestamp": "2026-02-06T12:00:00.000Z",
    "uptime": 123.45
  }
  ```

### WebSocket Events

**Client → Server:**
- `createRoom` - Create new multiplayer room
- `joinRoom` - Join existing room by code
- `gameState` - Send player's game state update
- `disconnect` - Player leaves room

**Server → Client:**
- `roomCreated` - Room created successfully (returns code)
- `roomJoined` - Successfully joined room
- `playerJoined` - Another player joined
- `playerLeft` - Player left the room
- `gameStarted` - Game countdown/start
- `leaderboardUpdate` - Real-time leaderboard data
- `gameEnded` - Game finished with final rankings

## 🛠️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Runtime environment |
| `CLIENT_URL` | Yes | - | Frontend URL (for CORS) |

### CORS Configuration

Edit `server.js` to allow multiple origins:
```javascript
app.use(cors({
  origin: [
    'http://localhost:5500',
    'https://your-frontend.com'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));
```

## 🧪 Testing

### Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

### Test WebSocket Connection
```javascript
// In browser console
const socket = io('http://localhost:3000');
socket.on('connect', () => console.log('Connected!'));
```

## 📊 Room Management

### Room Lifecycle
1. **Creation** - Host creates room → 6-character code generated
2. **Joining** - Players join with code (max 8 players)
3. **Waiting** - Lobby state, players can join
4. **Locked** - Game started, no new players
5. **Playing** - Game in progress, leaderboard updates
6. **Finished** - Results sent, room remains for rematch
7. **Cleanup** - Auto-deleted after 1 hour or when empty

### Room Code Format
- **Length:** 6 characters
- **Characters:** Uppercase letters + numbers (A-Z, 0-9)
- **Example:** `ABC123`, `XYZ789`
- **Collision handling:** Regenerates if duplicate

## 🔐 Security Features

- ✅ Rate limiting on room creation
- ✅ Input validation for room codes
- ✅ CORS protection
- ✅ Graceful error handling
- ✅ Auto-cleanup of abandoned rooms
- ⚠️ Anti-cheat validation (basic)

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or change PORT in .env
```

### WebSocket connection fails
- Verify CORS settings
- Check firewall rules
- Ensure client uses correct URL
- Check browser console for errors

### Room codes not working
- Check RoomManager logs
- Verify room hasn't expired
- Ensure room capacity not exceeded

## 📚 Dependencies

- **express** (^4.18.2) - Web framework
- **socket.io** (^4.6.1) - Real-time communication
- **cors** (^2.8.5) - CORS middleware
- **dotenv** (^16.3.1) - Environment variables

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues:** GitHub Issues
- **Socket.io Docs:** https://socket.io/docs/v4/

---

Made with ❤️ for Hextris
