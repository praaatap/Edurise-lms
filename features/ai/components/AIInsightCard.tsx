import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react-native';

interface AIInsightCardProps {
  title: string;
  insight: string;
  type: 'positive' | 'warning' | 'neutral';
}

export const AIInsightCard = ({ title, insight, type }: AIInsightCardProps) => {
  const { C } = useTheme();

  const getIcon = () => {
    switch (type) {
      case 'positive': return <TrendingUp size={20} color="#10B981" />;
      case 'warning': return <AlertCircle size={20} color="#F59E0B" />;
      default: return <Sparkles size={20} color={Colors.primary} />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'positive': return '#10B98110';
      case 'warning': return '#F59E0B10';
      default: return Colors.primary + '10';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: getBgColor() }]}>
        {getIcon()}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: C.text }]}>{title}</Text>
        <Text style={[styles.insight, { color: C.textMuted }]}>{insight}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  insight: {
    fontSize: 13,
    lineHeight: 18,
  },
});
