/**
 * GroupManager - Appwrite-backed group/room system
 */

import { databases } from '@lib/appwrite';
import { ID, Query } from 'appwrite';
import type { Group, GroupScore } from '../types/game';

export class GroupManager {
  private databaseId: string;
  private groupsCollectionId: string;
  private groupScoresCollectionId: string;

  constructor() {
    this.databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    this.groupsCollectionId = import.meta.env.VITE_APPWRITE_GROUPS_COLLECTION_ID;
    this.groupScoresCollectionId = import.meta.env.VITE_APPWRITE_GROUPSCORES_COLLECTION_ID;

    if (!this.databaseId || !this.groupsCollectionId || !this.groupScoresCollectionId) {
      console.error('Missing Appwrite group collection configuration.');
    }
  }

  public generateRoomCode(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  public async createGroup(userId: string, groupName: string, userName: string): Promise<Group> {
    const roomCode = this.generateRoomCode();

    const group = await databases.createDocument(
      this.databaseId,
      this.groupsCollectionId,
      ID.unique(),
      {
        roomCode,
        groupName,
        createdBy: userId,
        memberIds: [userId],
        memberCount: 1,
        isActive: true,
      }
    );

    await this.ensureGroupScore(userId, userName, group.$id);

    return group as unknown as Group;
  }

  public async joinGroup(userId: string, userName: string, roomCode: string): Promise<Group> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.groupsCollectionId,
      [Query.equal('roomCode', roomCode), Query.limit(1)]
    );

    if (response.documents.length === 0) {
      throw new Error('Room code not found');
    }

    const group = response.documents[0] as unknown as Group;

    if (!group.memberIds.includes(userId)) {
      const memberIds = [...group.memberIds, userId];
      await databases.updateDocument(
        this.databaseId,
        this.groupsCollectionId,
        group.$id,
        {
          memberIds,
          memberCount: memberIds.length,
        }
      );
    }

    await this.ensureGroupScore(userId, userName, group.$id);

    return group;
  }

  public async leaveGroup(userId: string, groupId: string): Promise<void> {
    const group = await databases.getDocument(
      this.databaseId,
      this.groupsCollectionId,
      groupId
    );

    const memberIds = (group.memberIds || []).filter((id: string) => id !== userId);
    await databases.updateDocument(
      this.databaseId,
      this.groupsCollectionId,
      groupId,
      {
        memberIds,
        memberCount: memberIds.length,
      }
    );
  }

  public async getGroupInfo(groupId: string): Promise<Group> {
    const group = await databases.getDocument(
      this.databaseId,
      this.groupsCollectionId,
      groupId
    );

    return group as unknown as Group;
  }

  public async getGroupLeaderboard(groupId: string): Promise<GroupScore[]> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.groupScoresCollectionId,
      [Query.equal('groupId', groupId), Query.orderDesc('bestScore'), Query.limit(100)]
    );

    return response.documents.map((doc) => ({
      $id: doc.$id,
      userId: doc.userId as string,
      groupId: doc.groupId as string,
      userName: doc.userName as string,
      bestScore: doc.bestScore as number,
      gamesPlayed: doc.gamesPlayed as number,
      lastPlayedAt: doc.lastPlayedAt as string | undefined,
      difficulty: doc.difficulty as string | undefined,
    }));
  }

  public async recordGroupScore(
    userId: string,
    userName: string,
    groupId: string,
    score: number,
    difficulty: string
  ): Promise<void> {
    try {
      const existing = await this.getGroupScore(userId, groupId);

      if (!existing) {
        try {
          await databases.createDocument(
            this.databaseId,
            this.groupScoresCollectionId,
            ID.unique(),
            {
              userId,
              groupId,
              userName,
              bestScore: score,
              gamesPlayed: 1,
              difficulty,
            }
          );
          return;
        } catch (createError: any) {
          // If document already exists (race condition), fetch it and update
          if (createError.code === 409 || createError.message?.includes('already exists')) {
            const refetched = await this.getGroupScore(userId, groupId);
            if (refetched) {
              const bestScore = Math.max(refetched.bestScore, score);
              await databases.updateDocument(
                this.databaseId,
                this.groupScoresCollectionId,
                refetched.$id,
                {
                  bestScore,
                  gamesPlayed: refetched.gamesPlayed + 1,
                  difficulty,
                }
              );
              return;
            }
          }
          throw createError;
        }
      }

      const bestScore = Math.max(existing.bestScore, score);
      await databases.updateDocument(
        this.databaseId,
        this.groupScoresCollectionId,
        existing.$id,
        {
          bestScore,
          gamesPlayed: existing.gamesPlayed + 1,
          difficulty,
        }
      );
    } catch (error) {
      console.error('Error recording group score:', error);
      // Don't throw - just log the error so the game can continue
    }
  }

  public async getUserGroups(userId: string): Promise<Group[]> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.groupsCollectionId,
      [Query.contains('memberIds', userId), Query.orderDesc('$createdAt')]
    );

    return response.documents as unknown as Group[];
  }

  private async getGroupScore(userId: string, groupId: string): Promise<GroupScore | null> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.groupScoresCollectionId,
      [Query.equal('userId', userId), Query.equal('groupId', groupId), Query.limit(1)]
    );

    if (response.documents.length === 0) return null;

    const doc = response.documents[0];
    return {
      $id: doc.$id,
      userId: doc.userId as string,
      groupId: doc.groupId as string,
      userName: doc.userName as string,
      bestScore: doc.bestScore as number,
      gamesPlayed: doc.gamesPlayed as number,
      lastPlayedAt: doc.lastPlayedAt as string | undefined,
      difficulty: doc.difficulty as string | undefined,
    };
  }

  private async ensureGroupScore(userId: string, userName: string, groupId: string): Promise<void> {
    const existing = await this.getGroupScore(userId, groupId);
    if (existing) return;

    await databases.createDocument(
      this.databaseId,
      this.groupScoresCollectionId,
      ID.unique(),
      {
        userId,
        groupId,
        userName,
        bestScore: 0,
        gamesPlayed: 0,
        lastPlayedAt: new Date().toISOString(),
        difficulty: 'standard',
      }
    );
  }
}
