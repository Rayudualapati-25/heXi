#!/usr/bin/env tsx
/**
 * Appwrite Collections Setup Script
 * 
 * Creates the database and collections needed for heXi
 * with proper attributes and indexes.
 * 
 * Prerequisites: 
 * - Appwrite project created
 * - API Key with Database permissions created in Appwrite Console
 * 
 * Run: npm run setup:collections
 */

import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import * as readline from 'readline';

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6994a34d000eea5072a6';
const DATABASE_ID = 'hexi-game';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

/** Helper: wait for attributes to be ready before creating indexes */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n🗄️  heXi - Database & Collections Setup\n');

  console.log('📋 Step 1: Create API Key\n');
  console.log('   1. Go to https://cloud.appwrite.io/console');
  console.log('   2. Select your project');
  console.log('   3. Go to Overview → Integrations → API keys');
  console.log('   4. Create a new API key with ALL Database scopes');
  console.log('   5. Copy the API Key (secret)\n');

  const apiKey = await question('Enter your API Key: ');

  if (!apiKey || apiKey.trim() === '') {
    console.log('\n❌ API Key is required. Exiting...');
    rl.close();
    return;
  }

  // Initialize Appwrite SERVER client (node-appwrite)
  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(apiKey.trim());

  const databases = new Databases(client);

  try {
    console.log('\n🔨 Creating database and collections...\n');

    // Create database
    console.log('Creating database...');
    try {
      await databases.create(DATABASE_ID, 'heXi Game');
      console.log('✅ Database created: ' + DATABASE_ID);
    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Database already exists');
      } else {
        throw error;
      }
    }

    // ─── ROOMS COLLECTION ────────────────────────────────────────
    console.log('\nCreating rooms collection...');
    const roomsId = 'rooms';

    try {
      await databases.createCollection(
        DATABASE_ID,
        roomsId,
        'Rooms',
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ],
        true, // documentSecurity disabled (collection-level perms)
      );
      console.log('✅ Rooms collection created');

      console.log('   Adding attributes...');
      await databases.createStringAttribute(DATABASE_ID, roomsId, 'roomCode', 10, true);
      await databases.createStringAttribute(DATABASE_ID, roomsId, 'hostId', 50, true);
      await databases.createStringAttribute(DATABASE_ID, roomsId, 'hostName', 100, true);
      await databases.createStringAttribute(DATABASE_ID, roomsId, 'status', 20, true);
      await databases.createIntegerAttribute(DATABASE_ID, roomsId, 'maxPlayers', true);
      await databases.createIntegerAttribute(DATABASE_ID, roomsId, 'playerCount', true);
      await databases.createStringAttribute(DATABASE_ID, roomsId, 'difficulty', 50, false); // Optional difficulty field
      console.log('   ✅ Attributes added');

      // Wait for attributes to be processed
      console.log('   Waiting for attributes to be ready...');
      await delay(3000);

      console.log('   Creating indexes...');
      await databases.createIndex(DATABASE_ID, roomsId, 'roomCode_idx', 'key', ['roomCode'], ['asc']);
      await databases.createIndex(DATABASE_ID, roomsId, 'status_idx', 'key', ['status'], ['asc']);
      console.log('   ✅ Indexes created');

    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Rooms collection already exists');
      } else {
        throw error;
      }
    }

    // ─── ROOM-PLAYERS COLLECTION ─────────────────────────────────
    console.log('\nCreating room-players collection...');
    const roomPlayersId = 'room-players';

    try {
      await databases.createCollection(
        DATABASE_ID,
        roomPlayersId,
        'Room Players',
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ],
        true,
      );
      console.log('✅ Room Players collection created');

      console.log('   Adding attributes...');
      await databases.createStringAttribute(DATABASE_ID, roomPlayersId, 'roomId', 50, true);
      await databases.createStringAttribute(DATABASE_ID, roomPlayersId, 'odplayerName', 100, true);
      await databases.createStringAttribute(DATABASE_ID, roomPlayersId, 'odplayerId', 50, true);
      await databases.createIntegerAttribute(DATABASE_ID, roomPlayersId, 'score', true);
      await databases.createStringAttribute(DATABASE_ID, roomPlayersId, 'status', 20, true);
      await databases.createBooleanAttribute(DATABASE_ID, roomPlayersId, 'isHost', true);
      console.log('   ✅ Attributes added');

      console.log('   Waiting for attributes to be ready...');
      await delay(3000);

      console.log('   Creating indexes...');
      await databases.createIndex(DATABASE_ID, roomPlayersId, 'roomId_idx', 'key', ['roomId'], ['asc']);
      await databases.createIndex(DATABASE_ID, roomPlayersId, 'room_status_idx', 'key', ['roomId', 'status'], ['asc', 'asc']);
      console.log('   ✅ Indexes created');

    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Room Players collection already exists');
      } else {
        throw error;
      }
    }

    // ─── USERS COLLECTION ────────────────────────────────────────
    console.log('\nCreating users collection...');
    const usersId = 'users';

    try {
      await databases.createCollection(
        DATABASE_ID,
        usersId,
        'Users',
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ],
        true,
      );
      console.log('✅ Users collection created');

      console.log('   Adding attributes...');
      await databases.createStringAttribute(DATABASE_ID, usersId, 'userId', 255, true);
      await databases.createStringAttribute(DATABASE_ID, usersId, 'name', 255, true);
      await databases.createStringAttribute(DATABASE_ID, usersId, 'email', 255, true);
      await databases.createIntegerAttribute(DATABASE_ID, usersId, 'singlePlayerHighScore', false, 0);
      await databases.createIntegerAttribute(DATABASE_ID, usersId, 'totalDiamonds', false, 500);
      await databases.createIntegerAttribute(DATABASE_ID, usersId, 'gamesPlayed', false, 0);
      await databases.createIntegerAttribute(DATABASE_ID, usersId, 'totalPlayTime', false, 0);
      await databases.createStringAttribute(DATABASE_ID, usersId, 'themesUnlocked', 1000, false, undefined, true);
      await databases.createStringAttribute(DATABASE_ID, usersId, 'selectedTheme', 100, false, 'classic');
      await databases.createIntegerAttribute(DATABASE_ID, usersId, 'timerAttackBest', false, 0);
      await databases.createIntegerAttribute(DATABASE_ID, usersId, 'inventory_continue', false, 0);
      await databases.createIntegerAttribute(DATABASE_ID, usersId, 'inventory_extraLife', false, 0);
      await databases.createIntegerAttribute(DATABASE_ID, usersId, 'inventory_hammer', false, 0);
      await databases.createIntegerAttribute(DATABASE_ID, usersId, 'inventory_slowmo', false, 0);
      await databases.createIntegerAttribute(DATABASE_ID, usersId, 'inventory_shield', false, 0);
      console.log('   ✅ Attributes added');

      console.log('   Waiting for attributes to be ready...');
      await delay(3000);

      console.log('   Creating indexes...');
      await databases.createIndex(DATABASE_ID, usersId, 'userId_index', 'key', ['userId'], ['asc']);
      await databases.createIndex(DATABASE_ID, usersId, 'highscore_index', 'key', ['singlePlayerHighScore'], ['desc']);
      await databases.createIndex(DATABASE_ID, usersId, 'timerattack_index', 'key', ['timerAttackBest'], ['desc']);
      console.log('   ✅ Indexes created');

    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Users collection already exists');
      } else {
        throw error;
      }
    }

    // ─── GROUPS COLLECTION ───────────────────────────────────────
    console.log('\nCreating groups collection...');
    const groupsId = 'groups';

    try {
      await databases.createCollection(
        DATABASE_ID,
        groupsId,
        'Groups',
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ],
        true,
      );
      console.log('✅ Groups collection created');

      await databases.createStringAttribute(DATABASE_ID, groupsId, 'name', 255, true);
      await databases.createStringAttribute(DATABASE_ID, groupsId, 'code', 50, true);
      await databases.createStringAttribute(DATABASE_ID, groupsId, 'creatorId', 255, true);
      await databases.createStringAttribute(DATABASE_ID, groupsId, 'memberIds', 2000, false, undefined, true);
      await databases.createIntegerAttribute(DATABASE_ID, groupsId, 'memberCount', false, 1);
      console.log('   ✅ Attributes added');

      console.log('   Waiting for attributes to be ready...');
      await delay(3000);

      await databases.createIndex(DATABASE_ID, groupsId, 'code_index', 'unique', ['code'], ['asc']);
      console.log('   ✅ Indexes created');

    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Groups collection already exists');
      } else {
        throw error;
      }
    }

    // ─── GROUP SCORES COLLECTION ─────────────────────────────────
    console.log('\nCreating group-scores collection...');
    const groupScoresId = 'group-scores';

    try {
      await databases.createCollection(
        DATABASE_ID,
        groupScoresId,
        'Group Scores',
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ],
        true,
      );
      console.log('✅ Group Scores collection created');

      await databases.createStringAttribute(DATABASE_ID, groupScoresId, 'groupId', 255, true);
      await databases.createStringAttribute(DATABASE_ID, groupScoresId, 'userId', 255, true);
      await databases.createStringAttribute(DATABASE_ID, groupScoresId, 'userName', 255, true);
      await databases.createIntegerAttribute(DATABASE_ID, groupScoresId, 'score', true);
      await databases.createStringAttribute(DATABASE_ID, groupScoresId, 'mode', 50, false, 'single-player');
      console.log('   ✅ Attributes added');

      console.log('   Waiting for attributes to be ready...');
      await delay(3000);

      await databases.createIndex(DATABASE_ID, groupScoresId, 'group_scores_index', 'key', ['groupId', 'score'], ['asc', 'desc']);
      console.log('   ✅ Indexes created');

    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Group Scores collection already exists');
      } else {
        throw error;
      }
    }

    console.log('\n✅ All collections created successfully!\n');
    console.log('📋 Database: ' + DATABASE_ID);
    console.log('   Collections: rooms, room-players, users, groups, group-scores\n');
    console.log('📋 Next Steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Open multiplayer and create a room');
    console.log('   3. Share the room code and test with another player\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    rl.close();
  }
}

main();
