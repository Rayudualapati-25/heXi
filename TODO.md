# 🎯 Hextris Implementation TODO

**Last Updated:** February 7, 2026  
**Status:** 70% Complete - Integration & Multiplayer Rework Needed

---

## 📋 Implementation Plan Overview

### **Architecture Change: No Socket.io**
- ❌ **Remove**: Real-time multiplayer with Socket.io
- ✅ **Keep**: Group/Room system for leaderboard comparison
- ✅ **Data**: All user data persists permanently in Appwrite
- ✅ **Auth**: Secure email/password authentication with sessions

### **Authentication Flow**
```
New User:
1. Visit Login Page → Click "Sign Up" tab
2. Enter name, email, password → Click "Sign Up"
3. Appwrite creates Auth account → Creates session
4. App creates user record in database → Loads data into state
5. Navigate to Menu → Play game

Existing User:
1. Visit Login Page → Enter email, password → Click "Login"
2. Appwrite validates credentials → Creates session
3. App loads user data from database → Restores state
4. Navigate to Menu → Continue playing

Forgot Password:
1. Login Page → Click "Forgot password?"
2. Enter email → Appwrite sends recovery email
3. Click link in email → Open reset password page
4. Enter new password → Appwrite updates password
5. Redirect to login → Login with new password

Session Management:
- Session stored in secure HTTP-only cookie (Appwrite)
- Persists for 365 days (configurable)
- Auto-login on app reload if session valid
- Logout clears session and redirects to login
```

### **Data Architecture**
```
Appwrite Auth (Built-in)
  ├─ User ID
  ├─ Email (unique)
  ├─ Password (hashed)
  └─ Sessions

Appwrite Database (Custom)
  ├─ users collection (game data)
  │   └─ Links to Auth via userId
  ├─ groups collection (multiplayer rooms)
  └─ groupScores collection (leaderboards)
```

### **Multiplayer Concept**
- Users create/join groups using room codes
- Each player plays their own separate game (no real-time interaction)
- Group leaderboard shows best scores of all members
- Users can join multiple groups simultaneously

---

## 🔴 PRIORITY 1: Appwrite Authentication & Account System (Essential)

**Quick Start Guide for Authentication:**
1. **Appwrite Console** → Enable Email/Password authentication
2. **Create** `AuthService.ts` → Handle login/signup/logout
3. **Rename** `EntryPage.ts` → `LoginPage.ts` with login/signup tabs
4. **Create** `ResetPasswordPage.ts` → Handle password recovery
5. **Update** `main.ts` → Check session on app load
6. **Update** `router.ts` → Use AuthService for auth checks
7. **Update** `AppwriteClient.ts` → Work with authenticated users
8. **Test** → Full auth flow (signup → login → logout → password reset)

---

### 1.1 - Setup Appwrite Authentication
**File:** Appwrite Console (Manual Setup)

**Authentication Settings:**
- [ ] Enable Email/Password authentication method
- [ ] Configure session settings (default: 365 days)
- [ ] Optional: Enable OAuth providers (Google, GitHub, etc.)
- [ ] Set password requirements (min 8 chars, etc.)
- [ ] Configure email templates for verification/recovery

**Tasks:**
- [ ] Enable authentication in Appwrite Console
- [ ] Configure session duration
- [ ] Set up email service (SMTP or Appwrite Cloud email)
- [ ] Customize email templates (optional)

---

### 1.2 - Create AuthService
**File:** `src/services/AuthService.ts` (NEW)

**Purpose:** Handle all authentication operations

**Implementation:**
```typescript
import { Client, Account, ID } from 'appwrite';
import { stateManager } from '@core/StateManager';
import { ROUTES } from '@core/constants';

export interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface Session {
  userId: string;
  email: string;
  name: string;
  sessionId: string;
}

export class AuthService {
  private client: Client;
  private account: Account;
  private currentSession: Session | null = null;

  constructor() {
    this.client = new Client()
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
    
    this.account = new Account(this.client);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.account.get();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      const user = await this.account.get();
      this.currentSession = {
        userId: user.$id,
        email: user.email,
        name: user.name,
        sessionId: user.$id // Session ID from user object
      };
      return this.currentSession;
    } catch (error) {
      console.error('No active session:', error);
      return null;
    }
  }

  /**
   * Sign up new user
   */
  async signUp(credentials: AuthCredentials): Promise<Session> {
    try {
      // Create account
      const user = await this.account.create(
        ID.unique(),
        credentials.email,
        credentials.password,
        credentials.name
      );

      // Automatically log in after signup
      await this.account.createEmailSession(
        credentials.email,
        credentials.password
      );

      this.currentSession = {
        userId: user.$id,
        email: user.email,
        name: user.name || 'Player',
        sessionId: user.$id
      };

      return this.currentSession;
    } catch (error: any) {
      console.error('Sign up failed:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  }

  /**
   * Log in existing user
   */
  async login(credentials: AuthCredentials): Promise<Session> {
    try {
      // Create email session
      await this.account.createEmailSession(
        credentials.email,
        credentials.password
      );

      // Get user details
      const user = await this.account.get();

      this.currentSession = {
        userId: user.$id,
        email: user.email,
        name: user.name,
        sessionId: user.$id
      };

      return this.currentSession;
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.message || 'Invalid email or password');
    }
  }

  /**
   * Log out user
   */
  async logout(): Promise<void> {
    try {
      await this.account.deleteSession('current');
      this.currentSession = null;
      
      // Clear state
      stateManager.setState('player', {
        id: '',
        name: '',
        highScore: 0,
        specialPoints: 0,
        gamesPlayed: 0,
        totalPlayTime: 0,
        themesUnlocked: ['classic'],
        selectedTheme: 'classic',
      });
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Update user name
   */
  async updateName(name: string): Promise<void> {
    try {
      await this.account.updateName(name);
      if (this.currentSession) {
        this.currentSession.name = name;
      }
    } catch (error) {
      console.error('Failed to update name:', error);
      throw error;
    }
  }

  /**
   * Update password
   */
  async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await this.account.updatePassword(newPassword, oldPassword);
    } catch (error) {
      console.error('Failed to update password:', error);
      throw error;
    }
  }

  /**
   * Send password recovery email
   */
  async recoverPassword(email: string): Promise<void> {
    try {
      const redirectUrl = `${window.location.origin}/#/reset-password`;
      await this.account.createRecovery(email, redirectUrl);
    } catch (error) {
      console.error('Password recovery failed:', error);
      throw error;
    }
  }

  /**
   * Complete password recovery
   */
  async completePasswordRecovery(
    userId: string,
    secret: string,
    newPassword: string
  ): Promise<void> {
    try {
      await this.account.updateRecovery(userId, secret, newPassword, newPassword);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Delete account
   */
  
  async deleteAccount(): Promise<void> {
    try {
      // Note: Appwrite doesn't have direct user deletion from client
      // You'll need to implement this via Appwrite Functions or Admin SDK
      // For now, just logout
      await this.logout();
    } catch (error) {
      console.error('Account deletion failed:', error);
      throw error;
    }
  }
}

// Singleton instance
export const authService = new AuthService();
```

**Tasks:**
- [ ] Create AuthService.ts with all methods
- [ ] Add proper error handling
- [ ] Test all authentication flows
- [ ] Add session persistence check on app load

---

### 1.3 - Update EntryPage to LoginPage
**File:** `src/pages/EntryPage.ts` → Rename to `LoginPage.ts`

**New Design:**
- [ ] Two tabs: "Login" and "Sign Up"
- [ ] Login tab:
  - Email input
  - Password input
  - "Remember me" checkbox
  - "Login" button
  - "Forgot password?" link
- [ ] Sign Up tab:
  - Name input
  - Email input
  - Password input
  - Confirm password input
  - "Sign Up" button
- [ ] Show loading states
- [ ] Show error messages
- [ ] Validate inputs

**Implementation:**
```typescript
export class LoginPage extends BasePage {
  private currentTab: 'login' | 'signup' = 'login';
  
  private async handleLogin(email: string, password: string): Promise<void> {
    try {
      this.showLoading();
      
      // Authenticate with Appwrite
      const session = await authService.login({ email, password });
      
      // Load user data from database
      const appwriteClient = new AppwriteClient();
      const user = await appwriteClient.getUserById(session.userId);
      
      // Update state
      stateManager.updatePlayer({
        id: user.$id,
        name: user.name,
        highScore: user.singlePlayerHighScore,
        specialPoints: user.totalDiamonds,
        // ... other fields
      });
      
      // Navigate to menu
      Router.getInstance().navigate(ROUTES.MENU);
      
    } catch (error: any) {
      this.showError(error.message || 'Login failed');
    } finally {
      this.hideLoading();
    }
  }
  
  private async handleSignUp(
    name: string, 
    email: string, 
    password: string
  ): Promise<void> {
    try {
      this.showLoading();
      
      // Create Appwrite account
      const session = await authService.signUp({ email, password, name });
      
      // Create user record in database
      const appwriteClient = new AppwriteClient();
      const user = await appwriteClient.createUser(session.userId, name);
      
      // Update state
      stateManager.updatePlayer({
        id: user.$id,
        name: user.name,
        highScore: 0,
        specialPoints: 0,
        // ... other fields
      });
      
      // Navigate to menu
      Router.getInstance().navigate(ROUTES.MENU);
      
    } catch (error: any) {
      this.showError(error.message || 'Sign up failed');
    } finally {
      this.hideLoading();
    }
  }
  
  private async handleForgotPassword(): Promise<void> {
    const email = await this.promptEmail();
    if (!email) return;
    
    try {
      await authService.recoverPassword(email);
      this.showSuccess('Recovery email sent! Check your inbox.');
    } catch (error: any) {
      this.showError(error.message || 'Failed to send recovery email');
    }
  }
}
```

**Tasks:**
- [ ] Rename EntryPage.ts to LoginPage.ts
- [ ] Add tab switching UI
- [ ] Implement login form
- [ ] Implement signup form
- [ ] Add forgot password flow
- [ ] Add form validation
- [ ] Update router to use LoginPage

---

### 1.4 - Create Password Reset Page
**File:** `src/pages/ResetPasswordPage.ts` (NEW)

**Purpose:** Handle password reset from email link

**Features:**
- [ ] Parse userId and secret from URL
- [ ] New password input
- [ ] Confirm password input
- [ ] "Reset Password" button
- [ ] Validation (match passwords, strength check)
- [ ] Success message → redirect to login

**Implementation:**
```typescript
export class ResetPasswordPage extends BasePage {
  private userId: string = '';
  private secret: string = '';
  
  constructor(container: HTMLElement, params: Record<string, string>) {
    super(container, params);
    this.userId = params.userId || '';
    this.secret = params.secret || '';
  }
  
  private async handleResetPassword(newPassword: string): Promise<void> {
    try {
      await authService.completePasswordRecovery(
        this.userId,
        this.secret,
        newPassword
      );
      
      this.showSuccess('Password reset successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        Router.getInstance().navigate(ROUTES.ENTRY);
      }, 2000);
      
    } catch (error: any) {
      this.showError(error.message || 'Password reset failed');
    }
  }
}
```

**Tasks:**
- [ ] Create ResetPasswordPage.ts
- [ ] Parse URL parameters
- [ ] Implement reset form
- [ ] Add validation
- [ ] Register in router

---

### 1.5 - Add Session Check on App Load
**File:** `src/main.ts`

**Purpose:** Check for existing session on app load

**Add before router initialization:**
```typescript
import { authService } from '@/services/AuthService';
import { AppwriteClient } from '@network/AppwriteClient';

async function init(): Promise<void> {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    throw new Error('App container not found');
  }

  // Check for existing session
  const session = await authService.getCurrentSession();
  
  if (session) {
    // User is logged in, load their data
    try {
      const appwriteClient = new AppwriteClient();
      const user = await appwriteClient.getUserById(session.userId);
      
      // Restore state
      stateManager.updatePlayer({
        id: user.$id,
        name: user.name,
        highScore: user.singlePlayerHighScore,
        specialPoints: user.totalDiamonds,
        gamesPlayed: user.gamesPlayed,
        totalPlayTime: user.totalPlayTime,
        themesUnlocked: user.themesUnlocked,
        selectedTheme: user.selectedTheme,
      });
      
      console.log('✅ Session restored for:', user.name);
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Session exists but data load failed, logout
      await authService.logout();
    }
  }

  // Initialize router
  const router = Router.init(appContainer);
  
  // ... rest of router setup
}
```

**Tasks:**
- [ ] Import AuthService in main.ts
- [ ] Check session on app load
- [ ] Restore user state if session exists
- [ ] Handle session errors gracefully

---

### 1.6 - Update Router Authentication
**File:** `src/router.ts`

**Update authentication check:**
```typescript
private async handleRouteChange(): Promise<void> {
  const hash = window.location.hash.slice(1) || '/';
  const [path, queryString] = hash.split('?');
  const params = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {};

  const route = this.routes.get(path);

  if (!route) {
    console.warn(`Route not found: ${path}`);
    this.navigate('/');
    return;
  }

  // Check authentication requirement
  if (route.requiresAuth) {
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      console.warn('Authentication required, redirecting to login');
      this.navigate('/'); // Redirect to login
      return;
    }
  }

  // ... rest of route handling
}
```

**Tasks:**
- [ ] Import AuthService in router
- [ ] Update authentication check to use AuthService
- [ ] Remove old player.name check

---

### 1.7 - Add Logout to Settings
**File:** `src/pages/SettingsPage.ts`

**Add logout button:**
```typescript
private async handleLogout(): Promise<void> {
  const confirmed = await this.showConfirmation(
    'Log Out',
    'Are you sure you want to log out?'
  );
  
  if (!confirmed) return;
  
  try {
    await authService.logout();
    Router.getInstance().navigate(ROUTES.ENTRY);
  } catch (error) {
    console.error('Logout failed:', error);
    this.showError('Failed to log out. Please try again.');
  }
}
```

**Tasks:**
- [ ] Add logout button to Account section
- [ ] Implement logout handler
- [ ] Add confirmation modal
- [ ] Clear state on logout

---

### 1.8 - Appwrite Database Schema Setup
**File:** Appwrite Console (Manual Setup)

**Collections Needed:**

#### **Collection: `users`**
```json
{
  "$id": "unique_id (same as Appwrite Auth userId)",
  "userId": "string (required, Appwrite Auth user ID)",
  "name": "string (required, min:2, max:50)",
  "email": "string (required, from Appwrite Auth)",
  "singlePlayerHighScore": "integer (default: 0)",
  "totalDiamonds": "integer (default: 0)",
  "gamesPlayed": "integer (default: 0)",
  "totalPlayTime": "integer (default: 0, in seconds)",
  "themesUnlocked": "array (default: ['classic'])",
  "selectedTheme": "string (default: 'classic')",
  "createdAt": "datetime",
  "lastLoginAt": "datetime"
}
```
**Indexes:**
- `userId` (unique, ascending) - links to Appwrite Auth
- `email` (unique, ascending) - for lookups
- `singlePlayerHighScore` (descending) - for global leaderboard

**Note:** This collection stores game data. Authentication is handled separately by Appwrite Auth.

#### **Collection: `groups`**
```json
{
  "$id": "unique_id",
  "roomCode": "string (required, unique, 6 chars, uppercase)",
  "groupName": "string (required)",
  "createdBy": "string (userId)",
  "memberIds": "array (userIds)",
  "memberCount": "integer",
  "createdAt": "datetime",
  "isActive": "boolean (default: true)"
}
```
**Indexes:**
- `roomCode` (unique, ascending)
- `createdBy` (ascending)

#### **Collection: `groupScores`**
```json
{
  "$id": "unique_id",
  "userId": "string (required)",
  "groupId": "string (required)",
  "userName": "string (for display)",
  "bestScore": "integer (default: 0)",
  "gamesPlayed": "integer (default: 0)",
  "lastPlayedAt": "datetime",
  "difficulty": "string (easy/medium/hard)"
}
```
**Indexes:**
- `groupId` + `bestScore` (compound, descending) - for leaderboard
- `userId` (ascending)
- Unique constraint: `userId` + `groupId`

**Tasks:**
- [ ] Create 3 collections in Appwrite Console
- [ ] Set up indexes for query performance
- [ ] Configure permissions (any authenticated user can read/write)
- [ ] Update `.env` with collection IDs

---

### 1.9 - Update AppwriteClient.ts
**File:** `src/network/AppwriteClient.ts`

**Changes Needed:**
- [ ] Rewrite from JavaScript class to TypeScript
- [ ] Add proper type definitions
- [ ] Work with authenticated users (receive userId from AuthService)
- [ ] Implement methods:
  - `createUser(userId: string, name: string, email: string): Promise<User>`
  - `getUserById(userId: string): Promise<User | null>`
  - `updateSinglePlayerScore(userId: string, score: number): Promise<void>`
  - `updateUserStats(userId: string, stats: Partial<UserStats>): Promise<void>`
  - `addDiamonds(userId: string, amount: number): Promise<void>`
  - `unlockTheme(userId: string, theme: string): Promise<void>`
  - `getGlobalLeaderboard(limit: number): Promise<LeaderboardEntry[]>`

**Implementation:**
```typescript
import { Client, Databases, ID, Query } from 'appwrite';
import type { User, UserStats, LeaderboardEntry } from '@types/game';

export class AppwriteClient {
  private client: Client;
  private databases: Databases;
  private databaseId: string;
  private usersCollectionId: string;
  
  constructor() {
    this.client = new Client()
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
    
    this.databases = new Databases(this.client);
    this.databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    this.usersCollectionId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
  }
  
  // ... implement all methods
}
```

---

### 1.10 - Update Route Constants
**File:** `src/core/constants.ts`

**Add new route:**
```typescript
export const ROUTES = {
  ENTRY: '/',
  RESET_PASSWORD: '/reset-password',
  MENU: '/menu',
  DIFFICULTY: '/difficulty',
  GAME: '/game',
  MULTIPLAYER: '/multiplayer',
  SETTINGS: '/settings',
} as const;
```

**Tasks:**
- [ ] Add RESET_PASSWORD route
- [ ] Export for use in other files

---

### 1.11 - Create GroupManager for Room System
**File:** `src/network/GroupManager.ts` (NEW)

**Functionality:**
- [ ] Create group with room code (6-char random uppercase)
- [ ] Join group by room code
- [ ] Leave group
- [ ] Get group members
- [ ] Record score in group
- [ ] Get group leaderboard
- [ ] List user's groups

**Methods:**
```typescript
export class GroupManager {
  private appwrite: AppwriteClient;
  
  // Generate 6-character room code (e.g., "GAME42")
  generateRoomCode(): string;
  
  // Create new group
  async createGroup(userId: string, groupName: string): Promise<Group>;
  
  // Join existing group
  async joinGroup(userId: string, userName: string, roomCode: string): Promise<Group>;
  
  // Leave group
  async leaveGroup(userId: string, groupId: string): Promise<void>;
  
  // Get group info with members
  async getGroupInfo(groupId: string): Promise<GroupWithMembers>;
  
  // Record score for user in group
  async recordGroupScore(
    userId: string, 
    userName: string,
    groupId: string, 
    score: number,
    difficulty: string
  ): Promise<void>;
  
  // Get group leaderboard (sorted by best score)
  async getGroupLeaderboard(groupId: string): Promise<GroupScore[]>;
  
  // Get all groups user is in
  async getUserGroups(userId: string): Promise<Group[]>;
}
```

---

### 1.12 - Register New Routes in Router
**File:** `src/main.ts`

**Update route registration:**
```typescript
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { LoginPage } from './pages/LoginPage'; // Renamed from EntryPage

router.registerRoutes([
  {
    path: ROUTES.ENTRY,
    page: LoginPage, // Updated
    requiresAuth: false,
  },
  {
    path: ROUTES.RESET_PASSWORD, // NEW
    page: ResetPasswordPage,
    requiresAuth: false,
  },
  {
    path: ROUTES.MENU,
    page: MenuPage,
    requiresAuth: true,
  },
  // ... rest of routes
]);
```

**Tasks:**
- [ ] Import LoginPage (renamed from EntryPage)
- [ ] Import ResetPasswordPage
- [ ] Register reset password route
- [ ] Update entry route to use LoginPage

---

---

## 🟡 PRIORITY 2: Integrate HUD Components (Quick Win)

**Note:** These tasks remain the same, but ensure authenticated user context is available.

### 2.1 - Import HUD in GamePage
**File:** `src/pages/GamePage.ts`

**Add imports (top of file):**
```typescript
import { 
  LivesDisplay, 
  PointsDisplay, 
  ScoreDisplay, 
  InventoryUI 
} from '@ui/hud';
```

**Add class properties:**
```typescript
private livesDisplay!: LivesDisplay;
private pointsDisplay!: PointsDisplay;
private scoreDisplay!: ScoreDisplay;
private inventoryUI!: InventoryUI;
```

**Tasks:**
- [ ] Add imports
- [ ] Add class properties
- [ ] Initialize in `initCanvas()` method
- [ ] Update in `update()` method
- [ ] Connect to state events

---

### 2.2 - Initialize HUD Components
**File:** `src/pages/GamePage.ts` → `initCanvas()` method

**Add after canvas creation:**
```typescript
// Create HUD overlay container
const hudContainer = document.createElement('div');
hudContainer.className = 'absolute inset-0 pointer-events-none';
hudContainer.id = 'hud-overlay';
canvasContainer.appendChild(hudContainer);

// Make HUD elements clickable
const hudStyle = document.createElement('style');
hudStyle.textContent = `#hud-overlay > * { pointer-events: auto; }`;
document.head.appendChild(hudStyle);

// Initialize HUD components
const state = stateManager.getState();
this.livesDisplay = new LivesDisplay(state.game.lives);
this.pointsDisplay = new PointsDisplay(state.player.specialPoints);
this.scoreDisplay = new ScoreDisplay(state.game.score);
this.inventoryUI = new InventoryUI(3);

// Mount to overlay
this.livesDisplay.mount(hudContainer);
this.pointsDisplay.mount(hudContainer);
this.scoreDisplay.mount(hudContainer);
this.inventoryUI.mount(hudContainer);
```

**Tasks:**
- [ ] Add HUD container to canvas
- [ ] Initialize all HUD components
- [ ] Mount to DOM

---

### 2.3 - Update HUD in Game Loop
**File:** `src/pages/GamePage.ts` → `update()` method

**Add at end of update method:**
```typescript
// Update HUD displays
const state = stateManager.getState();
this.scoreDisplay.setScore(state.game.score);
this.livesDisplay.setLives(state.game.lives);

// Calculate and update special points (1 point per 100 score)
const specialPoints = Math.floor(state.game.score / 100);
this.pointsDisplay.setPoints(specialPoints);

// Flash score on combo
if (result.combo > 1) {
  this.scoreDisplay.flashCombo();
}
```

**Tasks:**
- [ ] Update score display
- [ ] Update lives display
- [ ] Update points display
- [ ] Add combo flash effect

---

### 2.4 - Remove Old HUD Elements
**File:** `src/pages/GamePage.ts`

**Tasks:**
- [ ] Remove `createHUD()` method (lines 63-98)
- [ ] Remove `scoreElement` property
- [ ] Remove `livesElement` property
- [ ] Remove `updateHUD()` method (called from interval)
- [ ] Update interval to only update diamonds if needed

---

## 🟠 PRIORITY 3: Enable Power-Up & Special Points Systems

### 3.1 - Fix TypeScript Configuration
**File:** `tsconfig.json`

**Remove exclusions (lines 36-37):**
```diff
  "include": ["src"],
- "exclude": [
-   "src/systems/SpecialPointsSystem.ts",
-   "src/systems/PowerUpSystem.ts"
- ]
+ "exclude": []
```

**Tasks:**
- [ ] Remove exclusions from tsconfig.json
- [ ] Run `pnpm type-check` to see errors
- [ ] Fix any TypeScript errors that appear

---

### 3.2 - Convert PowerUpSystem to TypeScript
**File:** `src/systems/PowerUpSystem.ts`

**Current Issue:** Written as JavaScript class, needs conversion

**Tasks:**
- [ ] Add proper type definitions
- [ ] Convert to TypeScript syntax
- [ ] Add interface for PowerUp entity
- [ ] Export class properly
- [ ] Connect to GamePage

**Expected fixes:**
- Replace `class PowerUpSystem` with proper TypeScript class
- Add `constructor` type safety
- Type all methods
- Remove JavaScript-only features (window.gameState, etc.)

---

### 3.3 - Convert SpecialPointsSystem to TypeScript
**File:** `src/systems/SpecialPointsSystem.ts`

**Similar to PowerUpSystem:**
- [ ] Add proper types
- [ ] Connect to state manager
- [ ] Integrate with PointsDisplay HUD

---

### 3.4 - Integrate Power-Ups into GamePage
**File:** `src/pages/GamePage.ts`

**Add to class:**
```typescript
import { PowerUpSystem } from '@systems/PowerUpSystem';
private powerUpSystem!: PowerUpSystem;

// In initCanvas():
this.powerUpSystem = new PowerUpSystem();

// In update():
this.powerUpSystem.update(dt);

// In draw():
this.powerUpSystem.render(this.canvas.ctx);

// Event listener for collection:
window.addEventListener('powerup-collected', (e: CustomEvent) => {
  const added = this.inventoryUI.addPowerUp(e.detail.type);
  if (!added) {
    // Show "Inventory Full" message
  }
});

// Event listener for usage:
window.addEventListener('powerup-used', (e: CustomEvent) => {
  const { type } = e.detail;
  this.applyPowerUp(type);
});
```

**Tasks:**
- [ ] Import PowerUpSystem
- [ ] Initialize in game
- [ ] Update and render
- [ ] Connect to InventoryUI
- [ ] Implement power-up effects

---

## 🟢 PRIORITY 4: Create Multiplayer/Group System

### 4.1 - Create MultiplayerPage (Group Management)
**File:** `src/pages/MultiplayerPage.ts` (NEW)

**Features:**
- [ ] Two tabs: "Create Group" and "Join Group"
- [ ] Create Group:
  - Input: Group name
  - Button: Create → Generates room code → Show code to share
- [ ] Join Group:
  - Input: Room code (6 chars, auto-uppercase)
  - Button: Join → Validates → Joins group
- [ ] Show list of user's groups with:
  - Group name
  - Room code
  - Member count
  - "View Leaderboard" button
  - "Play in This Group" button

**Layout:**
```typescript
export class MultiplayerPage extends BasePage {
  private groupManager: GroupManager;
  private currentView: 'list' | 'create' | 'join' = 'list';
  
  public render(): void {
    // Show user's groups list
    // Buttons: Create New Group | Join Group
    // Each group card: Name, Code, Members, View/Play
  }
  
  private async createGroup(): Promise<void> {
    // Get group name from input
    // Call groupManager.createGroup()
    // Show success modal with room code
  }
  
  private async joinGroup(): Promise<void> {
    // Get room code from input
    // Call groupManager.joinGroup()
    // Show success message
  }
  
  private async viewGroupLeaderboard(groupId: string): Promise<void> {
    // Fetch group leaderboard
    // Show in modal
  }
  
  private playInGroup(groupId: string): void {
    // Store selected group in state
    // Navigate to difficulty selector
  }
}
```

**Tasks:**
- [ ] Create MultiplayerPage.ts
- [ ] Implement group list view
- [ ] Implement create group flow
- [ ] Implement join group flow
- [ ] Add leaderboard modal
- [ ] Style with black & white theme

---

### 4.2 - Register MultiplayerPage in Router
**File:** `src/main.ts`

**Replace TODO comment (line 56-59) with:**
```typescript
{
  path: ROUTES.MULTIPLAYER,
  page: MultiplayerPage,
  requiresAuth: true,
},
```

**Tasks:**
- [ ] Import MultiplayerPage
- [ ] Register route
- [ ] Test navigation from menu

---

### 4.3 - Update GamePage for Group Play
**File:** `src/pages/GamePage.ts`

**Check if playing in group context:**
```typescript
private async onGameOver(): Promise<void> {
  const state = stateManager.getState();
  const score = state.game.score;
  const userId = state.player.id;
  const userName = state.player.name;
  
  // Save to single player high score
  const appwrite = new AppwriteClient();
  await appwrite.updateSinglePlayerScore(userId, score);
  
  // If playing in a group, also save group score
  const currentGroupId = state.ui.currentGroupId; // Need to add this to state
  if (currentGroupId) {
    const groupManager = new GroupManager(appwrite);
    await groupManager.recordGroupScore(
      userId,
      userName,
      currentGroupId,
      score,
      state.game.difficulty
    );
  }
  
  this.showGameOver();
}
```

**Tasks:**
- [ ] Add `currentGroupId` to UIState type
- [ ] Set group context when starting from multiplayer
- [ ] Save to both single player and group scores
- [ ] Show group rank in game over modal

---

### 4.4 - Group Leaderboard Modal
**File:** `src/ui/modals/GroupLeaderboardModal.ts` (NEW)

**Features:**
- [ ] Show group name and room code
- [ ] List all members with best scores
- [ ] Highlight current user
- [ ] Show rank, name, score
- [ ] "Copy Room Code" button
- [ ] "Leave Group" button
- [ ] "Close" button

**Tasks:**
- [ ] Create modal component
- [ ] Fetch data from GroupManager
- [ ] Style with rankings (gold/silver/bronze for top 3)
- [ ] Add copy-to-clipboard functionality

---

## 🔵 PRIORITY 5: Integrate Game Modes

### 5.1 - Connect Daily Challenge
**File:** `src/pages/MenuPage.ts`

**Replace TODO (line 173) with:**
```typescript
private async startDailyChallenge(): Promise<void> {
  // Set game mode in state
  stateManager.updateUI({ currentGameMode: 'dailyChallenge' });
  
  // Navigate to game (difficulty is preset for daily challenge)
  Router.getInstance().navigate(ROUTES.GAME);
}
```

**Tasks:**
- [ ] Add `currentGameMode` to UIState
- [ ] Update GamePage to check mode
- [ ] Initialize DailyChallengeMode when mode is set
- [ ] Show attempts remaining

---

### 5.2 - Connect Timer Attack
**File:** `src/pages/MenuPage.ts`

**Replace TODO (line 182) with:**
```typescript
private async startTimerAttack(): Promise<void> {
  // Show duration selector modal (60s/120s/180s)
  const duration = await this.showDurationSelector();
  
  // Set game mode in state
  stateManager.updateUI({ 
    currentGameMode: 'timerAttack',
    timerDuration: duration 
  });
  
  // Navigate to game
  Router.getInstance().navigate(ROUTES.GAME);
}

private async showDurationSelector(): Promise<number> {
  // Show modal with 3 buttons: 60s, 120s, 180s
  return new Promise((resolve) => {
    // Modal logic
  });
}
```

**Tasks:**
- [ ] Add `currentGameMode` and `timerDuration` to UIState
- [ ] Create duration selector modal
- [ ] Update GamePage to initialize TimerAttackMode
- [ ] Show timer in HUD

---

### 5.3 - Leaderboard Modal
**File:** `src/pages/MenuPage.ts`

**Replace TODO (line 191) with:**
```typescript
private async showLeaderboard(): Promise<void> {
  // Fetch global single-player leaderboard
  const appwrite = new AppwriteClient();
  const leaderboard = await appwrite.getGlobalLeaderboard(100);
  
  // Show in modal
  const modal = new LeaderboardModal(leaderboard);
  modal.show();
}
```

**Tasks:**
- [ ] Create `LeaderboardModal.ts` component
- [ ] Implement in AppwriteClient
- [ ] Show top 100 players
- [ ] Highlight current user
- [ ] Add tabs: Global / My Groups

---

## 🟣 PRIORITY 6: Life System Integration

### 6.1 - Implement Life Loss
**File:** `src/pages/GamePage.ts`

**In game over check (update() method):**
```typescript
// Check for game over
if (this.hex.isGameOver(8)) {
  const state = stateManager.getState();
  const lives = state.game.lives;
  
  if (lives > 1) {
    // Lose a life
    stateManager.updateGame({ lives: lives - 1 });
    stateManager.emit('lifeLost');
    
    // Flash life display
    this.livesDisplay.setLives(lives - 1);
    
    // Clear blocks and restart (not full game over)
    this.clearBlocksAndRestart();
  } else {
    // Final life lost - game over
    stateManager.updateGame({ lives: 0 });
    stateManager.setState('status', GameStatus.GAME_OVER);
    stateManager.emit('gameOver', { score: state.game.score });
  }
}
```

**Tasks:**
- [ ] Implement life loss logic
- [ ] Update LivesDisplay on loss
- [ ] Clear blocks on life loss (not full restart)
- [ ] Only end game when lives = 0

---

### 6.2 - Implement Bonus Lives
**File:** `src/pages/GamePage.ts`

**In update() method after score increases:**
```typescript
// Award bonus life every 5000 points
const oldScore = state.game.score;
const newScore = oldScore + result.score;
const oldMilestone = Math.floor(oldScore / 5000);
const newMilestone = Math.floor(newScore / 5000);

if (newMilestone > oldMilestone && state.game.lives < 5) {
  // Award bonus life
  stateManager.updateGame({ lives: state.game.lives + 1 });
  stateManager.emit('lifeGained');
  this.livesDisplay.setLives(state.game.lives + 1);
  
  // Show floating text "+1 LIFE"
  this.floatingTexts.push(
    FloatingText.createBonus(centerX, centerY - 100, '+1 LIFE')
  );
}
```

**Tasks:**
- [ ] Track score milestones (every 5000)
- [ ] Award bonus lives (max 5)
- [ ] Update LivesDisplay
- [ ] Show bonus notification

---

## 🟤 PRIORITY 7: Polish & Features

### 7.1 - Settings: Clear Data
**File:** `src/pages/SettingsPage.ts`

**Replace TODO (line 305) with:**
```typescript
private async clearData(): Promise<void> {
  // Show confirmation modal
  const confirmed = await this.showConfirmation(
    'Clear All Data',
    'This will delete all your progress, scores, and unlocked themes. This action cannot be undone.'
  );
  
  if (!confirmed) return;
  
  try {
    const state = stateManager.getState();
    const appwrite = new AppwriteClient();
    
    // Delete user from Appwrite
    await appwrite.deleteUser(state.player.id);
    
    // Clear local state
    stateManager.setState('player', {
      id: '',
      name: '',
      highScore: 0,
      specialPoints: 0,
      gamesPlayed: 0,
      totalPlayTime: 0,
      themesUnlocked: ['classic'],
      selectedTheme: 'classic',
    });
    
    // Navigate back to entry
    Router.getInstance().navigate(ROUTES.ENTRY);
    
  } catch (error) {
    console.error('Failed to clear data:', error);
    // Show error message
  }
}
```

**Tasks:**
- [ ] Implement confirmation modal
- [ ] Add deleteUser() method to AppwriteClient
- [ ] Clear state and navigate to entry

---

### 7.2 - Global Leaderboard
**File:** `src/ui/modals/LeaderboardModal.ts` (NEW)

**Features:**
- [ ] Tabs: "Global" | "My Groups"
- [ ] Global tab:
  - Fetch top 100 from Appwrite
  - Show rank, name, score
  - Highlight current user's position
  - Paginated (show 20 at a time)
- [ ] My Groups tab:
  - List all groups user is in
  - Click to view group leaderboard

**Tasks:**
- [ ] Create LeaderboardModal component
- [ ] Implement tabs
- [ ] Fetch and display data
- [ ] Style with rankings

---

### 7.3 - Shop System
**File:** `src/pages/ShopPage.ts` (NEW) or Modal

**Features:**
- [ ] Show available themes with preview
- [ ] Show cost in diamonds
- [ ] "Unlock" button if not owned
- [ ] "Select" button if owned
- [ ] Show current diamonds balance

**Tasks:**
- [ ] Create shop UI
- [ ] Connect to shopItems config
- [ ] Implement unlock logic
- [ ] Spend diamonds from user account

---

### 7.4 - Audio System
**File:** `src/managers/AudioManager.ts` (NEW)

**Features:**
- [ ] Background music (looping)
- [ ] Sound effects:
  - Block land
  - Match clear
  - Combo
  - Power-up collect
  - Power-up use
  - Life lost
  - Game over
- [ ] Mute toggles from settings

**Tasks:**
- [ ] Create AudioManager singleton
- [ ] Add audio files to public/
- [ ] Connect to settings toggles
- [ ] Play sounds on game events

---

## 🗑️ CLEANUP: Remove Socket.io Server

### Remove Unused Files
**Tasks:**
- [ ] Delete `server/` directory (entire folder)
- [ ] Delete `render.yaml` (deployment config for Socket.io server)
- [ ] Remove Socket.io from client dependencies:
  - Remove `socket.io-client` from `package.json`
  - Run `pnpm install`
- [ ] Simplify or remove `src/network/MultiplayerClient.ts` (replace with GroupManager)

---

## 📝 Type Definitions Updates

### Update game.d.ts
**File:** `src/types/game.d.ts`

**Add new interfaces:**
```typescript
// Authentication types
export interface User {
  $id: string;
  userId: string;
  name: string;
  email: string;
  singlePlayerHighScore: number;
  totalDiamonds: number;
  gamesPlayed: number;
  totalPlayTime: number;
  themesUnlocked: string[];
  selectedTheme: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  sessionId: string;
}

// Group types
export interface Group {
  $id: string;
  roomCode: string;
  groupName: string;
  createdBy: string;
  memberIds: string[];
  memberCount: number;
  createdAt: string;
  isActive: boolean;
}

export interface GroupScore {
  $id: string;
  userId: string;
  groupId: string;
  userName: string;
  bestScore: number;
  gamesPlayed: number;
  lastPlayedAt: string;
  difficulty: string;
}

export interface GroupWithMembers extends Group {
  members: User[];
  leaderboard: GroupScore[];
}

// Update UIState
export interface UIState {
  currentRoute: string;
  isPaused: boolean;
  isShopOpen: boolean;
  isModalOpen: boolean;
  isMuted: boolean;
  currentGroupId?: string;  // NEW
  currentGameMode?: 'standard' | 'dailyChallenge' | 'timerAttack';  // NEW
  timerDuration?: number;  // NEW (for timer attack)
}
```

**Tasks:**
- [ ] Add Group-related interfaces
- [ ] Update UIState with new fields
- [ ] Export types

---

## 🧪 Testing Checklist

### Test User Flow
- [ ] Sign Up → Create account with email/password → Menu
- [ ] Login → Email/password → Menu (loads saved data)
- [ ] Forgot Password → Email → Reset link → New password → Login
- [ ] Logout → Returns to login page → Session cleared
- [ ] Reload page with active session → Auto-login → Menu
- [ ] Single Player → Game → Save high score
- [ ] Create Group → Share room code → Join from another "account"
- [ ] Play in group → Check group leaderboard updates
- [ ] Join multiple groups → See separate leaderboards
- [ ] Earn diamonds → Unlock theme → Theme persists
- [ ] Clear data → Returns to entry → Old account gone

### Test Game Mechanics
- [ ] HUD displays correctly (lives, score, diamonds)
- [ ] Power-ups spawn and work
- [ ] Life system (lose life, gain bonus lives)
- [ ] Combo system and scoring
- [ ] Game over saves scores correctly
- [ ] Daily challenge works
- [ ] Timer attack works

---

## 📦 Environment Setup

### .env File
**File:** `.env` (create if not exists)

```env
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id_here
VITE_APPWRITE_DATABASE_ID=your_database_id_here
VITE_APPWRITE_USERS_COLLECTION_ID=users_collection_id
VITE_APPWRITE_GROUPS_COLLECTION_ID=groups_collection_id
VITE_APPWRITE_GROUPSCORES_COLLECTION_ID=groupscores_collection_id
```

**Tasks:**
- [ ] Create .env file
- [ ] Set up Appwrite project (with Authentication enabled)
- [ ] Enable Email/Password auth method in Appwrite Console
- [ ] Configure email service for password recovery
- [ ] Create database and collections
- [ ] Update .env with real IDs
- [ ] Add .env to .gitignore
- [ ] Create .env.example for documentation

---

## 🔒 Security & Best Practices

### Authentication Security
**Tasks:**
- [ ] Use HTTPS in production (Appwrite handles this)
- [ ] Set appropriate session duration (default: 365 days)
- [ ] Implement rate limiting for login attempts (Appwrite built-in)
- [ ] Validate email format on both client and server
- [ ] Enforce strong password requirements (min 8 chars)
- [ ] Never store passwords client-side (handled by Appwrite)
- [ ] Use secure cookies for session management (Appwrite handles)

### Data Security
**Tasks:**
- [ ] Set proper Appwrite collection permissions:
  - Users can only read/update their own user document
  - Users can read any group they're a member of
  - Users can create groups and groupScores
  - Use Appwrite's role-based access control
- [ ] Validate all user inputs before saving
- [ ] Sanitize user-generated content (group names, etc.)
- [ ] Prevent SQL injection (Appwrite handles this)
- [ ] Rate limit API requests (Appwrite built-in)

### Privacy
**Tasks:**
- [ ] Add Privacy Policy page
- [ ] Add Terms of Service page
- [ ] Allow users to delete their account
- [ ] Export user data functionality (GDPR compliance)
- [ ] Clear explanation of what data is collected
- [ ] Option to opt-out of leaderboards

### Error Handling
**Tasks:**
- [ ] Never expose internal errors to users
- [ ] Log errors securely (don't log passwords)
- [ ] Show user-friendly error messages
- [ ] Handle network failures gracefully
- [ ] Implement retry logic for transient failures

---

## 🚀 Deployment

### Build & Deploy
**Tasks:**
- [ ] Run `pnpm build` to test production build
- [ ] Fix any build errors
- [ ] Deploy to hosting (Vercel/Netlify/Render)
- [ ] Update Appwrite CORS settings with production URL
- [ ] Test on production

---

## ✅ Summary of Work

### What to Remove
- ❌ Socket.io server (`server/` directory)
- ❌ Real-time multiplayer logic
- ❌ `render.yaml` deployment file
- ❌ `socket.io-client` dependency

### What to Add
- ✅ **Appwrite Authentication System** (Email/Password, Sessions, Password Recovery)
- ✅ **User Account Management** (Signup, Login, Logout)
- ✅ Appwrite database for user game data
- ✅ Group/room management system (no real-time)
- ✅ Group leaderboard tracking
- ✅ HUD component integration
- ✅ Power-up system integration
- ✅ Life system implementation
- ✅ Game mode integration (daily/timer)
- ✅ Shop and theme unlocking
- ✅ Global leaderboard

### Core Concept
**Authentication**: Email/password login → Secure sessions → Password recovery  
**Single Player**: Play alone → Save high score to your account  
**Multiplayer/Groups**: Join groups → Play separately → Compare scores in group leaderboard  
**Persistence**: All data (scores, diamonds, themes) saved permanently in Appwrite  
**Security**: Appwrite Auth handles authentication, database stores game data

---

## 📞 Questions to Resolve

If you have any questions about this plan, ask immediately:
1. ✅ Data persistence (answered: keep all data permanently)
2. ✅ Group system (answered: room code system)
3. ✅ Multiple groups (answered: yes, user can join multiple)
4. ✅ Leaderboard display (answered: best score per user in group)

---

**Total Tasks:** ~140 implementation items  
**Estimated Time:** 3-4 days for core features (Priority 1-4)  
**Current Status:** 65% complete (foundation done, authentication + integration needed)  
**New Addition:** Full authentication system with email/password, sessions, and password recovery

---

Let me know when you're ready to start implementing! 🚀
