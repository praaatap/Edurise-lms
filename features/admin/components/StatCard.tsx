import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/core/theme/useTheme';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; isPositive: boolean };
  onPress?: () => void;
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColor = '#22C55E', iconBg, trend, onPress }: StatCardProps) {
  const { C } = useTheme();
  const bg = iconBg ?? iconColor + '18';

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: bg }]}>
          <Icon size={20} color={iconColor} />
        </View>
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: trend.isPositive ? '#22C55E18' : '#EF444418' }]}>
            <Text style={[styles.trendText, { color: trend.isPositive ? '#22C55E' : '#EF4444' }]}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.value, { color: C.text }]}>{value}</Text>
      <Text style={[styles.title, { color: C.textMuted }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: C.textFaint ?? C.textMuted }]}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
});
