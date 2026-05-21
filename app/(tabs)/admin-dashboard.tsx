import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useAdminStore } from '@/features/admin/store/adminStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { StatCard } from '@/features/admin/components/StatCard';
import { SchoolHeader } from '@/features/school/components/SchoolHeader';
import { useSchoolStore } from '@/features/school/store/schoolStore';
import { useTheme } from '@/core/theme/useTheme';
import { Users, GraduationCap, BookOpen, DollarSign, Activity } from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';
import { AIInsightCard } from '@/features/ai/components/AIInsightCard';
import { Sparkles } from 'lucide-react-native';
import { BrandingSettings } from '@/features/admin/components/BrandingSettings';
import { ChurnPredictor } from '@/features/admin/components/ChurnPredictor';
import { CampusSwitcher } from '@/features/admin/components/CampusSwitcher';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { activeSchool } = useSchoolStore();
  const { analytics, loadDashboard, isLoading } = useAdminStore();
  const { C } = useTheme();

  useEffect(() => {
    if (user?.schoolId) {
      loadDashboard(user.schoolId);
    }
  }, [user?.schoolId]);

  const onRefresh = () => {
    if (user?.schoolId) {
      loadDashboard(user.schoolId);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {activeSchool && <SchoolHeader school={activeSchool} showSettingsButton />}
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.header}>
          <CampusSwitcher />
          <Text style={[styles.greeting, { color: C.text }]}>School Overview</Text>
          <Text style={[styles.subtitle, { color: C.textMuted }]}>Manage your institution's growth</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.row}>
            <StatCard 
              title="Total Students" 
              value={analytics?.totalStudents ?? 0} 
              icon={Users} 
              iconColor="#3B82F6"
            />
            <StatCard 
              title="Total Teachers" 
              value={analytics?.totalTeachers ?? 0} 
              icon={GraduationCap} 
              iconColor="#8B5CF6"
            />
          </View>
          
          <View style={styles.row}>
            <StatCard 
              title="Total Courses" 
              value={analytics?.totalCourses ?? 0} 
              icon={BookOpen} 
              iconColor="#F59E0B"
            />
            <StatCard 
              title="Monthly Revenue" 
              value={`$${analytics?.monthlyRevenue ?? 0}`} 
              icon={DollarSign} 
              iconColor="#10B981"
            />
          </View>

          <View style={styles.row}>
            <StatCard 
              title="Completion Rate" 
              value={`${analytics?.completionRate ?? 0}%`} 
              icon={Activity} 
              iconColor="#EC4899"
              trend={{ value: 5, isPositive: true }}
            />
            <StatCard 
              title="Active Now" 
              value={analytics?.activeEnrollments ?? 0} 
              icon={Users} 
              iconColor="#6366F1"
            />
          </View>
        </View>

        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <Sparkles size={18} color={Colors.primary} />
            <Text style={[styles.sectionTitle, { color: C.text, marginBottom: 0 }]}>School Intelligence</Text>
          </View>
          <AIInsightCard 
            title="Revenue Forecast" 
            insight="Based on current enrollment trends, revenue is projected to grow by 18% next month."
            type="positive"
          />
          <AIInsightCard 
            title="Course Health" 
            insight="3 courses have completion rates below 40%. AI recommends reviewing lesson difficulty levels."
            type="neutral"
          />
          <ChurnPredictor />
        </View>
        
        <BrandingSettings />

        {/* Recent Activity or Chart Placeholder */}
        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Recent Performance</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={{ color: C.textMuted }}>Analytics chart will appear here</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  statsGrid: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  aiSection: {
    marginTop: 24,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  section: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
    borderRadius: 12,
  }
});
