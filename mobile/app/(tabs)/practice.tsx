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

      // Fetch questions count for each unit
      const enriched = await Promise.all(
        units.map(async (u) => {
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
          <ActivityIndicator size="large" color="#38BDF8" />
        </View>
      ) : unitsList.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="help-circle-outline" size={48} color="#64748B" />
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
    backgroundColor: '#0B0F19',
  },
  header: {
    padding: 18,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
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
    color: '#F8FAFC',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
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
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  gradeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  unitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
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
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  disabledButton: {
    backgroundColor: '#334155',
  },
  startQuizText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
