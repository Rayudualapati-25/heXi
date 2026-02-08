/**
 * AuthService - Handles all authentication operations
 * Uses Appwrite Auth for email/password authentication, sessions, and password recovery
 */

import { account } from '@lib/appwrite';
import { ID } from 'appwrite';
import { stateManager } from '@core/StateManager';
import { ThemeName } from '@config/themes';

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
  private currentSession: Session | null = null;
  private sessionCheckPromise: Promise<Session | null> | null = null;

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Try to get session from cache or check
      const session = await this.getCurrentSession();
      return session !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    // Return cached session if available
    if (this.currentSession) {
      return this.currentSession;
    }

    // If a session check is already in progress, wait for it
    if (this.sessionCheckPromise) {
      return this.sessionCheckPromise;
    }

    // Start a new session check
    this.sessionCheckPromise = this.checkSession();
    
    try {
      const session = await this.sessionCheckPromise;
      return session;
    } finally {
      this.sessionCheckPromise = null;
    }
  }

  /**
   * Internal method to check session from Appwrite
   */
  private async checkSession(): Promise<Session | null> {
    try {
      const user = await account.get();
      this.currentSession = {
        userId: user.$id,
        email: user.email,
        name: user.name,
        sessionId: user.$id,
      };
      return this.currentSession;
    } catch (error) {
      console.log('No active session');
      this.currentSession = null;
      return null;
    }
  }

  /**
   * Sign up new user
   */
  async signUp(credentials: AuthCredentials): Promise<Session> {
    try {
      if (!credentials.name) {
        throw new Error('Name is required for signup');
      }

      // Create account
      const user = await account.create(
        ID.unique(),
        credentials.email,
        credentials.password,
        credentials.name
      );

      console.log('✅ Account created:', user.$id);

      // Automatically log in after signup
      await account.createEmailPasswordSession(
        credentials.email,
        credentials.password
      );

      this.currentSession = {
        userId: user.$id,
        email: user.email,
        name: user.name || 'Player',
        sessionId: user.$id,
      };

      console.log('✅ Session created for:', this.currentSession.name);
      return this.currentSession;
    } catch (error: any) {
      console.error('Sign up failed:', error);
      
      // Handle specific Appwrite errors
      if (error.code === 409) {
        throw new Error('An account with this email already exists');
      } else if (error.code === 400) {
        throw new Error('Invalid email or password format');
      }
      
      throw new Error(error.message || 'Failed to create account');
    }
  }

  /**
   * Log in existing user
   */
  async login(credentials: AuthCredentials): Promise<Session> {
    try {
      console.log('🔄 Attempting login for:', credentials.email);
      
      // Create email session
      await account.createEmailPasswordSession(
        credentials.email,
        credentials.password
      );

      // Get user details
      const user = await account.get();

      this.currentSession = {
        userId: user.$id,
        email: user.email,
        name: user.name,
        sessionId: user.$id,
      };

      console.log('✅ Logged in:', this.currentSession.name);
      return this.currentSession;
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific Appwrite errors
      if (error.code === 401) {
        throw new Error('Invalid email or password');
      } else if (error.code === 429) {
        throw new Error('Too many login attempts. Please try again later');
      }
      
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Log out user
   */
  async logout(): Promise<void> {
    try {
      let shouldClearState = false;

      try {
        await account.deleteSession('current');
        shouldClearState = true;
      } catch (error: any) {
        const message = String(error?.message || '');
        const code = error?.code;

        if (code === 401 || code === 403 || message.includes('missing scopes')) {
          shouldClearState = true;
        } else {
          throw error;
        }
      }

      if (shouldClearState) {
        this.currentSession = null;
        this.sessionCheckPromise = null; // Clear any pending checks
        console.log('✅ Logged out successfully');

        // Clear state
        stateManager.setState('player', {
          id: '',
          name: '',
          highScore: 0,
          specialPoints: 500,
          gamesPlayed: 0,
          totalPlayTime: 0,
          themesUnlocked: [ThemeName.CLASSIC],
          selectedTheme: ThemeName.CLASSIC,
        });
      }
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
      await account.updateName(name);
      if (this.currentSession) {
        this.currentSession.name = name;
      }
      console.log('✅ Name updated to:', name);
    } catch (error) {
      console.error('Failed to update name:', error);
      throw new Error('Failed to update name');
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string, oldPassword: string): Promise<void> {
    try {
      await account.updatePassword(newPassword, oldPassword);
      console.log('✅ Password updated successfully');
    } catch (error: any) {
      console.error('Failed to update password:', error);
      
      if (error.code === 401) {
        throw new Error('Current password is incorrect');
      }
      
      throw new Error('Failed to update password');
    }
  }

  /**
   * Send password recovery email
   */
  async recoverPassword(email: string): Promise<void> {
    try {
      // Use hash routing directly - Appwrite will append ?userId=xxx&secret=yyy
      // Result: https://yourdomain.com/#/reset-password?userId=xxx&secret=yyy
      const redirectUrl = `${window.location.origin}/#/reset-password`;
      await account.createRecovery(email, redirectUrl);
      console.log('✅ Recovery email sent to:', email);
    } catch (error: any) {
      console.error('Password recovery failed:', error);
      
      if (error.code === 404) {
        // Don't reveal if email exists or not (security best practice)
        // Still show success message
        return;
      }
      
      throw new Error('Failed to send recovery email');
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
      await account.updateRecovery(userId, secret, newPassword);
      console.log('✅ Password reset successfully');
    } catch (error: any) {
      console.error('Password reset failed:', error);
      
      if (error.code === 401) {
        throw new Error('Invalid or expired recovery link');
      }
      
      throw new Error('Failed to reset password');
    }
  }

  /**
   * Delete current session (logout without clearing state)
   */
  async deleteSession(): Promise<void> {
    try {
      await account.deleteSession('current');
      this.currentSession = null;
      this.sessionCheckPromise = null; // Clear any pending checks
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  /**
   * Get current session from cache (doesn't make API call)
   */
  getCachedSession(): Session | null {
    return this.currentSession;
  }
}

// Singleton instance
export const authService = new AuthService();
