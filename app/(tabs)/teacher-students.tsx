import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useAdminStore } from '@/features/admin/store/adminStore';
import { useTheme } from '@/core/theme/useTheme';
import { User, Search, Award, BookOpen } from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';
import { Image } from 'expo-image';
import { Input } from '@/shared/components/ui/Input';

export default function TeacherStudents() {
  const { user: currentUser } = useAuthStore();
  const { students, refreshStudents, isLoading } = useAdminStore();
  const { C } = useTheme();

  useEffect(() => {
    if (currentUser?.schoolId) {
      refreshStudents(currentUser.schoolId);
    }
  }, [currentUser?.schoolId]);

  const renderStudent = ({ item }: { item: any }) => (
    <View style={[styles.studentCard, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={styles.studentInfo}>
        <View style={styles.avatarContainer}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.primary + '20' }]}>
              <User size={24} color={Colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.studentText}>
          <Text style={[styles.studentName, { color: C.text }]}>{item.username}</Text>
          <Text style={[styles.studentEmail, { color: C.textMuted }]} numberOfLines={1}>
            {item.email}
          </Text>
          
          <View style={styles.progressRow}>
            <View style={styles.statItem}>
              <BookOpen size={12} color={C.textMuted} />
              <Text style={[styles.statText, { color: C.textMuted }]}>{item.enrollmentsCount} Course{item.enrollmentsCount !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.statItem}>
              <Award size={12} color={Colors.primary} />
              <Text style={[styles.statText, { color: Colors.primary }]}>{item.role}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={[styles.viewBtn, { borderColor: C.border }]}>
        <Text style={[styles.viewBtnText, { color: Colors.primary }]}>View</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>Students 👨‍🎓</Text>
        <Text style={[styles.subtitle, { color: C.textMuted }]}>
          Monitor your students' learning progress
        </Text>
      </View>

      <View style={styles.searchBar}>
        <Input
          placeholder="Search students..."
          leftIcon={<Search size={18} color={C.textMuted} />}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={() => currentUser?.schoolId && refreshStudents(currentUser.schoolId)} 
            tintColor={Colors.primary} 
          />
        }
        ListHeaderComponent={
          <View style={styles.filterRow}>
            <Text style={[styles.filterTitle, { color: C.text }]}>All Students ({students.length})</Text>
            <TouchableOpacity>
              <Text style={{ color: Colors.primary, fontWeight: '600' }}>Filter</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <User size={64} color={C.border} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>
              No students enrolled in your courses yet
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  searchBar: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentText: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
  },
  studentEmail: {
    fontSize: 12,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
  },
  viewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
