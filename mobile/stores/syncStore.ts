import { create } from 'zustand';

interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncProgress: number; // 0 to 100%
  syncMessage: string | null;
  syncError: string | null;
  pendingAttemptsCount: number;

  setIsSyncing: (isSyncing: boolean) => void;
  setLastSyncedAt: (date: string) => void;
  setSyncProgress: (progress: number, message?: string) => void;
  setSyncError: (error: string | null) => void;
  setPendingAttemptsCount: (count: number) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncedAt: null,
  syncProgress: 0,
  syncMessage: null,
  syncError: null,
  pendingAttemptsCount: 0,

  setIsSyncing: (isSyncing) => set({ isSyncing, syncError: isSyncing ? null : undefined }),
  setLastSyncedAt: (date) => set({ lastSyncedAt: date }),
  setSyncProgress: (progress, message) =>
    set({
      syncProgress: progress,
      ...(message !== undefined ? { syncMessage: message } : {}),
    }),
  setSyncError: (error) => set({ syncError: error, isSyncing: false }),
  setPendingAttemptsCount: (count) => set({ pendingAttemptsCount: count }),
}));
