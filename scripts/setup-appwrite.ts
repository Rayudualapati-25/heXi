#!/usr/bin/env tsx
/**
 * Appwrite Initial Setup Script
 * 
 * This script helps you set up your Appwrite project.
 * It will guide you through the process and update your .env file.
 * 
 * Run: pnpm run setup:appwrite
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🎮 heXi - Appwrite Setup Guide\n');
  console.log('This script will help you configure Appwrite for your project.\n');

  // Check if .env exists
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  if (!fs.existsSync(envPath)) {
    console.log('⚠️  No .env file found. Creating from .env.example...\n');
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ Created .env file\n');
    }
  }

  console.log('📋 Step 1: Create an Appwrite Account\n');
  console.log('   1. Go to https://cloud.appwrite.io/');
  console.log('   2. Sign up or log in');
  console.log('   3. Create a new project (e.g., "heXi")');
  console.log('   4. Copy your Project ID from the project settings\n');

  const projectId = await question('Enter your Appwrite Project ID: ');

  if (!projectId || projectId.trim() === '') {
    console.log('\n❌ Project ID is required. Please run the script again.');
    rl.close();
    return;
  }

  console.log('\n📋 Step 2: Endpoint Configuration\n');
  console.log('   Using Appwrite Cloud: https://cloud.appwrite.io/v1');
  console.log('   (If self-hosting, update VITE_APPWRITE_ENDPOINT in .env manually)\n');

  const endpoint = 'https://cloud.appwrite.io/v1';

  // Update .env file
  let envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Update project ID
  envContent = envContent.replace(
    /VITE_APPWRITE_PROJECT_ID=.*/,
    `VITE_APPWRITE_PROJECT_ID=${projectId.trim()}`
  );
  
  // Ensure endpoint is set
  if (!envContent.includes('VITE_APPWRITE_ENDPOINT=')) {
    envContent = `VITE_APPWRITE_ENDPOINT=${endpoint}\n${envContent}`;
  } else {
    envContent = envContent.replace(
      /VITE_APPWRITE_ENDPOINT=.*/,
      `VITE_APPWRITE_ENDPOINT=${endpoint}`
    );
  }

  fs.writeFileSync(envPath, envContent);

  console.log('✅ .env file updated!\n');
  console.log('📋 Step 3: Set up Database and Collections\n');
  console.log('   Run: pnpm run setup:collections\n');
  console.log('   This will create:');
  console.log('   - Database: hexi-database');
  console.log('   - Collection: users (for user profiles and scores)');
  console.log('   - Collection: groups (for multiplayer groups)');
  console.log('   - Collection: group-scores (for group leaderboards)\n');

  console.log('📋 Step 4: Configure Authentication (Manual)\n');
  console.log('   In your Appwrite Console:');
  console.log('   1. Go to Auth → Settings');
  console.log('   2. Enable Email/Password authentication');
  console.log('   3. Configure password recovery (optional)');
  console.log('   4. Add your app domain to allowed origins\n');

  console.log('✅ Setup complete! Next steps:');
  console.log('   1. Run: pnpm run setup:collections');
  console.log('   2. Run: pnpm dev');
  console.log('   3. Test authentication and gameplay\n');

  rl.close();
}

main().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
