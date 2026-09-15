import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface Option {
  id: string;
  text: string;
}

interface QuizCardProps {
  questionNumber: number;
  totalQuestions: number;
  prompt: string;
  options: Option[];
  correctOptionId: string;
  explanation: string;
  onAnswerSelected?: (selectedId: string, isCorrect: boolean) => void;
  disabled?: boolean;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  questionNumber,
  totalQuestions,
  prompt,
  options,
  correctOptionId,
  explanation,
  onAnswerSelected,
  disabled = false,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSelectOption = (optionId: string) => {
    if (hasSubmitted || disabled) return;

    setSelectedOptionId(optionId);
    setHasSubmitted(true);
    const isCorrect = optionId === correctOptionId;
    if (onAnswerSelected) {
      onAnswerSelected(optionId, isCorrect);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header with counter */}
      <View style={styles.header}>
        <Text style={styles.counterText}>
          Question {questionNumber} of {totalQuestions}
        </Text>
        {hasSubmitted && (
          <View
            style={[
              styles.statusBadge,
              selectedOptionId === correctOptionId ? styles.badgeCorrect : styles.badgeIncorrect,
            ]}
          >
            <Text style={styles.badgeText}>
              {selectedOptionId === correctOptionId ? '✓ CORRECT' : '✗ INCORRECT'}
            </Text>
          </View>
        )}
      </View>

      {/* Question Prompt */}
      <Text style={styles.prompt}>{prompt}</Text>

      {/* Options List */}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const letter = String.fromCharCode(65 + index); // A, B, C, D
          const isSelected = selectedOptionId === option.id;
          const isCorrect = option.id === correctOptionId;

          let optionStyle = styles.optionNormal;
          let letterBoxStyle = styles.letterBoxNormal;
          let textStyle = styles.optionTextNormal;

          if (hasSubmitted) {
            if (isCorrect) {
              optionStyle = styles.optionCorrect;
              letterBoxStyle = styles.letterBoxCorrect;
              textStyle = styles.optionTextCorrect;
            } else if (isSelected && !isCorrect) {
              optionStyle = styles.optionIncorrect;
              letterBoxStyle = styles.letterBoxIncorrect;
              textStyle = styles.optionTextIncorrect;
            } else {
              optionStyle = styles.optionDimmed;
            }
          } else if (isSelected) {
            optionStyle = styles.optionSelected;
            letterBoxStyle = styles.letterBoxSelected;
          }

          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.75}
              style={[styles.optionBase, optionStyle]}
              onPress={() => handleSelectOption(option.id)}
              disabled={hasSubmitted || disabled}
            >
              <View style={[styles.letterBox, letterBoxStyle]}>
                <Text style={styles.letterText}>{letter}</Text>
              </View>
              <Text style={[styles.optionText, textStyle]}>{option.text}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Immediate Feedback & Explanation */}
      {hasSubmitted && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>💡 Explanation</Text>
          <Text style={styles.explanationContent}>{explanation}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  badgeIncorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  prompt: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 18,
  },
  optionsContainer: {
    gap: 10,
  },
  optionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionNormal: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  optionSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#38BDF8',
  },
  optionCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  optionIncorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  optionDimmed: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    opacity: 0.5,
  },
  letterBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  letterBoxNormal: {
    backgroundColor: '#334155',
  },
  letterBoxSelected: {
    backgroundColor: '#38BDF8',
  },
  letterBoxCorrect: {
    backgroundColor: '#10B981',
  },
  letterBoxIncorrect: {
    backgroundColor: '#EF4444',
  },
  letterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  optionTextNormal: {
    color: '#E2E8F0',
  },
  optionTextCorrect: {
    color: '#6EE7B7',
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: '#FCA5A5',
  },
  explanationBox: {
    marginTop: 18,
    padding: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  explanationContent: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
});
