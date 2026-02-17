# Hextris - TypeScript Rewrite

Modern hexagonal falling block puzzle game built with TypeScript, Tailwind CSS, and Vite.

## 🎮 Features

- **Modern Architecture**: Clean TypeScript codebase with proper type safety
- **Black & White UI**: Minimalist design with game colors only in gameplay
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Hash-based SPA**: Fast page transitions without reloads
- **Component Library**: Reusable UI components (Button, Modal, Card, Input, Toast)
- **State Management**: Centralized state with event system
- **Game Modes**: Single Player, Multiplayer, Daily Challenge, Timer Attack
- **Special Points System**: In-game currency for power-ups and continues
- **Life System**: 3 lives with bonus lives at milestones
- **Power-ups**: Hammer, Slowmo, Shield with inventory management
- **Cloud Saves**: Appwrite integration for persistent data
- **🆕 Enhanced Multiplayer**: 
  - Room-based gameplay with unique codes
  - Custom player names for each room
  - Real-time player tracking (active/left status)
  - Toast notifications for player events
  - Comprehensive leaderboards showing all players

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type check
pnpm type-check
```

## 📁 Project Structure

```
hextris/
├── src/
│   ├── main.ts              # Entry point
│   ├── router.ts            # Hash-based router
│   ├── tailwind.css         # Tailwind imports + custom styles
│   ├── core/                # Core game architecture
│   │   ├── StateManager.ts  # Centralized state
│   │   ├── GameLoop.ts      # Render/update cycle
│   │   ├── Canvas.ts        # Canvas utilities
│   │   └── constants.ts     # Game constants
│   ├── pages/               # Page components
│   │   ├── BasePage.ts      # Abstract base class
│   │   ├── EntryPage.ts     # Name entry
│   │   ├── MenuPage.ts      # Main menu
│   │   └── ...
│   ├── ui/                  # UI components
│   │   ├── components/      # Reusable components
│   │   ├── modals/          # Modal dialogs
│   │   └── hud/             # In-game HUD elements
│   ├── entities/            # Game entities
│   ├── systems/             # Game systems
│   ├── network/             # API clients
│   ├── config/              # Configuration files
│   ├── types/               # TypeScript definitions
│   └── utils/               # Utility functions
├── public/
│   └── index.html           # HTML template
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## 🎨 Design System

### Colors

**UI Colors (Black & White)**
- Pure black (`#000000`) for primary text
- Grays (`#f9fafb` to `#111827`) for backgrounds and secondary elements
- Pure white (`#ffffff`) for cards and surfaces

**Game Colors** (used only in canvas/gameplay)
- Red: `#e74c3c`
- Yellow: `#f1c40f`
- Blue: `#3498db`
- Green: `#2ecc71`
- Hex Dark: `#2c3e50`
- Hex Light: `#34495e`

**Status Colors**
- Success: `#2ecc71`
- Warning: `#f39c12`
- Error: `#e74c3c`
- Info: `#3498db`

**NO PURPLE** - All purple colors from the original design have been removed.

### Typography

- Font: Exo 2 (Google Fonts)
- Scales: text-sm to text-6xl
- Weights: 300-900

### Components

- **Button**: 4 variants (primary, secondary, outline, ghost)
- **Modal**: Glassmorphic backdrop with centered content
- **Card**: 3 variants (default, glassmorphic, dark)
- **Input**: Validation with error states

## 🔧 Development

### Tech Stack

- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Appwrite**: Backend as a Service
- **pnpm**: Fast, disk-efficient package manager

### Code Style

- Strict TypeScript mode enabled
- ESLint for code quality
- Path aliases (`@core`, `@ui`, `@systems`, etc.)
- Modular architecture with clear separation of concerns

### Environment Variables

Create a `.env` file in the root:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
```

## 🎯 Implementation Phases

- [x] **Phase 1**: Foundation (pnpm, TS, Tailwind, configs)
- [x] **Phase 2**: Core architecture (StateManager, Router, GameLoop)
- [x] **Phase 3**: UI component library (Button, Modal, Card, Input)
- [x] **Phase 4**: Base page class and entry page
- [ ] **Phase 5**: Remaining pages (Menu, Difficulty, Game, Settings)
- [ ] **Phase 6**: Game entities (Block, Hex, PowerUp)
- [ ] **Phase 7**: Game systems (Life, Points, Matching, Physics)
- [ ] **Phase 8**: Network integration (Appwrite, Multiplayer)
- [ ] **Phase 9**: HUD elements and modals
- [ ] **Phase 10**: Polish and optimization

## 📱 Responsive Design

- **Mobile**: < 640px - Fullscreen canvas, minimal HUD
- **Tablet**: 640px-1024px - Scaled canvas, adapted HUD
- **Desktop**: > 1024px - Centered canvas, full HUD

## 🌐 Browser Support

- Chrome/Edge (Chromium) 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## 📚 Documentation

- **[MULTIPLAYER_GUIDE.md](MULTIPLAYER_GUIDE.md)**: Complete user guide for multiplayer features
- **[MULTIPLAYER_IMPLEMENTATION.md](MULTIPLAYER_IMPLEMENTATION.md)**: Technical implementation details
- **[APPWRITE_SETUP.md](APPWRITE_SETUP.md)**: Backend setup instructions

## 📄 License

MIT License - see LICENSE.md

## 🤝 Contributing

This is a rewrite project converting vanilla JS to TypeScript. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 🎮 Original Credits

Based on the original Hextris game, modernized with TypeScript and Tailwind CSS.

---

**Current Status**: Multiplayer Complete ✅ - Full room-based multiplayer with player name entry, real-time tracking, disconnect handling, and comprehensive leaderboards.
