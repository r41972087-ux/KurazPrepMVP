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
                <Text
                  style={[
                    styles.letterText,
                    (isSelected || (hasSubmitted && (isCorrect || isSelected))) &&
                      styles.letterTextSelected,
                  ]}
                >
                  {letter}
                </Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeCorrect: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
  },
  badgeIncorrect: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  prompt: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#0F172A',
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
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  optionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  optionCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  optionIncorrect: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  optionDimmed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
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
    backgroundColor: '#E2E8F0',
  },
  letterBoxSelected: {
    backgroundColor: '#2563EB',
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
    color: '#1E293B',
  },
  letterTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  optionTextNormal: {
    color: '#1E293B',
  },
  optionTextCorrect: {
    color: '#059669',
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: '#DC2626',
  },
  explanationBox: {
    marginTop: 18,
    padding: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  explanationContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
});
