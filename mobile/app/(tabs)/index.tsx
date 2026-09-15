import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/client';
import * as schema from '../../db/schema';
import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';
import { SyncManager } from '../../services/syncManager';

export default function SubjectsScreen() {
  const router = useRouter();
  const { selectedStream, setStream, selectedGrade, setGrade, isGuest } = useAuthStore();
  const { isSyncing, syncMessage, pendingAttemptsCount } = useSyncStore();

  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSubjects = useCallback(async () => {
    try {
      const data = await db
        .select()
        .from(schema.subjects)
        .where(
          and(
            eq(schema.subjects.stream, selectedStream),
            eq(schema.subjects.gradeLevel, selectedGrade)
          )
        );

      // Fetch unit counts per subject
      const enriched = await Promise.all(
        data.map(async (subj) => {
          const units = await db
            .select({ id: schema.units.id })
            .from(schema.units)
            .where(eq(schema.units.subjectId, subj.id));

          return {
            ...subj,
            unitCount: units.length,
          };
        })
      );

      setSubjectsList(enriched);
    } catch (err) {
      console.error('Failed to load local subjects:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStream, selectedGrade]);

  useEffect(() => {
    loadSubjects();
    SyncManager.refreshPendingAttemptsCount();
  }, [loadSubjects]);

  const onRefresh = async () => {
    setRefreshing(true);
    await SyncManager.syncAll();
    await loadSubjects();
  };

  // Seed sample starter curriculum directly if local database is freshly installed
  const seedLocalStarterData = async () => {
    setLoading(true);
    try {
      await db.transaction(async (tx) => {
        // Physics Grade 12
        await tx
          .insert(schema.subjects)
          .values({
            id: 'subj-phys-12',
            name: 'Physics',
            stream: 'NATURAL',
            gradeLevel: 12,
            icon: 'atom',
          })
          .onConflictDoNothing();

        await tx
          .insert(schema.units)
          .values({
            id: 'unit-phys12-1',
            subjectId: 'subj-phys-12',
            unitNumber: 1,
            title: 'Thermodynamics & Heat Engines',
          })
          .onConflictDoNothing();

        await tx
          .insert(schema.shortNotes)
          .values({
            id: 'note-phys12-1-1',
            unitId: 'unit-phys12-1',
            title: 'First Law of Thermodynamics',
            isHighYield: true,
            orderIndex: 1,
            contentMarkdown: `# First Law of Thermodynamics

The **First Law of Thermodynamics** states that energy cannot be created or destroyed:

$$\\Delta U = Q - W$$

Where:
* $\\Delta U$ = change in internal energy
* $Q$ = heat added to system ($Q > 0$ when absorbed)
* $W$ = work done by the system ($W = P\\Delta V$ at constant pressure)

### Thermodynamic Processes:
1. **Isochoric (Constant Volume):** $\\Delta V = 0 \\implies W = 0$, so $\\Delta U = Q$.
2. **Isobaric (Constant Pressure):** $W = P(V_2 - V_1)$.
3. **Isothermal (Constant Temp):** $\\Delta U = 0 \\implies Q = W$.
4. **Adiabatic (No Heat):** $Q = 0 \\implies \\Delta U = -W$.

> **ESSLCE Tip:** In an adiabatic expansion, gas cools down because it does work at the expense of its internal energy!`,
          })
          .onConflictDoNothing();

        await tx
          .insert(schema.questions)
          .values({
            id: 'q-phys12-1-1',
            unitId: 'unit-phys12-1',
            prompt: 'An ideal gas expands from 2.0 m³ to 5.0 m³ at a constant pressure of 1.0 × 10⁵ Pa. What is the work done by the gas?',
            optionsJson: JSON.stringify([
              { id: 'opt-a', text: '1.5 × 10⁵ J' },
              { id: 'opt-b', text: '3.0 × 10⁵ J' },
              { id: 'opt-c', text: '5.0 × 10⁵ J' },
              { id: 'opt-d', text: '7.0 × 10⁵ J' },
            ]),
            correctOptionId: 'opt-b',
            explanation: 'Work done at constant pressure: W = P * ΔV = 1.0 × 10⁵ Pa * (5.0 - 2.0) m³ = 3.0 × 10⁵ J.',
          })
          .onConflictDoNothing();

        // Mathematics Grade 12
        await tx
          .insert(schema.subjects)
          .values({
            id: 'subj-math-12',
            name: 'Mathematics',
            stream: 'NATURAL',
            gradeLevel: 12,
            icon: 'calculator',
          })
          .onConflictDoNothing();

        await tx
          .insert(schema.units)
          .values({
            id: 'unit-math12-1',
            subjectId: 'subj-math-12',
            unitNumber: 1,
            title: 'Sequences and Series',
          })
          .onConflictDoNothing();

        await tx
          .insert(schema.shortNotes)
          .values({
            id: 'note-math12-1-1',
            unitId: 'unit-math12-1',
            title: 'Arithmetic & Geometric Progressions',
            isHighYield: true,
            orderIndex: 1,
            contentMarkdown: `# Sequences and Series

### Arithmetic Progression (AP)
$$a_n = a_1 + (n - 1)d$$
$$S_n = \\frac{n}{2}(a_1 + a_n)$$

### Geometric Progression (GP)
$$a_n = a_1 \\cdot r^{n-1}$$
$$S_\\infty = \\frac{a_1}{1 - r} \\quad (|r| < 1)$$`,
          })
          .onConflictDoNothing();

        await tx
          .insert(schema.questions)
          .values({
            id: 'q-math12-1-1',
            unitId: 'unit-math12-1',
            prompt: 'If the sum of an infinite geometric series with first term a₁ = 6 is 18, what is the common ratio r?',
            optionsJson: JSON.stringify([
              { id: 'opt-a', text: '1/3' },
              { id: 'opt-b', text: '2/3' },
              { id: 'opt-c', text: '1/2' },
              { id: 'opt-d', text: '3/4' },
            ]),
            correctOptionId: 'opt-b',
            explanation: 'S_∞ = a₁ / (1 - r) => 18 = 6 / (1 - r) => 1 - r = 1/3 => r = 2/3.',
          })
          .onConflictDoNothing();
      });

      await loadSubjects();
    } catch (e) {
      console.error('Error seeding starter data:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Stream and Grade Filter Header */}
      <View style={styles.filterSection}>
        {/* Stream Pills */}
        <View style={styles.pillsRow}>
          <TouchableOpacity
            style={[styles.streamPill, selectedStream === 'NATURAL' && styles.streamPillActive]}
            onPress={() => setStream('NATURAL')}
          >
            <Text
              style={[
                styles.streamPillText,
                selectedStream === 'NATURAL' && styles.streamPillTextActive,
              ]}
            >
              🔬 Natural Science
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.streamPill, selectedStream === 'SOCIAL' && styles.streamPillActive]}
            onPress={() => setStream('SOCIAL')}
          >
            <Text
              style={[
                styles.streamPillText,
                selectedStream === 'SOCIAL' && styles.streamPillTextActive,
              ]}
            >
              📚 Social Science
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grade Pills */}
        <View style={styles.gradeRow}>
          <TouchableOpacity
            style={[styles.gradePill, selectedGrade === 11 && styles.gradePillActive]}
            onPress={() => setGrade(11)}
          >
            <Text
              style={[styles.gradePillText, selectedGrade === 11 && styles.gradePillTextActive]}
            >
              Grade 11
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gradePill, selectedGrade === 12 && styles.gradePillActive]}
            onPress={() => setGrade(12)}
          >
            <Text
              style={[styles.gradePillText, selectedGrade === 12 && styles.gradePillTextActive]}
            >
              Grade 12
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sync Status Bar */}
      {isSyncing ? (
        <View style={styles.syncBanner}>
          <ActivityIndicator size="small" color="#38BDF8" />
          <Text style={styles.syncBannerText}>{syncMessage || 'Syncing delta updates...'}</Text>
        </View>
      ) : pendingAttemptsCount > 0 ? (
        <View style={styles.offlineNoticeBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#F59E0B" />
          <Text style={styles.offlineNoticeText}>
            {pendingAttemptsCount} offline quiz attempt(s) ready to sync
          </Text>
        </View>
      ) : null}

      {/* Subject List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38BDF8" />
          <Text style={styles.loadingText}>Loading subjects...</Text>
        </View>
      ) : subjectsList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={54} color="#64748B" />
          <Text style={styles.emptyTitle}>No Subjects Installed</Text>
          <Text style={styles.emptySubtitle}>
            No offline curriculum found for {selectedStream} Science (Grade {selectedGrade}).
          </Text>
          <TouchableOpacity style={styles.starterButton} onPress={seedLocalStarterData}>
            <Ionicons name="download-outline" size={18} color="#FFFFFF" />
            <Text style={styles.starterButtonText}>Load Starter ESSLCE Pack (Offline)</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={subjectsList}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.subjectCard}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/subjects/[id]',
                  params: { id: item.id, name: item.name },
                })
              }
            >
              <View style={styles.subjectIconBox}>
                <Ionicons
                  name={item.name === 'Physics' ? 'flash-outline' : 'calculator-outline'}
                  size={26}
                  color="#38BDF8"
                />
              </View>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{item.name}</Text>
                <Text style={styles.subjectMeta}>
                  Grade {item.gradeLevel} • {item.unitCount} {item.unitCount === 1 ? 'Unit' : 'Units'} available
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
          )}
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
  filterSection: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  streamPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  streamPillActive: {
    backgroundColor: '#0284C7',
  },
  streamPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  streamPillTextActive: {
    color: '#FFFFFF',
  },
  gradeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gradePill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  gradePillActive: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  gradePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  gradePillTextActive: {
    color: '#38BDF8',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
  },
  syncBannerText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '500',
  },
  offlineNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.2)',
  },
  offlineNoticeText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  starterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  starterButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  subjectIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subjectMeta: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 3,
  },
});
