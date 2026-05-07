import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useAdminStore } from '@/features/admin/store/adminStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTheme } from '@/core/theme/useTheme';
import { User, Users, Trash2, Search } from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';
import { Image } from 'expo-image';
import { Input } from '@/shared/components/ui/Input';

export default function AdminStudents() {
  const { user: currentUser } = useAuthStore();
  const { 
    students, 
    isLoading, 
    refreshStudents, 
    kickStudent 
  } = useAdminStore();
  const { C } = useTheme();

  useEffect(() => {
    if (currentUser?.schoolId) {
      refreshStudents(currentUser.schoolId);
    }
  }, [currentUser?.schoolId]);

  const handleRemove = (studentId: string, name: string) => {
    Alert.alert(
      'Remove Student',
      `Are you sure you want to remove ${name} from your school?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            if (currentUser?.schoolId) {
              kickStudent(currentUser.schoolId, studentId);
            }
          }
        }
      ]
    );
  };

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
          <Text style={[styles.studentEmail, { color: C.textMuted }]}>{item.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: Colors.primary + '15' }]}>
            <Text style={[styles.roleText, { color: Colors.primary }]}>Student</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity 
        onPress={() => handleRemove(item.id, item.username)}
        style={styles.removeBtn}
      >
        <Trash2 size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>Students 🎒</Text>
        <Text style={[styles.subtitle, { color: C.textMuted }]}>
          Manage your enrolled student community
        </Text>
      </View>

      <View style={styles.searchBar}>
        <Input
          placeholder="Search students by name or email..."
          leftIcon={<Search size={18} color={C.textMuted} />}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={() => currentUser?.schoolId && refreshStudents(currentUser.schoolId)}
        ListHeaderComponent={
          <View style={styles.statsRow}>
            <Text style={[styles.countText, { color: C.text }]}>
              {students.length} Total Students
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={48} color={C.border} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>
              No students enrolled yet
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
    paddingBottom: 100,
  },
  statsRow: {
    marginBottom: 16,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
  },
  studentEmail: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  removeBtn: {
    padding: 8,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
