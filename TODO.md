# 🎯 Hextris Implementation TODO

**Last Updated:** February 8, 2026  
**Overall Completion:** 85-90%  
**Status:** Core features implemented, theme expansion + UX polish in progress

---

## 📊 Quick Status Overview

| Category | Completion | Priority |
|----------|------------|----------|
| Authentication & Accounts | 95% ✅ | COMPLETE |
| HUD Integration | 90% ✅ | COMPLETE |
| Multiplayer Groups | 85% ✅ | COMPLETE |
| Game Modes | 90% ✅ | COMPLETE |
| Life System | 100% ✅ | COMPLETE |
| Power-Up Systems | 95% ✅ | COMPLETE |
| Polish & Features | 60% ⚠️ | IN PROGRESS |
| Cleanup Tasks | 90% ✅ | COMPLETE |

---

## 🔍 Repo Re-Verification Summary (Feb 8, 2026)

**Findings that need updates:**
- [ ] Update README to remove Socket.io references and EntryPage mentions, and reflect Appwrite-only multiplayer
- [ ] Remove or integrate legacy theme system (`src/config/ThemeConfig.ts`, `src/managers/ThemeManager.ts`) into the current `themes.ts` flow
- [ ] Make Settings page respect locked themes (`themesUnlocked`) and persist selection to Appwrite
- [ ] Ensure theme selection applies to game visuals beyond block colors (background/hex/text where applicable)
- [ ] Document timer attack scoring + leaderboard flow (timer attack scores currently stored in `timerAttackBest`)
- [ ] Add clear UI copy in Leaderboard/Group screens about how group scores are recorded (only when playing via "Play In Group")
- [ ] Align UI z-index layering so timer HUD, modals, and in-game HUD never overlap incorrectly on mobile

**Documentation drift:**
- [ ] README project structure lists `EntryPage.ts` and Socket.io; needs correction
- [ ] README features claim “real-time Socket.io rooms” which is no longer true

---

## 🚨 CRITICAL BLOCKERS (Fix First!)

### 🔴 BLOCKER #1: Power-Up & Special Points Systems Excluded from Build

**Current Issue:**
- Resolved: Power-up + special points systems are now included, wired, and tested

**Files Affected:**
- `tsconfig.json` (lines 36-39)
- `src/systems/PowerUpSystem.ts` (419 lines - JavaScript)
- `src/systems/SpecialPointsSystem.ts` (JavaScript)

**Tasks:**
 [x] Remove exclusions from `tsconfig.json`:
 [x] Convert `PowerUpSystem.ts` to proper TypeScript:
 [x] Convert `SpecialPointsSystem.ts` to proper TypeScript:
 [x] Integrate Power-Ups into GamePage:
 [x] Implement power-up effects
 [x] Add audio files to `public/audio/`:
  - Add proper type definitions
  - Replace `class PowerUpSystem` with typed class
  - Add interface for PowerUp entity
  - Type all methods and properties
  - Remove browser-only globals (window.gameState, etc.)
  - Export class properly
- [x] Convert `SpecialPointsSystem.ts` to proper TypeScript:
  - Add proper types
  - Connect to state manager
  - Integrate with PointsDisplay HUD
- [x] Integrate Power-Ups into GamePage:
  - Import PowerUpSystem
  - Initialize in `initCanvas()`
  - Update in game loop
  - Render power-ups
  - Add event listeners for collection/usage
  - Connect to InventoryUI
  - Implement power-up effects
- [x] Test power-up spawning and collection
- [x] Test inventory system
- [x] Test power-up activation

**Priority:** ✅ RESOLVED

---

### 🔴 BLOCKER #2: Environment Configuration Missing

**Current Issue:**
- Resolved: Appwrite environment and project configuration completed

**Tasks:**
- [x] Create `.env` file in project root
- [x] Add Appwrite configuration:
  ```env
  # Appwrite Configuration
  VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
  VITE_APPWRITE_PROJECT_ID=your_project_id_here
  VITE_APPWRITE_DATABASE_ID=your_database_id_here
  VITE_APPWRITE_USERS_COLLECTION_ID=users_collection_id
  VITE_APPWRITE_GROUPS_COLLECTION_ID=groups_collection_id
  VITE_APPWRITE_GROUPSCORES_COLLECTION_ID=groupscores_collection_id
  ```
- [x] Verify Appwrite project is created
- [x] Verify Email/Password authentication is enabled in Appwrite Console
- [x] Verify email service is configured (for password recovery)
- [x] Create database and collections in Appwrite:
  - [x] `users` collection with proper schema
  - [x] `groups` collection with proper schema
  - [x] `groupScores` collection with proper schema
- [x] Set up indexes on collections
- [x] Configure collection permissions (authenticated users can read/write)
- [x] Update `.env` with real IDs
- [x] Add `.env` to `.gitignore` (if not already)
- [x] Create `.env.example` for documentation

**Priority:** ✅ RESOLVED

---

### 🔴 BLOCKER #3: Socket.io Infrastructure Still Present

**Current Issue:**
- Resolved: Socket.io infrastructure removed and no client references remain

**Files to Delete:**
- [x] Delete entire `server/` directory (not present in repo)
- [x] Remove `socket.io-client` from `package.json` dependencies
- [x] Run `pnpm install` to update lockfile
- [x] Check for any Socket.io imports in client code
- [x] Remove or refactor `src/network/MultiplayerClient.ts` if it uses Socket.io

**Files Already Removed (Good!):**
- ✅ `render.yaml` (deployment config for Socket.io server)
- ✅ Various documentation files (CLEANUP-SUMMARY.md, etc.)

**Priority:** ✅ RESOLVED

---

## ✅ COMPLETED FEATURES (Keep for Reference)

### 🟢 Priority 1: Authentication & Account System (95% Complete)

**✅ What's Working:**
- `src/services/AuthService.ts` - Full authentication service
  - ✅ Email/password signup
  - ✅ Email/password login
  - ✅ Session management
  - ✅ Password recovery flow
  - ✅ Logout functionality
  - ✅ Session restoration on app load
- `src/pages/LoginPage.ts` - Modern login/signup page
  - ✅ Two tabs (Login/Sign Up)
  - ✅ Form validation
  - ✅ Error handling
  - ✅ Loading states
  - ✅ Forgot password link
- `src/pages/ResetPasswordPage.ts` - Password reset handling
  - ✅ Parse URL parameters (userId, secret)
  - ✅ New password form
  - ✅ Password validation
  - ✅ Success redirect
- `src/network/AppwriteClient.ts` - User data management
  - ✅ TypeScript implementation
  - ✅ Create user in database
  - ✅ Get user by ID
  - ✅ Update single player score
  - ✅ Update user stats
  - ✅ Add diamonds
  - ✅ Unlock themes
  - ✅ Global leaderboard query
- `src/network/GroupManager.ts` - Group/room system
  - ✅ Generate room codes (6-char uppercase)
  - ✅ Create group
  - ✅ Join group by room code
  - ✅ Leave group
  - ✅ Get group info with members
  - ✅ Record score in group
  - ✅ Get group leaderboard
  - ✅ Get user's groups
- `src/main.ts` - Session restoration
  - ✅ Check for existing session on app load
  - ✅ Restore user state if session valid
  - ✅ Handle session errors gracefully
- `src/router.ts` - Auth-protected routes
  - ✅ Uses AuthService for authentication checks
  - ✅ Redirects unauthenticated users to login
- `src/core/constants.ts` - Route constants
  - ✅ RESET_PASSWORD route added
- `src/types/game.d.ts` - Type definitions
  - ✅ Group interface
  - ✅ GroupScore interface
  - ✅ UIState with currentGroupId, currentGameMode, timerDuration
- `src/pages/SettingsPage.ts` - Account management
  - ✅ Logout button with confirmation
  - ✅ Clear data button with confirmation
  - ✅ Delete user data from Appwrite

**⚠️ Minor Cleanup Needed:**
- [x] Delete `src/pages/EntryPage.ts` (redundant with LoginPage.ts)
- [x] Verify EntryPage is not imported anywhere

---

### 🟢 Priority 2: HUD Components Integration (90% Complete)

**✅ What's Working:**
- `src/pages/GamePage.ts` - HUD integration
  - ✅ Imports: LivesDisplay, PointsDisplay, ScoreDisplay, InventoryUI
  - ✅ Class properties declared
  - ✅ HUD overlay container created
  - ✅ All HUD components initialized
  - ✅ Mounted to DOM
  - ✅ Updated in game loop
  - ✅ Score flash on combo
- `src/ui/hud/LivesDisplay.ts` - Lives counter
  - ✅ Shows current/max lives
  - ✅ Updates in real-time
  - ✅ Heart icons
- `src/ui/hud/PointsDisplay.ts` - Special points/diamonds
  - ✅ Shows diamond count
  - ✅ Updates in real-time
- `src/ui/hud/ScoreDisplay.ts` - Score display
  - ✅ Shows current score
  - ✅ Flash animation on combo
- `src/ui/hud/InventoryUI.ts` - Power-up inventory
  - ✅ Shows collected power-ups
  - ✅ Max 3 slots
  - ✅ Click to use

**⚠️ Verification Needed:**
- [x] Verify old HUD methods removed from GamePage:
  - [x] Check if `createHUD()` method is deleted
  - [x] Check if `scoreElement` property is deleted
  - [x] Check if `livesElement` property is deleted
  - [x] Check if old `updateHUD()` method is deleted
- [ ] Test HUD responsiveness on mobile
- [ ] Test HUD Z-index (should be above canvas)

---

### 🟢 Priority 4: Multiplayer/Group System (85% Complete)

**✅ What's Working:**
- `src/pages/MultiplayerPage.ts` - Group management
  - ✅ Three views: list, create, join
  - ✅ Create group with room code
  - ✅ Join group by code input
  - ✅ Display user's groups
  - ✅ View group leaderboard
  - ✅ Play in group context
- Router registration
  - ✅ MULTIPLAYER route registered in `main.ts`
  - ✅ Requires authentication
- `src/pages/GamePage.ts` - Group play integration
  - ✅ GroupManager imported
  - ✅ Saves to both single player and group scores on game over
  - ✅ Checks for currentGroupId in state

**❌ Missing Components:**
- [x] Create `src/ui/modals/GroupLeaderboardModal.ts`:
  - [x] Show group name and room code
  - [x] List all members with best scores
  - [x] Highlight current user
  - [x] Show rank, name, score
  - [x] "Copy Room Code" button
  - [x] "Leave Group" button
  - [x] Close button
  - [x] Style with rankings (gold/silver/bronze for top 3)
  - [x] Add copy-to-clipboard functionality

---

### 🟢 Priority 5: Game Modes Integration (90% Complete)

**✅ What's Working:**
- `src/pages/MenuPage.ts` - Mode connections
  - ✅ Daily Challenge button calls `startDailyChallenge()`
  - ✅ Timer Attack button calls `startTimerAttack()`
  - ✅ Leaderboard button calls `showLeaderboard()`
- `src/modes/DailyChallengeMode.ts` - Daily challenge system
  - ✅ Exists and implemented
- `src/modes/TimerAttackMode.ts` - Timer attack mode
  - ✅ Exists and implemented
- `src/ui/modals/DailyChallengeModal.ts` - Daily challenge modal
  - ✅ Exists and shows attempts
- `src/ui/modals/LeaderboardModal.ts` - Global leaderboard
  - ✅ Exists and shows top players

**⚠️ Verification Needed:**
- [ ] Test Daily Challenge:
  - [ ] Verify 3 attempts per day
  - [ ] Verify attempts reset at midnight
  - [ ] Verify score submission
- [ ] Test Timer Attack:
  - [ ] Verify duration selector modal works (60s/120s/180s)
  - [ ] Verify timer countdown in HUD
  - [ ] Verify game ends when timer expires
  - [ ] Verify score submission
- [ ] Test Global Leaderboard:
  - [ ] Verify top 100 players shown
  - [ ] Verify current user is highlighted
  - [ ] Verify sorting by score (descending)

---

### 🟢 Priority 6: Life System (75% Complete)

**✅ What's Working:**
- Life loss implementation
  - ✅ Lives decrease when blocks reach top
  - ✅ LivesDisplay updates in real-time
  - ✅ Game over when lives = 0
- Life constants defined
  - ✅ `MAX_LIVES = 5` in constants.ts
  - ✅ `STARTING_LIVES = 3` in constants.ts
  - ✅ `LIFE_BONUS_INTERVAL = 5000` in constants.ts

**⚠️ Needs Implementation/Verification:**
- [x] Verify bonus life award every 5000 points:
  - [x] Check if milestone tracking exists in GamePage
  - [x] Check if life is awarded at milestones
  - [x] Check if max lives cap (5) is enforced
  - [x] Check if "+1 LIFE" floating text appears
- [x] Verify `clearBlocksAndRestart()` method:
  - [x] Should clear blocks on life loss
  - [x] Should NOT restart entire game
  - [x] Should keep score and continue
- [x] Add invulnerability period after life loss
  - [x] Use `INVULNERABILITY_DURATION = 2000` from constants
  - [ ] Visual indicator (flash/pulse effect)
- [x] Test full life cycle:
  - [x] Start with 3 lives
  - [x] Lose a life -> clear blocks, continue
  - [x] Earn bonus life at 5000 points
  - [x] Lose final life -> game over

---

## ⚠️ INCOMPLETE FEATURES (Need Implementation)

### 🟠 Priority 7: Polish & Features (60% Complete)

#### 7.1 - Shop System (70% Complete)

**Status:** ⚠️ In Progress

**Tasks:**
- [ ] Create `src/pages/ShopPage.ts`:
  - [x] Show available themes with preview
  - [x] Display price in diamonds
  - [x] Show "Unlock" button if not owned
  - [x] Show "Select" button if owned
  - [x] Show current diamonds balance
  - [x] Disable button if insufficient diamonds
  - [x] Connect to `src/config/shopItems.ts`
- [x] Or create `src/ui/modals/ShopModal.ts` (alternative)
- [x] Implement unlock logic:
  - [x] Deduct diamonds from user account
  - [x] Add theme to themesUnlocked array
  - [x] Update Appwrite user document
  - [x] Update local state
  - [x] Show success message
- [x] Add Shop button to MenuPage
- [x] Wire Continue Game into game-over modal flow
- [x] Remove dev-only power-up spawn button (debug)
- [ ] Add SHOP route to constants
- [ ] Register route in main.ts
- [ ] Test full purchase flow

**Theme integration gaps:**
- [ ] SettingsPage: hide or lock themes not in `themesUnlocked`
- [ ] SettingsPage: persist selected theme to Appwrite
- [ ] Apply theme backgrounds and text colors outside canvas (menu/settings/shop)
- [ ] Theme asset pipeline (icons/backgrounds) for premium themes

**Files to Create:**
- `src/pages/ShopPage.ts` OR `src/ui/modals/ShopModal.ts`

**Dependencies:**
- `src/config/shopItems.ts` (already exists)
- `src/config/themes.ts` (already exists)

---

#### 7.2 - Audio System (60% Complete)

**Status:** ⚠️ In Progress

**Tasks:**
- [x] Create `src/managers/AudioManager.ts`:
  - [x] Singleton pattern
  - [x] Load audio files
  - [x] Play background music (looping)
  - [x] Play sound effects
  - [x] Mute toggles (music/sfx separate)
  - [x] Volume controls
- [x] Add audio files to `public/audio/`:
  - [x] game-music.mp3
  - [x] menu-music.mp3
  - [x] block-land.mp3
  - [x] match-clear.mp3
  - [x] powerup-collect.mp3
  - [x] life-lost.mp3
  - [x] game-over.mp3
- [x] Connect to SettingsPage toggles:
  - [x] Music toggle
  - [x] SFX toggle
  - [x] Volume sliders
- [x] Play sounds on game events:
  - [x] Block lands -> play block-land.mp3
  - [x] Match cleared -> play match-clear.mp3
  - [x] Power-up collected -> play powerup-collect.mp3
  - [x] Life lost -> play life-lost.mp3
  - [x] Game over -> play game-over.mp3
- [x] Add event listeners in GamePage
- [ ] Test audio on mobile browsers
- [x] Handle browser autoplay restrictions

**Files to Create:**
- `src/managers/AudioManager.ts`
- Audio files in `public/audio/` directory

---

#### 7.3 - Global Leaderboard Enhancements (95% Complete)

**Status:** ⚠️ In Progress

**What Exists:**
- ✅ `src/ui/modals/LeaderboardModal.ts` exists
- ✅ AppwriteClient has `getGlobalLeaderboard()` method
- ✅ MenuPage calls leaderboard modal

**Tasks:**
- [x] Verify LeaderboardModal features:
  - [x] Tabs: "Global", "Timer Attack", "My Groups"
  - [x] Global tab shows top players
  - [x] Pagination (10/20/50 per page)
  - [x] Current user highlighted
  - [x] My Groups tab shows user's groups
  - [x] Click group to view group leaderboard
- [x] Add filtering options (Top 10/50/100)
- [x] Add user search functionality
- [ ] Test with large dataset (100+ players)

**Missing scoreboard data fixes:**
- [ ] Verify Timer Attack scores appear in Timer tab after a run
- [ ] Verify group scores appear only after using "Play In Group"
- [ ] Add empty-state helper text in Leaderboard modal for Timer tab when no scores exist

---

## 🗑️ CLEANUP TASKS (90% Complete)

### Cleanup #1: Remove Socket.io Server (Critical)

**Status:** ✅ Done

**Tasks:**
- [x] Delete `server/` directory entirely (not present in repo):
  - Contains: server.js, package.json, node_modules, src/
  - All Socket.io + Express code
- [x] Edit `package.json` in root:
  - Remove line with `"socket.io-client": "^4.6.1"`
- [x] Run `pnpm install` to update lockfile
- [x] Search codebase for Socket.io imports:
  - `grep -r "socket.io" src/`
- [x] Refactor or delete `src/network/MultiplayerClient.ts`:
  - If it uses Socket.io, replace with GroupManager
  - Or delete if no longer needed

**Files to Delete:**
- `server/` (entire directory)

**Files to Edit:**
- `package.json` (remove socket.io-client)

---

### Cleanup #2: Remove Redundant EntryPage (Minor)

**Status:** ✅ Done

**Tasks:**
- [x] Delete `src/pages/EntryPage.ts`
- [x] Search for EntryPage imports:
  - `grep -r "EntryPage" src/`
- [x] Verify no imports exist
- [x] Verify router uses LoginPage instead

**Files to Delete:**
- `src/pages/EntryPage.ts`

---

### Cleanup #3: Verify Old HUD Code Removed (Minor)

**Status:** ✅ Done

**Tasks:**
- [x] Open `src/pages/GamePage.ts`
- [x] Search for old HUD methods:
  - [x] `createHUD()` method (should be deleted)
  - [x] `scoreElement` property (should be deleted)
  - [x] `livesElement` property (should be deleted)
  - [x] Old `updateHUD()` method (should be deleted)
- [x] If found, remove these old implementations (not needed)
- [x] Verify only new HUD components are used

---

### Cleanup #4: Remove Unused Dependencies (Low Priority)

**Status:** ⚠️ In Progress

**Tasks:**
- [x] Run `npx depcheck` to find unused dependencies
- [x] Review and remove unused packages
- [ ] Update documentation if needed

---

## 🎨 Theme Implementation Plan (Phase: Premium Themes)

**Goal:** Add premium themes (Spider/Barbie/Esports-style) with safe naming, consistent UI treatment, and persistent unlock/equip flows.

**Naming & IP safety (recommended):**
- Use non-IP names (e.g., `web-hero`, `fashion-pink`, `arena-neon`) while keeping the intended vibe
- Avoid brand logos, direct references, or copyrighted iconography

**Theme scope checklist:**
- [ ] Palette: 4 block colors, hex fill/stroke, UI text, background, accent
- [ ] UI surfaces: menus/modals/cards reflect the theme (optional toggle for "theme UI")
- [ ] HUD visibility: ensure timer, lives, score, and points remain readable
- [ ] Audio/particles (optional): map to theme config only if assets exist
- [ ] Shop cards: add preview swatches + price
- [ ] Settings grid: show lock state + equip state
- [ ] Persistence: unlock + select stored in Appwrite and restored on session load

**Theme packs (initial set):**
- [ ] Web Hero (Spider-inspired): red/blue/white with web-like accent
- [ ] Fashion Pink (Barbie-inspired): hot pink + blush + white + gold
- [ ] Esports Neon: dark slate + cyan + magenta + acid green
- [ ] Retro Arcade: deep navy + electric orange + mint + neon yellow

**Implementation order:**
1) Add theme entries to `themes.ts` + pricing
2) Wire lock/equip logic in Settings + Shop
3) Apply global theme tokens (background/text) to core pages
4) Add optional VFX (particles/sfx) per theme
5) QA: readability + contrast on mobile/desktop

---

## 🧭 UI/UX Layout Structure (Responsive, Clean)

**App shell:**
- [ ] Single-column layout with max width (menu/settings/modals)
- [ ] Sticky top system for HUD overlays inside game screen
- [ ] Consistent padding scale: 12/16/24/32 for mobile/desktop

**Page layout patterns:**
- [ ] Menu: hero title + stats row + mode grid + utility actions row
- [ ] Difficulty: back button + header + 3-card grid + primary CTA
- [ ] Multiplayer: header + tabs + card list + consistent action rows
- [ ] Settings: section cards with 2/3/4 column responsive grids
- [ ] Shop modal: two-column cards, collapses to single column on mobile

**Component behavior:**
- [ ] Buttons: primary/secondary/outline/ghost; size ladder (small/medium/large)
- [ ] Cards: consistent border radius + shadow; hover scale only on desktop
- [ ] Modals: max width per content size; scrollable body; safe-top/bottom
- [ ] HUD: pointer-events rules; z-index layering: HUD > modals > canvas

**Responsive rules:**
- [ ] Mobile-first: single column, 48px touch targets, safe-area padding
- [ ] Tablet: 2-column grids where possible; reduced motion on low-end devices
- [ ] Desktop: 2-3 column grids, larger typography, controlled max width

**Accessibility polish:**
- [ ] Color contrast check for all themes (minimum 4.5:1 for text)
- [ ] Focus states for interactive elements
- [ ] Reduced motion option respects animations

---

## 🧪 COMPREHENSIVE TESTING CHECKLIST

### Authentication Flow Tests

- [ ] **Sign Up Flow:**
  - [ ] Open app -> see LoginPage
  - [ ] Click "Sign Up" tab
  - [ ] Enter name, email, password
  - [ ] Click "Sign Up" button
  - [ ] Verify account created in Appwrite
  - [ ] Verify user document created in database
  - [ ] Verify navigation to MenuPage
  - [ ] Verify user state loaded

- [ ] **Login Flow:**
  - [ ] Open app -> see LoginPage
  - [ ] Enter existing email/password
  - [ ] Click "Login" button
  - [ ] Verify session created
  - [ ] Verify user data loaded
  - [ ] Verify navigation to MenuPage
  - [ ] Verify stats displayed correctly

- [ ] **Password Recovery Flow:**
  - [ ] Click "Forgot password?" link
  - [ ] Enter email -> submit
  - [ ] Check email inbox
  - [ ] Click recovery link
  - [ ] Open ResetPasswordPage
  - [ ] Enter new password
  - [ ] Submit -> verify success
  - [ ] Redirect to LoginPage
  - [ ] Login with new password

- [ ] **Session Restoration:**
  - [ ] Login to app
  - [ ] Close browser tab
  - [ ] Reopen app
  - [ ] Verify auto-login to MenuPage
  - [ ] Verify user data restored

- [ ] **Logout:**
  - [ ] From MenuPage, click "Logout"
  - [ ] Verify confirmation modal
  - [ ] Confirm logout
  - [ ] Verify redirect to LoginPage
  - [ ] Verify session cleared
  - [ ] Try accessing /menu directly
  - [ ] Verify redirect to login

---

### Game Mechanics Tests

- [ ] **Single Player Game:**
  - [ ] From MenuPage, click "SINGLE PLAYER"
  - [ ] Select difficulty
  - [ ] Game starts with 3 lives
  - [ ] HUD displays: score, lives, diamonds
  - [ ] Blocks fall and rotate
  - [ ] Matching system works
  - [ ] Score increases on matches
  - [ ] Combo system works
  - [ ] Life lost when blocks reach top
  - [ ] Game over when lives = 0
  - [ ] Score saved to Appwrite
  - [ ] High score updated if beaten

- [ ] **Life System:**
  - [ ] Start game with 3 lives
  - [ ] Let blocks reach top -> lose 1 life
  - [ ] Verify blocks clear (not full restart)
  - [ ] Verify score retained
  - [ ] Earn 5000 points -> gain 1 life
  - [ ] Verify max 5 lives cap
  - [ ] Lose all lives -> game over

- [ ] **Daily Challenge:**
  - [ ] Click "DAILY CHALLENGE"
  - [ ] See modal with attempts (3/3)
  - [ ] Play challenge
  - [ ] Verify difficulty preset
  - [ ] Complete -> submit score
  - [ ] Verify attempts decrease (2/3)
  - [ ] Play 2 more times
  - [ ] Verify no attempts left
  - [ ] Next day -> verify reset to 3/3

- [ ] **Timer Attack:**
  - [ ] Click "TIMER ATTACK"
  - [ ] Select duration (60s/120s/180s)
  - [ ] Game starts with timer
  - [ ] Timer counts down in HUD
  - [ ] Timer reaches 0 -> game over
  - [ ] Score submitted
  - [ ] Best time saved

---

### Multiplayer/Group Tests

- [ ] **Create Group:**
  - [ ] Navigate to "MULTIPLAYER"
  - [ ] Click "Create" tab
  - [ ] Enter group name
  - [ ] Click "Create"
  - [ ] Verify room code generated (6 chars)
  - [ ] Verify group appears in "My Groups"
  - [ ] Copy room code

- [ ] **Join Group:**
  - [ ] Open app in second browser/incognito
  - [ ] Login with different account
  - [ ] Navigate to "MULTIPLAYER"
  - [ ] Click "Join" tab
  - [ ] Enter room code
  - [ ] Click "Join"
  - [ ] Verify success message
  - [ ] Verify group appears in "My Groups"

- [ ] **Play in Group:**
  - [ ] From "My Groups", click "Play"
  - [ ] Select difficulty
  - [ ] Play game
  - [ ] Complete game
  - [ ] Verify score saved to both:
    - Single player leaderboard
    - Group leaderboard

- [ ] **Group Leaderboard:**
  - [ ] View group leaderboard
  - [ ] Verify all members shown
  - [ ] Verify sorted by score
  - [ ] Verify current user highlighted
  - [ ] Verify top 3 have special styling

- [ ] **Multiple Groups:**
  - [ ] Join 3 different groups
  - [ ] Verify all shown in "My Groups"
  - [ ] Play in Group 1 -> score saved to Group 1 only
  - [ ] Play in Group 2 -> score saved to Group 2 only
  - [ ] Verify independent leaderboards

- [ ] **Leave Group:**
  - [ ] Open group leaderboard
  - [ ] Click "Leave Group"
  - [ ] Confirm
  - [ ] Verify removed from group members
  - [ ] Verify group removed from "My Groups"

---

### Settings & Data Tests

- [ ] **Theme Selection:**
  - [ ] Open Settings
  - [ ] Click theme selector
  - [ ] Select different theme
  - [ ] Verify game colors change
  - [ ] Close and reopen app
  - [ ] Verify theme persisted

- [ ] **Audio Settings:**
  - [ ] Toggle music on/off
  - [ ] Toggle SFX on/off
  - [ ] Adjust volume sliders
  - [ ] Play game -> verify settings applied

- [ ] **Clear Data:**
  - [ ] Click "Clear Local Data"
  - [ ] Verify scary confirmation modal
  - [ ] Cancel -> nothing happens
  - [ ] Click again, confirm
  - [ ] Verify user deleted from Appwrite
  - [ ] Verify state cleared
  - [ ] Verify redirect to LoginPage
  - [ ] Try to login with old credentials -> fail

---

### Shop Tests (After Implementation)

- [ ] **Browse Shop:**
  - [ ] Open shop
  - [ ] See all available themes
  - [ ] See preview of each theme
  - [ ] See price in diamonds
  - [ ] See "Locked" or "Unlocked" status

- [ ] **Purchase Theme:**
  - [ ] Select locked theme
  - [ ] Verify price shown
  - [ ] Click "Unlock"
  - [ ] Verify diamonds deducted
  - [ ] Verify theme unlocked
  - [ ] Verify theme available in settings
  - [ ] Close and reopen app
  - [ ] Verify purchase persisted

- [ ] **Insufficient Funds:**
  - [ ] Have less diamonds than theme costs
  - [ ] Try to unlock theme
  - [ ] Verify "Unlock" button disabled
  - [ ] Verify error message

---

### Power-Up Tests (After Implementation)

- [x] **Power-Up Spawning:**
  - [x] Play game
  - [x] Reach score milestones (+100)
  - [x] Verify power-up spawns
  - [x] Verify power-up falls like block

- [x] **Power-Up Collection:**
  - [x] Move to collect power-up
  - [x] Verify added to inventory (HUD)
  - [x] Verify max 3 power-ups

- [x] **Power-Up Usage:**
  - [x] Click power-up in inventory
  - [x] Verify effect applied
  - [x] Verify power-up removed from inventory

- [x] **Power-Up Types:**
  - [x] Test each power-up type
  - [x] Verify effects work as expected

---

### Mobile/Responsive Tests

- [ ] **Mobile Layout:**
  - [ ] Test on phone screen size
  - [ ] Verify all pages responsive
  - [ ] Verify HUD readable
  - [ ] Verify buttons clickable

- [ ] **Touch Controls:**
  - [ ] Swipe to rotate hexagon
  - [ ] Tap to speed up
  - [ ] Verify touch events work

- [ ] **Mobile Performance:**
  - [ ] Game runs smoothly (30+ fps)
  - [ ] No lag during gameplay
  - [ ] Canvas renders correctly

---

### Edge Cases & Error Handling

- [ ] **Network Errors:**
  - [ ] Disconnect internet
  - [ ] Try to login -> show error
  - [ ] Try to save score -> show error
  - [ ] Reconnect -> retry works

- [ ] **Invalid Input:**
  - [ ] Sign up with invalid email
  - [ ] Sign up with short password
  - [ ] Join group with invalid code
  - [ ] Verify proper error messages

- [ ] **Session Expiry:**
  - [ ] Wait for session to expire (or simulate)
  - [ ] Try to access protected page
  - [ ] Verify redirect to login

- [ ] **Browser Compatibility:**
  - [ ] Test on Chrome
  - [ ] Test on Firefox
  - [ ] Test on Safari
  - [ ] Test on Edge

---

## 📝 APPWRITE SETUP CHECKLIST

### Project Setup

- [ ] Create Appwrite project
  - [ ] Project ID: _______________
  - [ ] Project name: "Hextris"

### Authentication Setup

- [ ] Enable Email/Password authentication
- [ ] Configure session duration (default: 365 days recommended)
- [ ] Set password requirements:
  - [ ] Minimum 8 characters
  - [ ] (Optional) Require uppercase
  - [ ] (Optional) Require numbers
- [ ] Configure email service:
  - [ ] Option 1: Use Appwrite Cloud email
  - [ ] Option 2: SMTP setup (host, port, username, password)
- [ ] Customize email templates:
  - [ ] Welcome email (optional)
  - [ ] Password recovery email
  - [ ] Verification email (if enabled)

### Database Setup

- [ ] Create database
  - [ ] Database ID: _______________
  - [ ] Database name: "HextrisGame"

### Collection: `users`

- [ ] Create collection
  - [ ] Collection ID: _______________
  - [ ] Collection name: "users"

- [ ] Add attributes:
  - [ ] `userId` - String, required (links to Auth user ID)
  - [ ] `name` - String, required, min:2, max:50
  - [ ] `email` - String, required
  - [ ] `singlePlayerHighScore` - Integer, default: 0
  - [ ] `totalDiamonds` - Integer, default: 0
  - [ ] `gamesPlayed` - Integer, default: 0
  - [ ] `totalPlayTime` - Integer, default: 0
  - [ ] `themesUnlocked` - Array, default: ['classic']
  - [ ] `selectedTheme` - String, default: 'classic'
  - [ ] `timerAttackBest` - Integer, default: 0

- [ ] Create indexes:
  - [ ] `userId` - unique, ascending
  - [ ] `email` - unique, ascending
  - [ ] `singlePlayerHighScore` - descending (for leaderboard)

- [ ] Set permissions:
  - [ ] Any authenticated user can CREATE
  - [ ] Users can READ their own document
  - [ ] Users can UPDATE their own document
  - [ ] Users can DELETE their own document

### Collection: `groups`

- [ ] Create collection
  - [ ] Collection ID: _______________
  - [ ] Collection name: "groups"

- [ ] Add attributes:
  - [ ] `roomCode` - String, required, unique, 6 chars
  - [ ] `groupName` - String, required
  - [ ] `createdBy` - String, required (userId)
  - [ ] `memberIds` - Array, required
  - [ ] `memberCount` - Integer, required
  - [ ] `isActive` - Boolean, default: true

- [ ] Create indexes:
  - [ ] `roomCode` - unique, ascending
  - [ ] `createdBy` - ascending

- [ ] Set permissions:
  - [ ] Any authenticated user can CREATE
  - [ ] Any authenticated user can READ
  - [ ] Creator can UPDATE
  - [ ] Creator can DELETE

### Collection: `groupScores`

- [ ] Create collection
  - [ ] Collection ID: _______________
  - [ ] Collection name: "groupScores"

- [ ] Add attributes:
  - [ ] `userId` - String, required
  - [ ] `groupId` - String, required
  - [ ] `userName` - String, required
  - [ ] `bestScore` - Integer, default: 0
  - [ ] `gamesPlayed` - Integer, default: 0
  - [ ] `lastPlayedAt` - DateTime
  - [ ] `difficulty` - String

- [ ] Create indexes:
  - [ ] `groupId` + `bestScore` - compound, descending (for leaderboard)
  - [ ] `userId` - ascending
  - [ ] Unique constraint: `userId` + `groupId`

- [ ] Set permissions:
  - [ ] Any authenticated user can CREATE
  - [ ] Any authenticated user can READ
  - [ ] User can UPDATE their own scores
  - [ ] User can DELETE their own scores

### CORS Settings

- [ ] Add allowed origins:
  - [ ] `http://localhost:5173` (development)
  - [ ] `http://localhost:4173` (preview)
  - [ ] Your production URL (when deployed)

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] All critical blockers resolved
- [ ] All tests passing
- [ ] No console errors
- [ ] Build succeeds: `pnpm build`
- [ ] Preview works: `pnpm preview`

### Environment Setup

- [ ] Update `.env` with production Appwrite endpoint
- [ ] Verify all environment variables set
- [ ] Do NOT commit `.env` file

### Build & Deploy

- [ ] Run production build: `pnpm build`
- [ ] Deploy to hosting (choose one):
  - [ ] Option 1: Vercel
  - [ ] Option 2: Netlify
  - [ ] Option 3: Render
  - [ ] Option 4: GitHub Pages

### Post-Deployment

- [ ] Update Appwrite CORS with production URL
- [ ] Test authentication on production
- [ ] Test game functionality on production
- [ ] Test on mobile devices
- [ ] Monitor for errors (Sentry, LogRocket, etc.)

---

## 📊 PROGRESS TRACKING

### Sprint 1: Critical Blockers (Est. 2-3 days)
- [ ] Fix Power-Up & Special Points TypeScript conversion
- [ ] Create .env file and configure Appwrite
- [ ] Remove Socket.io infrastructure
- [ ] Test authentication flow end-to-end

### Sprint 2: Missing Features (Est. 2-3 days)
- [ ] Implement Shop System
- [ ] Implement Audio System
- [x] Create GroupLeaderboardModal
- [x] Verify and fix life system bonuses
- [ ] Test all game modes

### Sprint 3: Polish & Testing (Est. 2-3 days)
- [ ] Run comprehensive test checklist
- [ ] Fix bugs found during testing
- [ ] Performance optimization
- [ ] Mobile responsive fixes
- [ ] Cross-browser testing

### Sprint 4: Deployment (Est. 1 day)
- [ ] Final build and testing
- [ ] Deploy to production
- [ ] Monitor and fix production issues

---

## 🎯 SUCCESS CRITERIA

**MVP Complete When:**
- ✅ All authentication flows work
- ✅ Single player game fully functional
- ✅ Multiplayer groups working
- ✅ Power-ups working
- ✅ Shop system working
- ✅ Audio/sound effects working
- ✅ All game modes working
- ✅ Mobile responsive
- ✅ No critical bugs
- ✅ Deployed to production

---

## 📞 NOTES & QUESTIONS

### Known Issues
- Power-Up systems excluded from TypeScript build (critical)
- Socket.io infrastructure still present (cleanup needed)
- No .env file (blocks authentication)
- EntryPage.ts redundant with LoginPage.ts

### Open Questions
- [ ] Which hosting platform to use for deployment?
- [ ] Should shop be a full page or a modal?
- [ ] Audio files: where to source/create them?
- [ ] Privacy policy & terms of service needed?

### Future Enhancements (Post-MVP)
- Tournament system
- Season rewards
- Social features (friend system)
- Achievements system
- Player profiles
- Custom skins/effects
- Twitch integration
- Discord bot

---

**Last Updated:** February 8, 2026  
**Next Review:** After completing Sprint 1 (Critical Blockers)
