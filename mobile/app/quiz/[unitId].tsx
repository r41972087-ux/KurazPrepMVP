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
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import * as schema from '../../db/schema';
import { QuizCard, Option } from '../../components/QuizCard';
import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';
import { SyncManager } from '../../services/syncManager';

export default function QuizEngineScreen() {
  const router = useRouter();
  const { unitId, title, subjectId } = useLocalSearchParams<{
    unitId: string;
    title: string;
    subjectId: string;
  }>();

  const { user, isGuest } = useAuthStore();
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [answers, setAnswers] = useState<Record<number, { selectedId: string; isCorrect: boolean }>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [savingAttempt, setSavingAttempt] = useState(false);

  useEffect(() => {
    if (!unitId) return;
    loadQuestions();
  }, [unitId]);

  const loadQuestions = async () => {
    try {
      const data = await db
        .select()
        .from(schema.questions)
        .where(eq(schema.questions.unitId, unitId));

      const parsed = data.map((q) => {
        let opts: Option[] = [];
        try {
          opts = typeof q.optionsJson === 'string' ? JSON.parse(q.optionsJson) : q.optionsJson;
        } catch (e) {
          opts = [];
        }
        return {
          ...q,
          options: opts,
        };
      });

      setQuestionsList(parsed);
    } catch (e) {
      console.error('Failed to load quiz questions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (selectedId: string, isCorrect: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: { selectedId, isCorrect },
    }));
  };

  const handleNext = async () => {
    if (currentIndex < questionsList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      await finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setSavingAttempt(true);

    const total = questionsList.length;
    const correctCount = Object.values(answers).filter((a) => a.isCorrect).length;
    const score = total > 0 ? (correctCount / total) * 100 : 0;

    // Generate local UUID
    const attemptId = 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    const resolvedSubjectId = subjectId || 'subj-phys-12';

    try {
      // Direct local SQLite persistence via Drizzle ORM
      await db.insert(schema.quizAttempts).values({
        id: attemptId,
        userId: isGuest ? null : user?.id || null,
        subjectId: resolvedSubjectId,
        unitId: unitId,
        score: score,
        totalQuestions: total,
        correctCount: correctCount,
        isSynced: false, // Stored as offline attempt
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      // Update sync store with pending unsynced attempt
      await SyncManager.refreshPendingAttemptsCount();
    } catch (err) {
      console.error('Failed to save quiz attempt locally to SQLite:', err);
    } finally {
      setSavingAttempt(false);
      setIsFinished(true);
    }
  };

  const currentQ = questionsList[currentIndex];
  const hasAnsweredCurrent = answers[currentIndex] !== undefined;

  // Render Results Summary Screen
  if (isFinished) {
    const total = questionsList.length;
    const correctCount = Object.values(answers).filter((a) => a.isCorrect).length;
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const isPassing = scorePercent >= 60;

    return (
      <View style={styles.resultsContainer}>
        <View style={styles.resultsCard}>
          <View
            style={[
              styles.scoreCircle,
              isPassing ? styles.scoreCirclePass : styles.scoreCircleFail,
            ]}
          >
            <Text style={styles.scoreText}>{scorePercent}%</Text>
            <Text style={styles.scoreSubText}>
              {correctCount} of {total}
            </Text>
          </View>

          <Text style={styles.resultsTitle}>
            {isPassing ? '🎉 Great Job!' : '📚 Needs Practice'}
          </Text>
          <Text style={styles.resultsSubtitle}>
            {isPassing
              ? 'You have a solid conceptual understanding of this unit!'
              : 'Review the short notes and formulas, then give it another try.'}
          </Text>

          {/* Local SQLite persistence confirmation */}
          <View style={styles.offlineSavedBanner}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#34D399" />
            <Text style={styles.offlineSavedText}>
              Saved to offline database (will sync score when online)
            </Text>
          </View>

          <View style={styles.resultsActions}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setAnswers({});
                setCurrentIndex(0);
                setIsFinished(false);
              }}
            >
              <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retake Quiz</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => router.back()}
            >
              <Text style={styles.doneButtonText}>Return to Unit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Quiz Header & Progress Bar */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerUnitTitle}>{title || 'Unit Quiz'}</Text>
          <Text style={styles.headerProgressText}>
            {currentIndex + 1} / {questionsList.length || 1}
          </Text>
        </View>

        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${
                  questionsList.length > 0
                    ? ((currentIndex + 1) / questionsList.length) * 100
                    : 0
                }%`,
              },
            ]}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      ) : questionsList.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="help-circle-outline" size={48} color="#64748B" />
          <Text style={styles.emptyTitle}>No Questions Found</Text>
          <Text style={styles.emptySubtitle}>
            No practice MCQs available for this unit yet.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          <QuizCard
            questionNumber={currentIndex + 1}
            totalQuestions={questionsList.length}
            prompt={currentQ.prompt}
            options={currentQ.options}
            correctOptionId={currentQ.correctOptionId}
            explanation={currentQ.explanation}
            onAnswerSelected={handleAnswer}
          />

          {/* Next / Submit Button */}
          {hasAnsweredCurrent && (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              disabled={savingAttempt}
            >
              <Text style={styles.nextButtonText}>
                {savingAttempt
                  ? 'Saving to SQLite...'
                  : currentIndex === questionsList.length - 1
                  ? 'Finish Quiz & View Results'
                  : 'Next Question →'}
              </Text>
            </TouchableOpacity>
          )}
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
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerUnitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerProgressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#64748B',
    marginTop: 12,
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    padding: 24,
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
  },
  scoreCirclePass: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  scoreCircleFail: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
  },
  scoreSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  offlineSavedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 24,
  },
  offlineSavedText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  resultsActions: {
    width: '100%',
    gap: 10,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  doneButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doneButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
});
