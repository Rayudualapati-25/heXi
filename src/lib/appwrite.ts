/**
 * Appwrite SDK Configuration
 * Initializes Appwrite client, account, and databases services
 */

import { Client, Account, Databases } from 'appwrite';

// Initialize Appwrite client with project details
const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6994a34d000eea5072a6');

// Initialize services
const account = new Account(client);
const databases = new Databases(client);

// Export for use throughout the app
export { client, account, databases };

