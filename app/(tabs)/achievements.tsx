import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '@/core/theme/useTheme';
import { Trophy, Zap, Flame, Target } from 'lucide-react-native';
import { CertificateCard } from '@/shared/components/CertificateCard';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSchoolStore } from '@/features/school/store/schoolStore';
import { useAchievementsStore } from '@/features/progress/store/achievementsStore';

const BADGE_MAP: Record<string, any> = {
  'FAST_LEARNER': { title: 'Fast Learner', icon: Zap, color: '#F59E0B', desc: 'Completed 5 lessons in one day' },
  'PERFECT_QUIZ': { title: 'Perfect Quiz', icon: Target, color: '#10B981', desc: 'Scored 100% on a final quiz' },
  'STREAK_7': { title: '7 Day Streak', icon: Flame, color: '#EF4444', desc: 'Active for 7 consecutive days' },
  'COURSE_MASTER': { title: 'Course Master', icon: Trophy, color: '#8B5CF6', desc: 'Successfully completed first course' },
};

export default function AchievementsScreen() {
  const { C } = useTheme();
  const { user } = useAuthStore();
  const { activeSchool } = useSchoolStore();
  const { badges, certificates, isLoading, fetchAchievements } = useAchievementsStore();

  useEffect(() => {
    fetchAchievements();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>My Achievements</Text>
        <Text style={[styles.subtitle, { color: C.textMuted }]}>Track your learning milestones</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading && <ActivityIndicator size="large" color={C.primary} style={{ marginVertical: 20 }} />}

        {/* Badges Section */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>Badges Earned</Text>
        <View style={styles.badgeGrid}>
          {badges.length === 0 && !isLoading && (
            <Text style={{ color: C.textMuted, fontSize: 14 }}>No badges earned yet. Keep learning!</Text>
          )}
          {badges.map((badge) => {
            const badgeInfo = BADGE_MAP[badge.type] || { title: badge.type, icon: Trophy, color: '#64748B', desc: 'Special achievement' };
            return (
              <View key={badge.id} style={[styles.badgeCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={[styles.badgeIcon, { backgroundColor: badgeInfo.color + '15' }]}>
                  <badgeInfo.icon size={24} color={badgeInfo.color} />
                </View>
                <Text style={[styles.badgeTitle, { color: C.text }]}>{badgeInfo.title}</Text>
                <Text style={[styles.badgeDesc, { color: C.textMuted }]}>{badgeInfo.desc}</Text>
              </View>
            );
          })}
        </View>

        {/* Certificates Section */}
        <Text style={[styles.sectionTitle, { color: C.text, marginTop: 32 }]}>Certificates</Text>
        {certificates.length === 0 && !isLoading && (
            <Text style={{ color: C.textMuted, fontSize: 14, marginBottom: 20 }}>Complete a course to earn your first certificate!</Text>
        )}
        {certificates.map((cert) => (
          <CertificateCard 
            key={cert.id}
            courseTitle={cert.course.title}
            studentName={user?.firstName ? `${user.firstName} ${user.lastName}` : (user?.username || 'Student')}
            issueDate={new Date(cert.issueDate).toLocaleDateString()}
            schoolName={activeSchool?.name || 'Edurise Academy'}
          />
        ))}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
