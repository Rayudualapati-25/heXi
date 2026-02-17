#!/usr/bin/env tsx
/**
 * Appwrite Collections Setup Script
 * 
 * Creates the database and collections needed for heXi
 * with proper attributes and indexes.
 * 
 * Prerequisites: 
 * - Appwrite project created
 * - VITE_APPWRITE_PROJECT_ID set in .env
 * - API Key with Database permissions created in Appwrite Console
 * 
 * Run: pnpm run setup:collections
 */

import { Client, Databases, ID, Permission, Role } from 'appwrite';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🗄️  heXi - Database & Collections Setup\n');

  const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.VITE_APPWRITE_PROJECT_ID;

  if (!projectId) {
    console.error('❌ VITE_APPWRITE_PROJECT_ID not found in .env');
    console.error('   Run: pnpm run setup:appwrite first\n');
    rl.close();
    return;
  }

  console.log('📋 Step 1: Create API Key\n');
  console.log('   1. Go to https://cloud.appwrite.io/console');
  console.log('   2. Select your project');
  console.log('   3. Go to Settings → API Keys');
  console.log('   4. Create a new API key with these permissions:');
  console.log('      - databases.read');
  console.log('      - databases.write');
  console.log('      - collections.read');
  console.log('      - collections.write');
  console.log('      - attributes.read');
  console.log('      - attributes.write');
  console.log('      - indexes.read');
  console.log('      - indexes.write');
  console.log('   5. Copy the API Key (secret)\n');

  const apiKey = await question('Enter your API Key: ');

  if (!apiKey || apiKey.trim() === '') {
    console.log('\n❌ API Key is required. Exiting...');
    rl.close();
    return;
  }

  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey.trim());

  const databases = new Databases(client);

  try {
    console.log('\n🔨 Creating database and collections...\n');

    // Database ID
    const databaseId = 'hexi-database';
    
    // Create database
    console.log('Creating database...');
    try {
      await databases.create(databaseId, 'heXi Database');
      console.log('✅ Database created: hexi-database');
    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Database already exists');
      } else {
        throw error;
      }
    }

    // Create Users Collection
    console.log('\nCreating users collection...');
    const usersCollectionId = 'users';
    
    try {
      await databases.createCollection(
        databaseId,
        usersCollectionId,
        'Users',
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      console.log('✅ Users collection created');

      // Add attributes
      console.log('   Adding attributes...');
      await databases.createStringAttribute(databaseId, usersCollectionId, 'userId', 255, true);
      await databases.createStringAttribute(databaseId, usersCollectionId, 'name', 255, true);
      await databases.createStringAttribute(databaseId, usersCollectionId, 'email', 255, true);
      await databases.createIntegerAttribute(databaseId, usersCollectionId, 'singlePlayerHighScore', false, 0);
      await databases.createIntegerAttribute(databaseId, usersCollectionId, 'totalDiamonds', false, 500);
      await databases.createIntegerAttribute(databaseId, usersCollectionId, 'gamesPlayed', false, 0);
      await databases.createIntegerAttribute(databaseId, usersCollectionId, 'totalPlayTime', false, 0);
      await databases.createStringAttribute(databaseId, usersCollectionId, 'themesUnlocked', 1000, false, '["classic"]', true);
      await databases.createStringAttribute(databaseId, usersCollectionId, 'selectedTheme', 100, false, 'classic');
      await databases.createIntegerAttribute(databaseId, usersCollectionId, 'timerAttackBest', false, 0);
      await databases.createIntegerAttribute(databaseId, usersCollectionId, 'inventory_continue', false, 0);
      await databases.createIntegerAttribute(databaseId, usersCollectionId, 'inventory_extraLife', false, 0);
      await databases.createIntegerAttribute(databaseId, usersCollectionId, 'inventory_hammer', false, 0);
      await databases.createIntegerAttribute(databaseId, usersCollectionId, 'inventory_slowmo', false, 0);
      await databases.createIntegerAttribute(databaseId, usersCollectionId, 'inventory_shield', false, 0);
      
      console.log('   ✅ Attributes added');

      // Create indexes
      console.log('   Creating indexes...');
      await databases.createIndex(databaseId, usersCollectionId, 'userId_index', 'key', ['userId'], ['asc']);
      await databases.createIndex(databaseId, usersCollectionId, 'highscore_index', 'key', ['singlePlayerHighScore'], ['desc']);
      await databases.createIndex(databaseId, usersCollectionId, 'timerattack_index', 'key', ['timerAttackBest'], ['desc']);
      
      console.log('   ✅ Indexes created');

    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Users collection already exists');
      } else {
        throw error;
      }
    }

    // Create Groups Collection (for multiplayer)
    console.log('\nCreating groups collection...');
    const groupsCollectionId = 'groups';
    
    try {
      await databases.createCollection(
        databaseId,
        groupsCollectionId,
        'Groups',
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      console.log('✅ Groups collection created');

      await databases.createStringAttribute(databaseId, groupsCollectionId, 'name', 255, true);
      await databases.createStringAttribute(databaseId, groupsCollectionId, 'code', 50, true);
      await databases.createStringAttribute(databaseId, groupsCollectionId, 'creatorId', 255, true);
      await databases.createStringAttribute(databaseId, groupsCollectionId, 'memberIds', 2000, false, '[]', true);
      await databases.createIntegerAttribute(databaseId, groupsCollectionId, 'memberCount', false, 1);
      
      console.log('   ✅ Attributes added');

      await databases.createIndex(databaseId, groupsCollectionId, 'code_index', 'unique', ['code'], ['asc']);
      
      console.log('   ✅ Indexes created');

    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Groups collection already exists');
      } else {
        throw error;
      }
    }

    // Create Group Scores Collection
    console.log('\nCreating group-scores collection...');
    const groupScoresCollectionId = 'group-scores';
    
    try {
      await databases.createCollection(
        databaseId,
        groupScoresCollectionId,
        'Group Scores',
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      console.log('✅ Group scores collection created');

      await databases.createStringAttribute(databaseId, groupScoresCollectionId, 'groupId', 255, true);
      await databases.createStringAttribute(databaseId, groupScoresCollectionId, 'userId', 255, true);
      await databases.createStringAttribute(databaseId, groupScoresCollectionId, 'userName', 255, true);
      await databases.createIntegerAttribute(databaseId, groupScoresCollectionId, 'score', true);
      await databases.createStringAttribute(databaseId, groupScoresCollectionId, 'mode', 50, false, 'single-player');
      
      console.log('   ✅ Attributes added');

      await databases.createIndex(databaseId, groupScoresCollectionId, 'group_scores_index', 'key', ['groupId', 'score'], ['asc', 'desc']);
      
      console.log('   ✅ Indexes created');

    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Group scores collection already exists');
      } else {
        throw error;
      }
    }

    console.log('\n✅ All collections created successfully!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Run: pnpm dev');
    console.log('   2. Test authentication flow');
    console.log('   3. Play the game and check if data syncs\n');
    console.log('💡 Tip: You can view your data in the Appwrite Console');
    console.log('   Database: hexi-database\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    rl.close();
  }
}

main();
