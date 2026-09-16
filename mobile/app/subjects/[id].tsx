import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eq, asc } from 'drizzle-orm';
import { db } from '../../db/client';
import * as schema from '../../db/schema';

export default function SubjectUnitsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [subject, setSubject] = useState<any>(null);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadSubjectData();
  }, [id]);

  const loadSubjectData = async () => {
    try {
      // 1. Fetch Subject details
      const subjs = await db
        .select()
        .from(schema.subjects)
        .where(eq(schema.subjects.id, id))
        .limit(1);

      if (subjs.length > 0) {
        setSubject(subjs[0]);
      }

      // 2. Fetch Units with note & question counts
      const units = await db
        .select()
        .from(schema.units)
        .where(eq(schema.units.subjectId, id))
        .orderBy(asc(schema.units.unitNumber));

      const enriched = await Promise.all(
        units.map(async (unit) => {
          const notes = await db
            .select({ id: schema.shortNotes.id, isHighYield: schema.shortNotes.isHighYield })
            .from(schema.shortNotes)
            .where(eq(schema.shortNotes.unitId, unit.id));

          const qs = await db
            .select({ id: schema.questions.id })
            .from(schema.questions)
            .where(eq(schema.questions.unitId, unit.id));

          const highYieldCount = notes.filter((n) => n.isHighYield).length;

          return {
            ...unit,
            notesCount: notes.length,
            highYieldCount,
            questionsCount: qs.length,
          };
        })
      );

      setUnitsList(enriched);
    } catch (e) {
      console.error('Failed to load subject units:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Subject Header Banner */}
      {subject && (
        <View style={styles.headerBanner}>
          <Text style={styles.subjectTitle}>{subject.name}</Text>
          <Text style={styles.subjectSubtitle}>
            Grade {subject.gradeLevel} • {subject.stream} Science Stream
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : unitsList.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="documents-outline" size={48} color="#64748B" />
          <Text style={styles.emptyTitle}>No Units Found</Text>
          <Text style={styles.emptySubtitle}>
            No offline units installed yet for this subject.
          </Text>
        </View>
      ) : (
        <FlatList
          data={unitsList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.unitCard}>
              <View style={styles.unitHeader}>
                <View style={styles.unitNumberBadge}>
                  <Text style={styles.unitNumberText}>Unit {item.unitNumber}</Text>
                </View>
                {item.highYieldCount > 0 && (
                  <View style={styles.highYieldBadge}>
                    <Text style={styles.highYieldText}>★ High Yield</Text>
                  </View>
                )}
              </View>

              <Text style={styles.unitTitle}>{item.title}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  📖 {item.notesCount} Short Note{item.notesCount !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.metaText}>
                  ❓ {item.questionsCount} Practice Question{item.questionsCount !== 1 ? 's' : ''}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    styles.notesBtn,
                    item.notesCount === 0 && styles.disabledBtn,
                  ]}
                  disabled={item.notesCount === 0}
                  onPress={() =>
                    router.push({
                      pathname: '/notes/[unitId]',
                      params: { unitId: item.id, title: item.title },
                    })
                  }
                >
                  <Ionicons name="book-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Study Notes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    styles.quizBtn,
                    item.questionsCount === 0 && styles.disabledBtn,
                  ]}
                  disabled={item.questionsCount === 0}
                  onPress={() =>
                    router.push({
                      pathname: '/quiz/[unitId]',
                      params: {
                        unitId: item.id,
                        title: item.title,
                        subjectId: subject?.id || '',
                      },
                    })
                  }
                >
                  <Ionicons name="play-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Take Quiz</Text>
                </TouchableOpacity>
              </View>
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
  headerBanner: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subjectTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subjectSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  unitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  unitNumberBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  unitNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  highYieldBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  highYieldText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  unitTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  notesBtn: {
    backgroundColor: '#2563EB',
  },
  quizBtn: {
    backgroundColor: '#0284C7',
  },
  disabledBtn: {
    backgroundColor: '#CBD5E1',
    opacity: 0.6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
