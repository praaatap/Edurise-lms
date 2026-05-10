import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { Brain, FileText, Sparkles } from 'lucide-react-native';
import { Button } from '@/shared/components/ui/Button';

export const AIGrader = () => {
  const { C, isDark } = useTheme();
  const [isGrading, setIsGrading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);

  // Mock submission data
  const submission = {
    studentName: 'Alex Rivera',
    assignment: 'Advanced State Management in React',
    content: "State management in React can be handled through multiple ways. Redux is a popular library, but Context API is built-in. For large apps, Redux is better because it provides middleware support and better debugging tools with Redux DevTools. However, for smaller apps, it adds too much boilerplate code. Modern apps use Zustand or React Query for specific needs like server state.",
  };

  const handleAutoGrade = () => {
    setIsGrading(true);
    // Simulate AI grading logic
    setTimeout(() => {
      setScore(92);
      setFeedback(
        "Great work, Alex! You clearly explained the trade-offs between Redux and Context API. Your mention of Zustand and React Query shows modern industry knowledge. \n\n**Suggestions for improvement:** \n- Add a brief example of how boilerplate is reduced in Zustand. \n- Mention the 'useReducer' hook for complex local state."
      );
      setIsGrading(false);
    }, 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FileText size={20} color={Colors.primary} />
          <Text style={[styles.title, { color: C.text }]}>AI Assignment Grader</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.primary + '15' }]}>
          <Sparkles size={12} color={Colors.primary} />
          <Text style={[styles.badgeText, { color: Colors.primary }]}>AI Enabled</Text>
        </View>
      </View>

      <View style={[styles.submissionBox, { backgroundColor: C.background, borderColor: C.border }]}>
        <View style={styles.studentHeader}>
          <Text style={[styles.studentName, { color: C.text }]}>{submission.studentName}</Text>
          <Text style={[styles.assignmentTitle, { color: C.textMuted }]}>{submission.assignment}</Text>
        </View>
        <ScrollView style={styles.submissionScroll}>
          <Text style={[styles.submissionText, { color: C.text }]}>{submission.content}</Text>
        </ScrollView>
      </View>

      {!feedback ? (
        <Button 
          title="Auto-Grade with AI" 
          onPress={handleAutoGrade}
          isLoading={isGrading}
          leftIcon={<Brain size={18} color="white" />}
          style={styles.gradeBtn}
        />
      ) : (
        <View style={[styles.feedbackSection, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
          <View style={styles.feedbackHeader}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreText}>{score}</Text>
              <Text style={styles.scoreTotal}>/100</Text>
            </View>
            <View style={styles.feedbackMeta}>
              <Text style={[styles.feedbackTitle, { color: C.text }]}>AI Analysis Complete</Text>
              <Text style={[styles.feedbackDate, { color: C.textMuted }]}>Graded instantly</Text>
            </View>
          </View>
          
          <Text style={[styles.feedbackBody, { color: C.text }]}>{feedback}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]}>
              <Text style={styles.actionBtnText}>Accept & Post Grade</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.border }]}
              onPress={() => setFeedback(null)}
            >
              <Text style={[styles.actionBtnText, { color: C.text }]}>Edit Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  submissionBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    height: 180,
    marginBottom: 16,
  },
  studentHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
  },
  assignmentTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  submissionScroll: {
    flex: 1,
  },
  submissionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  gradeBtn: {
    borderRadius: 16,
    height: 52,
  },
  feedbackSection: {
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
  },
  scoreTotal: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
  },
  feedbackMeta: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  feedbackDate: {
    fontSize: 12,
    marginTop: 2,
  },
  feedbackBody: {
    fontSize: 13,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },
});
