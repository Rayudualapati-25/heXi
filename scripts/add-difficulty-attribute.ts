#!/usr/bin/env tsx
/**
 * Migration Script: Add difficulty attribute to rooms collection
 * 
 * Run this if you already have the rooms collection but it's missing the difficulty attribute
 * 
 * Usage: npx tsx scripts/add-difficulty-attribute.ts
 */

import { Client, Databases } from 'node-appwrite';
import * as readline from 'readline';

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6994a34d000eea5072a6';
const DATABASE_ID = 'hexi-game';
const ROOMS_COL = 'rooms';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🔧 Adding difficulty attribute to rooms collection\n');
  
  const apiKey = await question('Enter your Appwrite API Key: ');
  
  if (!apiKey || apiKey.trim() === '') {
    console.log('\n❌ API Key is required. Exiting...');
    rl.close();
    return;
  }

  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(apiKey.trim());

  const databases = new Databases(client);

  try {
    console.log('\n📝 Adding difficulty attribute to rooms collection...');
    
    await databases.createStringAttribute(
      DATABASE_ID,
      ROOMS_COL,
      'difficulty',
      50,
      false // Optional field
    );
    
    console.log('✅ Difficulty attribute added successfully!');
    console.log('\n✨ Your multiplayer system should now work correctly.');
    console.log('   Non-host players will be redirected when host selects difficulty.\n');
    
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️  Difficulty attribute already exists - no action needed!');
    } else {
      console.error('\n❌ Error:', error.message);
      console.log('\nTroubleshooting:');
      console.log('1. Make sure your API key has Database permissions');
      console.log('2. Check that the database and collection exist');
      console.log('3. Go to Appwrite Console → Databases → hexi-game → rooms');
      console.log('   and manually add a String attribute named "difficulty" (optional, max 50 chars)\n');
    }
  } finally {
    rl.close();
  }
}

main().catch(console.error);
