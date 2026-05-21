import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAdminStore } from '@/features/admin/store/adminStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTheme } from '@/core/theme/useTheme';
import { Input } from '@/shared/components/ui/Input';
import { User, Mail, UserPlus, Trash2, GraduationCap } from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';
import { Image } from 'expo-image';

export default function AdminTeachers() {
  const { user: currentUser } = useAuthStore();
  const { 
    teachers, 
    isLoading, 
    refreshTeachers, 
    sendInvite, 
    kickTeacher,
    inviteEmail,
    setInviteEmail 
  } = useAdminStore();
  const { C } = useTheme();

  useEffect(() => {
    if (currentUser?.schoolId) {
      refreshTeachers(currentUser.schoolId);
    }
  }, [currentUser?.schoolId]);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    if (!currentUser?.schoolId) return;
    
    try {
      await sendInvite(currentUser.schoolId, inviteEmail);
      Alert.alert('Success', `Invitation sent to ${inviteEmail}`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send invite');
    }
  };

  const handleRemove = (teacherId: string, name: string) => {
    Alert.alert(
      'Remove Teacher',
      `Are you sure you want to remove ${name} from your school?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            if (currentUser?.schoolId) {
              kickTeacher(currentUser.schoolId, teacherId);
            }
          }
        }
      ]
    );
  };

  const renderTeacher = ({ item }: { item: any }) => (
    <View style={[styles.teacherCard, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={styles.teacherInfo}>
        <View style={styles.avatarContainer}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.primary + '20' }]}>
              <User size={24} color={Colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.teacherText}>
          <Text style={[styles.teacherName, { color: C.text }]}>{item.username}</Text>
          <Text style={[styles.teacherEmail, { color: C.textMuted }]}>{item.email}</Text>
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
        <Text style={[styles.title, { color: C.text }]}>Teachers 🎓</Text>
        <Text style={[styles.subtitle, { color: C.textMuted }]}>
          Manage your institution's faculty
        </Text>
      </View>

      <View style={[styles.inviteCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.inviteTitle, { color: C.text }]}>Invite Teacher</Text>
        <View style={styles.inviteRow}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="teacher@school.com"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={18} color={C.textMuted} />}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>
          <TouchableOpacity 
            style={[styles.inviteBtn, { backgroundColor: Colors.primary }]}
            onPress={handleInvite}
            disabled={isLoading || !inviteEmail}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <UserPlus size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={teachers}
        renderItem={renderTeacher}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={() => currentUser?.schoolId && refreshTeachers(currentUser.schoolId)}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <GraduationCap size={48} color={C.border} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>
              No teachers added yet
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
  inviteCard: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  teacherInfo: {
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
  teacherText: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '700',
  },
  teacherEmail: {
    fontSize: 13,
    marginTop: 2,
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
