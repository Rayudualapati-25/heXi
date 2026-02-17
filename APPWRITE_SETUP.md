# Appwrite Setup Guide for heXi

This guide will walk you through setting up Appwrite as the backend for your heXi game.

## Overview

heXi uses Appwrite to handle:
- 🔐 User authentication (email/password, recovery)
- 💾 User profiles and game progress
- 🏆 Leaderboards (global & timer attack)
- 💎 Diamonds and inventory management
- 🎨 Theme unlocks and preferences
- 👥 Multiplayer groups and scores

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- An Appwrite Cloud account (free) or self-hosted instance

## Step-by-Step Setup

### 1. Create Appwrite Project

1. Go to [Appwrite Cloud](https://cloud.appwrite.io/)
2. Sign up or log in
3. Click **"Create Project"**
4. Name it **"heXi"** (or your preferred name)
5. Copy the **Project ID** from settings

### 2. Run Initial Setup

```bash
# This will guide you through configuration
pnpm run setup:appwrite
```

The script will:
- Create/update your `.env` file
- Prompt for your Project ID
- Set the correct endpoint

### 3. Create API Key

Before running the collections setup, you need an API key:

1. In Appwrite Console, go to **Settings → API Keys**
2. Click **"Create API Key"**
3. Name it: **"heXi Database Setup"**
4. Select these scopes:
   - `databases.read`
   - `databases.write`
   - `collections.read`
   - `collections.write`
   - `attributes.read`
   - `attributes.write`
   - `indexes.read`
   - `indexes.write`
5. Click **Create**
6. Copy the **Secret Key** (you'll use this in the next step)

### 4. Create Database & Collections

```bash
# This will create all database tables
pnpm run setup:collections
```

When prompted, paste your API Key from step 3.

This creates:
- **Database**: `hexi-database`
- **Collections**:
  - `users` - User profiles, scores, inventory
  - `groups` - Multiplayer group information
  - `group-scores` - Multiplayer leaderboard entries

### 5. Configure Authentication

In your Appwrite Console:

1. Go to **Auth → Settings**
2. Enable **Email/Password** authentication
3. (Optional) Configure **Password Recovery**:
   - Set sender email
   - Customize recovery email template
4. Go to **Settings → Platforms**
5. Add **Web Platform**:
   - Name: `heXi Web`
   - Hostname: `localhost` (for development)
   - Add your production domain when deploying

### 6. Verify Your .env File

Your `.env` should look like:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_actual_project_id
VITE_APPWRITE_DATABASE_ID=hexi-database
VITE_APPWRITE_USERS_COLLECTION_ID=users
VITE_APPWRITE_GROUPS_COLLECTION_ID=groups
VITE_APPWRITE_GROUPSCORES_COLLECTION_ID=group-scores
```

### 7. Test the Setup

```bash
# Start development server
pnpm dev
```

Open your browser and:
1. Create a new account
2. Play a game
3. Check if your score saves
4. Open Appwrite Console → Database to verify data

## Database Schema

### Users Collection

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| userId | string | Yes | - | Links to Auth user ID |
| name | string | Yes | - | Display name |
| email | string | Yes | - | Email address |
| singlePlayerHighScore | integer | No | 0 | Best single player score |
| totalDiamonds | integer | No | 500 | Current diamond balance |
| gamesPlayed | integer | No | 0 | Total games count |
| totalPlayTime | integer | No | 0 | Seconds played |
| themesUnlocked | string[] | No | ["classic"] | Unlocked theme IDs |
| selectedTheme | string | No | "classic" | Active theme |
| timerAttackBest | integer | No | 0 | Best timer attack score |
| inventory_* | integer | No | 0 | Power-up counts |

**Indexes:**
- `userId_index` - Fast user lookups
- `highscore_index` - Leaderboard sorting
- `timerattack_index` - Timer attack leaderboard

### Groups Collection

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Group display name |
| code | string | Yes | Unique 6-char join code |
| creatorId | string | Yes | User ID of creator |
| memberIds | string[] | No | Array of member user IDs |
| memberCount | integer | No | Current member count |

**Indexes:**
- `code_index` (unique) - Fast group joining

### Group Scores Collection

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| groupId | string | Yes | Group document ID |
| userId | string | Yes | User document ID |
| userName | string | Yes | Display name |
| score | integer | Yes | Score value |
| mode | string | No | Game mode identifier |

**Indexes:**
- `group_scores_index` - Group leaderboard sorting

## Troubleshooting

### "Missing Appwrite environment variables"

- Check that `.env` exists in project root
- Verify all `VITE_APPWRITE_*` variables are set
- Restart dev server after changing `.env`

### "Failed to create collection"

- Verify API key has all required scopes
- Check if collection already exists in console
- Ensure project ID is correct

### "User not found" errors

- User authentication successful but database record missing
- Check `users` collection permissions in Appwrite Console
- Verify collection ID in `.env` matches actual ID

### Authentication redirects to wrong page

- Check `manifest.webmanifest` has correct `start_url`
- Verify router configuration in `src/router.ts`

## Security Best Practices

1. **Never commit `.env`** - Already in `.gitignore`
2. **Use different projects** - Separate dev/production
3. **Rotate API keys** - Delete setup key after use
4. **Review permissions** - Ensure users can't modify others' data
5. **Enable 2FA** - For your Appwrite account

## Going to Production

1. Create a new Appwrite project for production
2. Run setup scripts with production credentials
3. Update `.env` for production build
4. Add production domain to Appwrite platforms
5. Use environment variables in your hosting platform

## Useful Links

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Console](https://cloud.appwrite.io/console)
- [Appwrite Discord](https://discord.com/invite/appwrite)
- [heXi GitHub Issues](https://github.com/yourusername/hexi/issues)

## Need Help?

If you encounter issues:
1. Check Appwrite Console → Network tab for errors
2. Review browser console for client-side errors
3. Verify all environment variables are set correctly
4. Consult Appwrite documentation for specific errors

---

**Setup Version**: 2.0
**Last Updated**: February 2026
