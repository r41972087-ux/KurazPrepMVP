import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import * as schema from '../../db/schema';

export default function PracticeScreen() {
  const router = useRouter();
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPracticeUnits();
  }, []);

  const loadPracticeUnits = async () => {
    try {
      const units = await db
        .select({
          unitId: schema.units.id,
          unitNumber: schema.units.unitNumber,
          unitTitle: schema.units.title,
          subjectId: schema.units.subjectId,
          subjectName: schema.subjects.name,
          gradeLevel: schema.subjects.gradeLevel,
        })
        .from(schema.units)
        .innerJoin(schema.subjects, eq(schema.units.subjectId, schema.subjects.id));

      const enriched = await Promise.all(
        units.map(async (u: any) => {
          const qs = await db
            .select({ id: schema.questions.id })
            .from(schema.questions)
            .where(eq(schema.questions.unitId, u.unitId));

          return {
            ...u,
            questionsCount: qs.length,
          };
        })
      );

      setUnitsList(enriched);
    } catch (e) {
      console.error('Failed to load practice units:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ESSLCE MCQ Practice</Text>
        <Text style={styles.headerSubtitle}>
          Test your conceptual understanding with instant feedback, step-by-step solutions, and offline tracking.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : unitsList.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="help-circle-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Practice Quizzes Yet</Text>
          <Text style={styles.emptySubtitle}>
            Go to the Study tab to initialize or sync curriculum units.
          </Text>
        </View>
      ) : (
        <FlatList
          data={unitsList}
          keyExtractor={(item) => item.unitId}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.unitCard}>
              <View style={styles.unitInfo}>
                <View style={styles.badgeRow}>
                  <View style={styles.subjectBadge}>
                    <Text style={styles.subjectBadgeText}>{item.subjectName}</Text>
                  </View>
                  <Text style={styles.gradeText}>Grade {item.gradeLevel}</Text>
                </View>
                <Text style={styles.unitTitle}>
                  Unit {item.unitNumber}: {item.unitTitle}
                </Text>
                <Text style={styles.metaText}>
                  {item.questionsCount} ESSLCE practice questions
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.startQuizButton,
                  item.questionsCount === 0 && styles.disabledButton,
                ]}
                disabled={item.questionsCount === 0}
                onPress={() =>
                  router.push({
                    pathname: '/quiz/[unitId]',
                    params: {
                      unitId: item.unitId,
                      title: item.unitTitle,
                      subjectId: item.subjectId,
                    },
                  })
                }
              >
                <Ionicons name="play" size={16} color="#FFFFFF" />
                <Text style={styles.startQuizText}>Start</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unitInfo: {
    flex: 1,
    paddingRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  subjectBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    textTransform: 'uppercase',
  },
  gradeText: {
    fontSize: 12,
    color: '#64748B',
  },
  unitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  startQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  startQuizText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
