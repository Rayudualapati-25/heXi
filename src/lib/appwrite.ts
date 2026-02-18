/**
 * Appwrite SDK Configuration
 * Initializes Appwrite client, account, and databases services
 */

import { Client, Account, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6994a34d000eea5072a6');

// Initialize services
const account = new Account(client);
const databases = new Databases(client);

/**
 * Ensure user has a session (anonymous if not logged in).
 * Appwrite client SDK needs an active session for reliable API access.
 * Call this before any database operation when the user might not be logged in.
 */
let sessionReady: Promise<void> | null = null;

async function ensureSession(): Promise<void> {
  if (sessionReady) return sessionReady;

  sessionReady = (async () => {
    try {
      // Check if there's already a session
      await account.get();
    } catch {
      try {
        // No session — create anonymous session
        await account.createAnonymousSession();
        console.log('Anonymous session created');
      } catch (anonErr: any) {
        // If anonymous session creation also fails, it might be a platform/network issue
        console.error('Failed to create anonymous session:', anonErr.message);
        sessionReady = null; // Allow retry
        throw anonErr;
      }
    }
  })();

  return sessionReady;
}

// Export for use throughout the app
export { client, account, databases, ensureSession };

