import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MathMarkdownProps {
  content: string;
}

/**
 * Format mathematical symbols and LaTeX expressions into readable formatted strings
 */
function cleanLatex(latex: string): string {
  return latex
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\eta/g, 'η')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\theta/g, 'θ')
    .replace(/\\pi/g, 'π')
    .replace(/\\infty/g, '∞')
    .replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\approx/g, '≈')
    .replace(/\\implies/g, '⟹')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\ln\\left\(([^)]+)\\right\)/g, 'ln($1)')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\quad/g, '  ')
    .replace(/\\circ/g, '°')
    .replace(/\\_/g, '_')
    .replace(/\\/g, '');
}

/**
 * Formats inline text with bold (**text**), code (`text`), and inline math ($math$)
 */
function formatInline(text: string) {
  // Regex to split by $...$, **...**, or `...`
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = cleanLatex(part.slice(2, -2).trim());
      return (
        <View key={index} style={styles.displayMathBox}>
          <Text style={styles.displayMathText}>{math}</Text>
        </View>
      );
    }

    if (part.startsWith('$') && part.endsWith('$')) {
      const math = cleanLatex(part.slice(1, -1).trim());
      return (
        <Text key={index} style={styles.inlineMathText}>
          {math}
        </Text>
      );
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={index} style={styles.boldText}>
          {part.slice(2, -2)}
        </Text>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <Text key={index} style={styles.codeSnippet}>
          {part.slice(1, -1)}
        </Text>
      );
    }

    return (
      <Text key={index} style={styles.bodyText}>
        {part}
      </Text>
    );
  });
}

export const MathMarkdown: React.FC<MathMarkdownProps> = ({ content }) => {
  if (!content) return null;

  // Split lines into blocks
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inDisplayMath = false;
  let mathBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle multiline display math ($$ ... $$)
    if (line.trim().startsWith('$$') && !line.trim().endsWith('$$', 3)) {
      inDisplayMath = true;
      mathBuffer = [line.trim().slice(2)];
      continue;
    }
    if (inDisplayMath) {
      if (line.trim().endsWith('$$')) {
        inDisplayMath = false;
        mathBuffer.push(line.trim().slice(0, -2));
        elements.push(
          <View key={`math-${i}`} style={styles.displayMathBox}>
            <Text style={styles.displayMathText}>
              {cleanLatex(mathBuffer.join('\n').trim())}
            </Text>
          </View>
        );
        mathBuffer = [];
      } else {
        mathBuffer.push(line);
      }
      continue;
    }

    // Single line display math $$...$$
    if (line.trim().startsWith('$$') && line.trim().endsWith('$$')) {
      const math = cleanLatex(line.trim().slice(2, -2).trim());
      elements.push(
        <View key={`math-single-${i}`} style={styles.displayMathBox}>
          <Text style={styles.displayMathText}>{math}</Text>
        </View>
      );
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <Text key={`h1-${i}`} style={styles.h1}>
          {line.replace('# ', '')}
        </Text>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <Text key={`h2-${i}`} style={styles.h2}>
          {line.replace('## ', '')}
        </Text>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <Text key={`h3-${i}`} style={styles.h3}>
          {line.replace('### ', '')}
        </Text>
      );
      continue;
    }

    // High-yield blockquote (> ...)
    if (line.startsWith('> ')) {
      elements.push(
        <View key={`quote-${i}`} style={styles.quoteBox}>
          <Text style={styles.quoteText}>{formatInline(line.replace('> ', ''))}</Text>
        </View>
      );
      continue;
    }

    // Bullet points (* or -)
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const cleanLine = line.trim().substring(2);
      elements.push(
        <View key={`bullet-${i}`} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletContent}>{formatInline(cleanLine)}</Text>
        </View>
      );
      continue;
    }

    // Numbered list (1. 2. etc)
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <View key={`num-${i}`} style={styles.bulletRow}>
          <Text style={styles.numDot}>{numMatch[1]}.</Text>
          <Text style={styles.bulletContent}>{formatInline(numMatch[2])}</Text>
        </View>
      );
      continue;
    }

    // Empty line / paragraph break
    if (line.trim() === '') {
      elements.push(<View key={`spacer-${i}`} style={styles.paragraphSpacer} />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <Text key={`p-${i}`} style={styles.paragraph}>
        {formatInline(line)}
      </Text>
    );
  }

  return <View style={styles.container}>{elements}</View>;
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    marginVertical: 12,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    color: '#38BDF8',
    marginTop: 16,
    marginBottom: 8,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F1F5F9',
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    marginVertical: 4,
    lineHeight: 24,
  },
  paragraphSpacer: {
    height: 10,
  },
  bodyText: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 24,
  },
  boldText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inlineMathText: {
    fontSize: 15,
    fontFamily: 'Courier',
    fontWeight: '600',
    color: '#F59E0B',
    backgroundColor: '#1E293B',
    paddingHorizontal: 4,
  },
  displayMathBox: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 12,
    alignItems: 'center',
  },
  displayMathText: {
    fontSize: 17,
    fontFamily: 'Courier',
    fontWeight: '600',
    color: '#38BDF8',
    letterSpacing: 0.5,
    lineHeight: 26,
    textAlign: 'center',
  },
  codeSnippet: {
    fontFamily: 'Courier',
    fontSize: 13,
    backgroundColor: '#1E293B',
    color: '#E2E8F0',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  quoteBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 10,
  },
  quoteText: {
    fontSize: 14,
    color: '#FDE68A',
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    marginVertical: 3,
    paddingRight: 16,
  },
  bulletDot: {
    color: '#38BDF8',
    fontSize: 16,
    marginRight: 8,
    lineHeight: 22,
  },
  numDot: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
    lineHeight: 22,
  },
  bulletContent: {
    flex: 1,
    lineHeight: 22,
  },
});
