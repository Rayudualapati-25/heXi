# Multiplayer System Guide

## Overview

The heXi multiplayer system provides room-based competitive gameplay where players can:
- Create rooms with unique room codes
- Join rooms using room codes
- Enter custom display names for each room
- Track player status (active/left) during games
- View leaderboards showing all players including those who left
- Receive real-time notifications when players join or leave

## Features

### 1. Room-Based System

#### Creating a Room
1. Navigate to **Multiplayer Groups** from the main menu
2. Click on the **Create** tab
3. Enter:
   - **Group Name**: Name for your multiplayer room
   - **Your Display Name**: Custom name to show in this room
4. Click **Create Group**
5. A unique **6-character room code** will be generated
6. Share this code with other players

#### Joining a Room
1. Navigate to **Multiplayer Groups** from the main menu
2. Click on the **Join** tab
3. Enter the **Room Code** provided by the room creator
4. A modal will appear asking you to enter your **Display Name**
5. Enter your preferred name for this game session
6. Click **Join Room**

### 2. Player Name Entry

Every player **must enter a display name** when:
- Creating a new room (as the host)
- Joining an existing room

This ensures:
- Clear identification of players in the lobby
- Personalized experience for each game session
- Separate display names from account usernames

### 3. Lobby System

Once in a room, players enter a **lobby** where:

#### For All Players:
- View all players in the room
- See who is the host (👑 crown icon)
- See each player's ready status
- Toggle your ready status with the **READY/NOT READY** button
- Leave the lobby at any time

#### For Host Only:
- Start the match when all players are ready
- Cannot start until all non-host players are ready

#### Real-Time Updates:
- Player join notifications (green success toast)
- Player leave notifications (yellow warning toast)
- Live player count updates
- Visual indicators for player status

### 4. In-Game Player Tracking

During an active multiplayer game:

#### Disconnect Detection:
- System monitors player activity every 10 seconds
- Players inactive for more than 10 seconds are marked as disconnected
- Automatic detection and notification of disconnects

#### Notifications:
When a player leaves during the game:
1. **Warning toast** shows: `{PlayerName} left the game`
2. **Info toast** shows remaining player count:
   - If 1 player remains: `1 player remaining: {PlayerName}`
   - If multiple remain: `{count} players remaining`
   - If alone: `You are now playing solo`

#### Player Status:
- Active players: Continue playing normally
- Left players: Marked in the system but no longer participate
- Remaining players: Visible count shown after each disconnect

### 5. Leaderboard with Left Players

The group leaderboard shows **all players**, including those who left:

#### Visual Indicators:
- **Active players**: Normal display with full opacity
- **Left players**: 
  - Reduced opacity (60%)
  - Red "LEFT" badge next to their name
  - Still visible in leaderboard rankings

#### Information Displayed:
- Rank (🥇 🥈 🥉 or number)
- Player name
- Best score
- Left status badge (if applicable)

### 6. Score Synchronization

The system uses a **lightweight score sync** mechanism:

- Scores update via localStorage for fast local sync
- Updates broadcast every 1 second (throttled)
- Opponent scores visible in real-time
- Ghost score tracking for competition
- Automatic fallback to single-player if all opponents disconnect

## User Flow

### Complete Room Creation Flow:
1. User clicks **Multiplayer Groups**
2. Selects **Create** tab
3. Enters group name and display name
4. System generates room code
5. User shares code with friends
6. User enters lobby as host
7. Other players join using the code
8. Host sees join notifications
9. Players mark themselves ready
10. Host starts the match
11. Game begins with score sync active

### Complete Room Join Flow:
1. User receives room code from host
2. User clicks **Multiplayer Groups**
3. Selects **Join** tab
4. Enters room code
5. **Name Entry Modal appears**
6. User enters display name
7. User clicks **Join Room**
8. User enters lobby
9. Other players see join notification
10. User marks ready
11. Game starts when host initiates
12. Score sync begins

### In-Game Player Leave Flow:
1. Player A disconnects or quits
2. System detects inactivity (10 seconds)
3. Player A marked as "left" in database
4. Warning notification sent to remaining players
5. Info notification shows remaining count
6. Player A shown with "LEFT" badge in leaderboard
7. Remaining players continue playing
8. Scores still recorded for all players

## Technical Details

### Data Structures

#### LobbyPlayer:
```typescript
interface LobbyPlayer {
  userId: string;
  userName: string;
  displayName?: string; // Custom display name for room
  isReady: boolean;
  isHost: boolean;
  isActive?: boolean; // Still in game
  hasLeft?: boolean; // Left during game
}
```

#### GroupScore:
```typescript
interface GroupScore {
  userId: string;
  groupId: string;
  userName: string;
  bestScore: number;
  gamesPlayed: number;
  hasLeft?: boolean; // Did player leave during game
  leftAt?: string; // When they left
}
```

### Storage

#### LocalStorage Keys:
- `score_{groupId}_{userId}`: Current player score
- `lobby_{groupId}_{userId}`: Lobby state broadcast
- `lobby_start_{groupId}`: Match start signal

### Callbacks

The system uses several callbacks for real-time updates:

1. **ScoreSyncCallback**: Opponent score updates
2. **DisconnectCallback**: All opponents disconnected
3. **PlayerLeftCallback**: Individual player left
4. **LobbyUpdateCallback**: Lobby state changes
5. **MatchStartCallback**: Game starting

## Best Practices

### For Room Creators:
- Choose descriptive group names
- Share room codes via secure channels
- Wait for all players before starting
- Monitor player ready status in lobby

### For All Players:
- Enter clear, identifiable display names
- Mark ready only when prepared to play
- Stay active during gameplay to avoid auto-disconnect
- Check leaderboard after game to see all scores

### For Developers:
- Always check for null values in multiplayer callbacks
- Handle edge cases (all players leave, etc.)
- Show clear user feedback for all actions
- Use Toast notifications sparingly (avoid spam)

## Troubleshooting

### "Room code not found"
- Verify the code is correct (case-sensitive)
- Check if room still exists
- Ask room creator to share code again

### "Player shows as left but is still playing"
- Network connection issues may cause false disconnect
- Refresh the page and rejoin
- Check internet connectivity

### "Lobby not updating"
- Ensure localStorage is not disabled
- Check browser console for errors
- Try leaving and rejoining the lobby

### "Toast notifications not showing"
- Check if browser blocks notifications
- Verify Toast container is properly mounted
- Look for console errors

## Future Enhancements

Potential improvements for the multiplayer system:

1. **Private messaging** between players in lobby
2. **Spectator mode** for players who finish early
3. **Tournament brackets** for competitive play
4. **Replay system** to review games
5. **Custom game rules** set by host
6. **Voice chat** integration
7. **Persistent rooms** that don't expire
8. **Room passwords** for private games
9. **Player statistics** per room
10. **Achievement system** for multiplayer

## API Reference

### GroupManager Methods

#### `createGroup(userId, groupName, userName)`
Creates a new multiplayer room.

#### `joinGroup(userId, userName, roomCode)`
Joins an existing room with custom display name.

#### `createLobby(...)`
Sets up lobby for host.

#### `joinLobby(...)`
Joins existing lobby.

#### `toggleReady()`
Toggles local player ready status.

#### `startMatch()`
Starts game (host only).

#### `leaveLobby()`
Leaves current lobby.

#### `markPlayerAsLeft(userId)`
Marks player as having left during game.

#### `startScoreSync(...)`
Begins real-time score synchronization.

#### `stopScoreSync()`
Ends score sync session.

#### `getActivePlayers()`
Returns list of currently active players.

### Toast Methods

#### `Toast.info(message, duration?)`
Shows informational toast.

#### `Toast.success(message, duration?)`
Shows success toast (green).

#### `Toast.warning(message, duration?)`
Shows warning toast (yellow).

#### `Toast.error(message, duration?)`
Shows error toast (red).

## Conclusion

The heXi multiplayer system provides a complete room-based competitive experience with:
- Easy room creation and joining
- Personalized player names
- Real-time player tracking
- Comprehensive disconnect handling
- Clear visual feedback
- Persistent leaderboards

All features are designed to ensure fair play, clear communication, and an engaging multiplayer experience.
