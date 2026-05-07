import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { User, MessageSquare, ChevronRight, TrendingDown } from 'lucide-react-native';

interface AtRiskStudent {
  id: string;
  name: string;
  riskScore: number;
  reason: string;
  lastActive: string;
}

export const ChurnPredictor = () => {
  const { C, isDark } = useTheme();

  const atRiskStudents: AtRiskStudent[] = [
    { id: '1', name: 'John Doe', riskScore: 85, reason: 'Inactive for 5 days & failed Quiz #2', lastActive: '5 days ago' },
    { id: '2', name: 'Sarah Smith', riskScore: 72, reason: 'Consistent low engagement in video lessons', lastActive: '2 days ago' },
    { id: '3', name: 'Mike Johnson', riskScore: 64, reason: 'Incomplete assignments in Advanced React', lastActive: '3 days ago' },
  ];

  const getRiskColor = (score: number) => {
    if (score > 80) return '#EF4444'; // High risk
    if (score > 60) return '#F59E0B'; // Medium risk
    return '#10B981'; // Low risk
  };

  return (
    <View style={[styles.container, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TrendingDown size={20} color={isDark ? '#EF4444' : '#B91C1C'} />
          <Text style={[styles.title, { color: C.text }]}>Predictive Churn Detection</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: '#EF444420' }]}>
          <Text style={styles.badgeText}>3 High Risk</Text>
        </View>
      </View>

      <Text style={[styles.subtitle, { color: C.textMuted }]}>
        AI identified these students as likely to drop out based on recent behavior.
      </Text>

      <FlatList
        data={atRiskStudents}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.studentItem, { borderBottomColor: C.border }]}>
            <View style={styles.studentInfo}>
              <View style={[styles.avatar, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                <User size={16} color={C.textMuted} />
              </View>
              <View style={styles.details}>
                <Text style={[styles.studentName, { color: C.text }]}>{item.name}</Text>
                <Text style={[styles.reason, { color: C.textMuted }]} numberOfLines={1}>
                  {item.reason}
                </Text>
              </View>
            </View>
            
            <View style={styles.riskBadgeContainer}>
              <View style={[styles.riskLevel, { backgroundColor: getRiskColor(item.riskScore) + '20' }]}>
                <Text style={[styles.riskText, { color: getRiskColor(item.riskScore) }]}>
                  {item.riskScore}% Risk
                </Text>
              </View>
              <ChevronRight size={16} color={C.textMuted} />
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary + '15' }]}>
          <MessageSquare size={16} color={Colors.primary} />
          <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Reach Out to All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.background, borderColor: C.border, borderWidth: 1 }]}>
          <Text style={[styles.actionBtnText, { color: C.text }]}>View Full Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
  },
  reason: {
    fontSize: 12,
    marginTop: 2,
  },
  riskBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskLevel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
