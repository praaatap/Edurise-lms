import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { School } from '@/shared/types';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { BookOpen, Users, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface SchoolCardProps {
  school: School;
  onPress?: () => void;
}

export const SchoolCard = React.memo(function SchoolCard({ school, onPress }: SchoolCardProps) {
  const { C, isDark } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/schools/${school.slug}` as any);
    }
  };

  const planBadgeColor =
    school.plan === 'enterprise' ? '#8B5CF6' :
    school.plan === 'pro' ? Colors.primary :
    Colors.textMuted;

  const planLabel =
    school.plan === 'enterprise' ? 'Enterprise' :
    school.plan === 'pro' ? 'Pro' : 'Free';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {/* Cover / Logo area */}
      <View style={[styles.coverArea, { backgroundColor: isDark ? '#1A2332' : '#EFF6FF' }]}>
        {school.logo ? (
          <Image source={{ uri: school.logo }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: Colors.primary + '22' }]}>
            <Text style={[styles.logoInitial, { color: Colors.primary }]}>
              {school.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {/* Plan badge */}
        <View style={[styles.planBadge, { backgroundColor: planBadgeColor + '20', borderColor: planBadgeColor }]}>
          <Text style={[styles.planText, { color: planBadgeColor }]}>{planLabel}</Text>
        </View>
        {school.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
          {school.name}
        </Text>
        {school.description ? (
          <Text style={[styles.description, { color: C.textMuted }]} numberOfLines={2}>
            {school.description}
          </Text>
        ) : null}

        {/* Stats row */}
        <View style={styles.stats}>
          {school.courseCount !== undefined && (
            <View style={styles.stat}>
              <BookOpen size={13} color={C.textMuted} />
              <Text style={[styles.statText, { color: C.textMuted }]}>
                {school.courseCount} courses
              </Text>
            </View>
          )}
          {school.studentCount !== undefined && (
            <View style={styles.stat}>
              <Users size={13} color={C.textMuted} />
              <Text style={[styles.statText, { color: C.textMuted }]}>
                {school.studentCount.toLocaleString()} students
              </Text>
            </View>
          )}
          {school.rating !== undefined && (
            <View style={styles.stat}>
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <Text style={[styles.statText, { color: C.textMuted }]}>
                {school.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {school.category && (
          <View style={[styles.categoryChip, { backgroundColor: Colors.primary + '15' }]}>
            <Text style={[styles.categoryText, { color: Colors.primary }]}>{school.category}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  coverArea: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitial: {
    fontSize: 28,
    fontWeight: '800',
  },
  planBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planText: {
    fontSize: 10,
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.primary + '20',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  info: {
    padding: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  stats: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
