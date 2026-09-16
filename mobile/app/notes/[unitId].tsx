import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eq, asc } from 'drizzle-orm';
import { db } from '../../db/client';
import * as schema from '../../db/schema';
import { MathMarkdown } from '../../components/MathMarkdown';

export default function ShortNoteReaderScreen() {
  const router = useRouter();
  const { unitId, title } = useLocalSearchParams<{ unitId: string; title: string }>();

  const [notes, setNotes] = useState<any[]>([]);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unitInfo, setUnitInfo] = useState<any>(null);

  useEffect(() => {
    if (!unitId) return;
    loadNotes();
  }, [unitId]);

  const loadNotes = async () => {
    try {
      // Get unit details
      const u = await db.select().from(schema.units).where(eq(schema.units.id, unitId)).limit(1);
      if (u.length > 0) setUnitInfo(u[0]);

      // Get short notes for unit
      const noteList = await db
        .select()
        .from(schema.shortNotes)
        .where(eq(schema.shortNotes.unitId, unitId))
        .orderBy(asc(schema.shortNotes.orderIndex));

      setNotes(noteList);
    } catch (e) {
      console.error('Failed to load short notes:', e);
    } finally {
      setLoading(false);
    }
  };

  const activeNote = notes[activeNoteIndex];

  return (
    <View style={styles.container}>
      {/* Unit header */}
      <View style={styles.header}>
        <Text style={styles.unitSub}>
          {unitInfo ? `Unit ${unitInfo.unitNumber}` : 'Curriculum Unit'}
        </Text>
        <Text style={styles.unitTitle}>{title || unitInfo?.title || 'Short Notes'}</Text>
      </View>

      {/* Note Tabs if multiple notes exist */}
      {notes.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {notes.map((note, idx) => (
            <TouchableOpacity
              key={note.id}
              style={[styles.noteTab, activeNoteIndex === idx && styles.noteTabActive]}
              onPress={() => setActiveNoteIndex(idx)}
            >
              <Text
                style={[
                  styles.noteTabText,
                  activeNoteIndex === idx && styles.noteTabTextActive,
                ]}
              >
                Part {idx + 1}: {note.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : notes.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="reader-outline" size={48} color="#64748B" />
          <Text style={styles.emptyTitle}>No Notes Available</Text>
          <Text style={styles.emptySubtitle}>
            No offline notes found for this unit.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentPadding}>
          {/* Note Title & High Yield Tag */}
          <View style={styles.noteTitleRow}>
            <Text style={styles.noteTitle}>{activeNote.title}</Text>
            {activeNote.isHighYield && (
              <View style={styles.highYieldPill}>
                <Ionicons name="star" size={12} color="#D97706" />
                <Text style={styles.highYieldPillText}>ESSLCE High Yield</Text>
              </View>
            )}
          </View>

          {/* Render Markdown & LaTeX */}
          <MathMarkdown content={activeNote.contentMarkdown} />

          {/* Bottom Quiz Callout */}
          <TouchableOpacity
            style={styles.quizCallout}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/quiz/[unitId]',
                params: {
                  unitId: unitId,
                  title: title || unitInfo?.title || 'Practice Quiz',
                  subjectId: unitInfo?.subjectId || '',
                },
              })
            }
          >
            <View style={styles.calloutTextContainer}>
              <Text style={styles.calloutTitle}>Ready to test your recall?</Text>
              <Text style={styles.calloutSubtitle}>Take the instant practice quiz for this unit</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="#2563EB" />
          </TouchableOpacity>
        </ScrollView>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  unitSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  unitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  noteTab: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noteTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  noteTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  noteTabTextActive: {
    color: '#FFFFFF',
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
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  contentScroll: {
    flex: 1,
  },
  contentPadding: {
    padding: 20,
    paddingBottom: 40,
  },
  noteTitleRow: {
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 28,
  },
  highYieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  highYieldPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  quizCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 14,
    padding: 16,
    marginTop: 28,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  calloutTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  calloutSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
