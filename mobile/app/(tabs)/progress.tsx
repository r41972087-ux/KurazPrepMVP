import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import * as schema from '../../db/schema';
import { useSyncStore } from '../../stores/syncStore';
import { SyncManager } from '../../services/syncManager';

export default function ProgressScreen() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalAttempts: 0, avgScore: 0, totalQuestions: 0 });
  const [loading, setLoading] = useState(true);
  const { isSyncing } = useSyncStore();

  const loadProgress = async () => {
    try {
      const records = await db
        .select({
          id: schema.quizAttempts.id,
          subjectId: schema.quizAttempts.subjectId,
          subjectName: schema.subjects.name,
          unitId: schema.quizAttempts.unitId,
          score: schema.quizAttempts.score,
          totalQuestions: schema.quizAttempts.totalQuestions,
          correctCount: schema.quizAttempts.correctCount,
          isSynced: schema.quizAttempts.isSynced,
          completedAt: schema.quizAttempts.completedAt,
        })
        .from(schema.quizAttempts)
        .leftJoin(schema.subjects, eq(schema.quizAttempts.subjectId, schema.subjects.id))
        .orderBy(desc(schema.quizAttempts.completedAt));

      setAttempts(records);

      if (records.length > 0) {
        const total = records.length;
        const sumScore = records.reduce((acc, r) => acc + r.score, 0);
        const sumQuestions = records.reduce((acc, r) => acc + r.totalQuestions, 0);
        setStats({
          totalAttempts: total,
          avgScore: Math.round(sumScore / total),
          totalQuestions: sumQuestions,
        });
      } else {
        setStats({ totalAttempts: 0, avgScore: 0, totalQuestions: 0 });
      }
    } catch (e) {
      console.error('Failed to load progress stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [isSyncing]);

  const handleSyncNow = async () => {
    await SyncManager.syncAll();
    await loadProgress();
  };

  return (
    <View style={styles.container}>
      {/* Overview Stat Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.avgScore}%</Text>
          <Text style={styles.statLabel}>Avg. Score</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalAttempts}</Text>
          <Text style={styles.statLabel}>Quizzes Taken</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalQuestions}</Text>
          <Text style={styles.statLabel}>Total Solved</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quiz Attempt History</Text>
        <TouchableOpacity style={styles.syncButton} onPress={handleSyncNow} disabled={isSyncing}>
          <Ionicons name="sync-outline" size={14} color="#38BDF8" />
          <Text style={styles.syncButtonText}>{isSyncing ? 'Syncing...' : 'Sync History'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#38BDF8" />
        </View>
      ) : attempts.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bar-chart-outline" size={48} color="#64748B" />
          <Text style={styles.emptyTitle}>No Quiz Attempts Yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete practice quizzes to track your weak areas and track your readiness offline!
          </Text>
        </View>
      ) : (
        <FlatList
          data={attempts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const dateStr = new Date(item.completedAt).toLocaleDateString();

            return (
              <View style={styles.attemptCard}>
                <View style={styles.attemptMain}>
                  <Text style={styles.attemptSubject}>{item.subjectName || 'General Exam'}</Text>
                  <Text style={styles.attemptScore}>
                    {item.correctCount} / {item.totalQuestions} Correct ({Math.round(item.score)}%)
                  </Text>
                  <Text style={styles.attemptDate}>{dateStr}</Text>
                </View>

                {/* Sync status badge */}
                <View
                  style={[
                    styles.syncBadge,
                    item.isSynced ? styles.badgeSynced : styles.badgeOffline,
                  ]}
                >
                  <Ionicons
                    name={item.isSynced ? 'checkmark-circle' : 'cloud-offline'}
                    size={12}
                    color={item.isSynced ? '#34D399' : '#F59E0B'}
                  />
                  <Text
                    style={[
                      styles.syncBadgeText,
                      item.isSynced ? styles.textSynced : styles.textOffline,
                    ]}
                  >
                    {item.isSynced ? 'Synced' : 'Offline'}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#38BDF8',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  syncButtonText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  attemptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  attemptMain: {
    flex: 1,
  },
  attemptSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  attemptScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38BDF8',
    marginTop: 2,
  },
  attemptDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSynced: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  badgeOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textSynced: {
    color: '#34D399',
  },
  textOffline: {
    color: '#F59E0B',
  },
});
