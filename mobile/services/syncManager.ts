import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import * as schema from '../db/schema';
import { api } from './api';
import { useSyncStore } from '../stores/syncStore';

export class SyncManager {
  private static isSyncRunning = false;

  /**
   * Performs full delta sync across subjects and uploads pending offline quiz attempts
   */
  static async syncAll(subjectIds?: string[]): Promise<{
    updatedSubjects: number;
    syncedAttempts: number;
    errors: string[];
  }> {
    if (this.isSyncRunning) {
      return { updatedSubjects: 0, syncedAttempts: 0, errors: ['Sync already in progress'] };
    }

    this.isSyncRunning = true;
    const syncStore = useSyncStore.getState();
    syncStore.setIsSyncing(true);
    syncStore.setSyncProgress(10, 'Checking connectivity & local records...');

    const errors: string[] = [];
    let updatedSubjects = 0;
    let syncedAttempts = 0;

    try {
      // Step 1: Upload pending offline quiz attempts first
      syncedAttempts = await this.uploadPendingAttempts();
      syncStore.setSyncProgress(30, 'Offline attempts synchronized');

      // Step 2: Fetch target subjects (either provided or from local DB / API)
      let targetIds = subjectIds;
      if (!targetIds || targetIds.length === 0) {
        try {
          const remoteData = await api.getSubjects();
          if (remoteData?.subjects) {
            targetIds = remoteData.subjects.map((s: any) => s.id);
          }
        } catch (e: any) {
          // If remote list fails, fall back to local subjects
          const localSubjs = await db.select({ id: schema.subjects.id }).from(schema.subjects);
          targetIds = localSubjs.map((s) => s.id);
        }
      }

      if (!targetIds || targetIds.length === 0) {
        syncStore.setSyncProgress(100, 'All curriculum up-to-date');
        return { updatedSubjects: 0, syncedAttempts, errors };
      }

      // Step 3: Delta sync each subject
      const total = targetIds.length;
      for (let i = 0; i < total; i++) {
        const id = targetIds[i];
        const progress = 30 + Math.round(((i + 1) / total) * 60);
        syncStore.setSyncProgress(progress, `Syncing subject ${i + 1} of ${total}...`);

        try {
          const wasUpdated = await this.syncSubjectDelta(id);
          if (wasUpdated) updatedSubjects++;
        } catch (err: any) {
          errors.push(`Failed to sync subject ${id}: ${err.message}`);
        }
      }

      syncStore.setLastSyncedAt(new Date().toISOString());
      syncStore.setSyncProgress(100, 'Sync complete');
    } catch (err: any) {
      errors.push(`General sync failure: ${err.message}`);
      syncStore.setSyncError(err.message);
    } finally {
      this.isSyncRunning = false;
      syncStore.setIsSyncing(false);
      // Refresh count of pending attempts
      await this.refreshPendingAttemptsCount();
    }

    return { updatedSubjects, syncedAttempts, errors };
  }

  /**
   * Delta syncs a single subject using its local contentHash
   */
  static async syncSubjectDelta(subjectId: string): Promise<boolean> {
    // 1. Get current local contentHash
    const localMeta = await db
      .select()
      .from(schema.syncMetadata)
      .where(eq(schema.syncMetadata.subjectId, subjectId))
      .limit(1);

    const localHash = localMeta.length > 0 ? localMeta[0].contentHash : undefined;

    // 2. Call backend delta sync endpoint
    const response = await api.syncSubject(subjectId, localHash);

    // 3. If server returned 304 Not Modified, nothing to update
    if (response.notModified || !response.data) {
      return false;
    }

    const payload = response.data;

    // 4. Use Drizzle transaction to safely upsert curriculum data atomically
    await db.transaction(async (tx) => {
      // Upsert Subject
      await tx
        .insert(schema.subjects)
        .values({
          id: payload.subject.id,
          name: payload.subject.name,
          stream: payload.subject.stream,
          gradeLevel: payload.subject.gradeLevel,
          icon: payload.subject.icon,
          updatedAt: payload.subject.updatedAt,
        })
        .onConflictDoUpdate({
          target: schema.subjects.id,
          set: {
            name: payload.subject.name,
            stream: payload.subject.stream,
            gradeLevel: payload.subject.gradeLevel,
            icon: payload.subject.icon,
            updatedAt: payload.subject.updatedAt,
          },
        });

      // Upsert Units, Short Notes, and Questions
      for (const unit of payload.units) {
        await tx
          .insert(schema.units)
          .values({
            id: unit.id,
            subjectId: unit.subjectId,
            unitNumber: unit.unitNumber,
            title: unit.title,
            updatedAt: unit.updatedAt,
          })
          .onConflictDoUpdate({
            target: schema.units.id,
            set: {
              unitNumber: unit.unitNumber,
              title: unit.title,
              updatedAt: unit.updatedAt,
            },
          });

        // Upsert Short Notes
        for (const note of unit.shortNotes) {
          await tx
            .insert(schema.shortNotes)
            .values({
              id: note.id,
              unitId: note.unitId,
              title: note.title,
              contentMarkdown: note.contentMarkdown,
              isHighYield: note.isHighYield,
              orderIndex: note.orderIndex,
              updatedAt: note.updatedAt,
            })
            .onConflictDoUpdate({
              target: schema.shortNotes.id,
              set: {
                title: note.title,
                contentMarkdown: note.contentMarkdown,
                isHighYield: note.isHighYield,
                orderIndex: note.orderIndex,
                updatedAt: note.updatedAt,
              },
            });
        }

        // Upsert Questions
        for (const q of unit.questions) {
          await tx
            .insert(schema.questions)
            .values({
              id: q.id,
              unitId: q.unitId,
              prompt: q.prompt,
              optionsJson: typeof q.optionsJson === 'string' ? q.optionsJson : JSON.stringify(q.optionsJson),
              correctOptionId: q.correctOptionId,
              explanation: q.explanation,
              updatedAt: q.updatedAt,
            })
            .onConflictDoUpdate({
              target: schema.questions.id,
              set: {
                prompt: q.prompt,
                optionsJson: typeof q.optionsJson === 'string' ? q.optionsJson : JSON.stringify(q.optionsJson),
                correctOptionId: q.correctOptionId,
                explanation: q.explanation,
                updatedAt: q.updatedAt,
              },
            });
        }
      }

      // Upsert SyncMetadata with new contentHash
      await tx
        .insert(schema.syncMetadata)
        .values({
          id: `meta-${payload.subject.id}`,
          subjectId: payload.subject.id,
          contentHash: payload.contentHash,
          version: payload.version,
          lastUpdated: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: schema.syncMetadata.subjectId,
          set: {
            contentHash: payload.contentHash,
            version: payload.version,
            lastUpdated: new Date().toISOString(),
          },
        });
    });

    return true;
  }

  /**
   * Uploads local unsynced quiz attempts to backend
   */
  static async uploadPendingAttempts(): Promise<number> {
    const pending = await db
      .select()
      .from(schema.quizAttempts)
      .where(eq(schema.quizAttempts.isSynced, false))
      .limit(50);

    if (pending.length === 0) {
      useSyncStore.getState().setPendingAttemptsCount(0);
      return 0;
    }

    try {
      const payload = pending.map((a) => ({
        id: a.id,
        subjectId: a.subjectId,
        unitId: a.unitId,
        score: a.score,
        totalQuestions: a.totalQuestions,
        correctCount: a.correctCount,
        completedAt: a.completedAt,
      }));

      const res = await api.uploadAttempts(payload);

      if (res?.syncedIds && res.syncedIds.length > 0) {
        // Mark these attempts as synced in local SQLite
        await db
          .update(schema.quizAttempts)
          .set({ isSynced: true })
          .where(inArray(schema.quizAttempts.id, res.syncedIds));

        return res.syncedIds.length;
      }
    } catch (e) {
      console.warn('Could not upload offline quiz attempts (will retry later):', e);
    }

    return 0;
  }

  /**
   * Refreshes the pending unsynced attempts count in the Zustand store
   */
  static async refreshPendingAttemptsCount(): Promise<number> {
    const pending = await db
      .select({ id: schema.quizAttempts.id })
      .from(schema.quizAttempts)
      .where(eq(schema.quizAttempts.isSynced, false));

    const count = pending.length;
    useSyncStore.getState().setPendingAttemptsCount(count);
    return count;
  }
}
