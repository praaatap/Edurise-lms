import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSchoolStore } from '@/features/school/store/schoolStore';
import { useTheme } from '@/core/theme/useTheme';
import {
  Building2,
  CreditCard,
  Shield,
  Palette,
  ChevronRight,
  LogOut,
  Bell,
  Globe,
} from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';
import { useRouter } from 'expo-router';
import { apiClient } from '@/core/api/client';
import { schoolApi } from '@/features/school/api/schoolApi';

export default function AdminSettings() {
  const { logout, user } = useAuthStore();
  const { activeSchool, updateSchool } = useSchoolStore();
  const { C } = useTheme();
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  const handleNotificationsToggle = async (val: boolean) => {
    setNotifications(val);
    try {
      await apiClient.patch('/users/me', { notificationsEnabled: val });
    } catch {
      // non-critical — state already updated locally
    }
  };

  const handleSchoolInfo = () => {
    if (!activeSchool) return;
    Alert.prompt(
      'School Name',
      'Update your school name:',
      async (name) => {
        if (name && name.trim()) {
          try {
            await updateSchool(activeSchool.id, { name: name.trim() });
            Alert.alert('Updated', 'School name updated successfully.');
          } catch {
            Alert.alert('Error', 'Failed to update school name.');
          }
        }
      },
      'plain-text',
      activeSchool.name,
    );
  };

  const handlePublicUrl = () => {
    Alert.alert(
      'Public School URL',
      `Your school is accessible at:\nedurise.com/schools/${activeSchool?.slug || '—'}`,
      [{ text: 'OK' }],
    );
  };

  const handleBranding = () => {
    Alert.alert(
      'Branding & Themes',
      'Upload a logo and customize colors in the School Profile section.',
      [{ text: 'OK' }],
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy & Permissions',
      'Control teacher and student access by managing members in the Teachers and Students tabs.',
      [{ text: 'OK' }],
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login' as any);
        }
      },
    ]);
  };

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    toggle, 
    value, 
    onValueChange,
    danger = false 
  }: any) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: C.border }]} 
      onPress={onPress}
      disabled={!!toggle}
    >
      <View style={[styles.iconContainer, { backgroundColor: danger ? '#EF444415' : Colors.primary + '15' }]}>
        <Icon size={20} color={danger ? '#EF4444' : Colors.primary} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: danger ? '#EF4444' : C.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: C.textMuted }]}>{subtitle}</Text>}
      </View>
      {toggle ? (
        <Switch 
          value={value} 
          onValueChange={onValueChange} 
          trackColor={{ false: '#767577', true: Colors.primary }}
          thumbColor="#f4f3f4"
        />
      ) : (
        <ChevronRight size={20} color={C.border} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>Settings ⚙️</Text>
        <Text style={[styles.subtitle, { color: C.textMuted }]}>
          Manage your school's configuration
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>School Profile</Text>
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <SettingItem
            icon={Building2}
            title="School Information"
            subtitle={activeSchool?.name || 'Set up your school details'}
            onPress={handleSchoolInfo}
          />
          <SettingItem
            icon={Globe}
            title="Public URL"
            subtitle={`edurise.com/schools/${activeSchool?.slug || ''}`}
            onPress={handlePublicUrl}
          />
          <SettingItem
            icon={Palette}
            title="Branding & Themes"
            subtitle="Logo, colors, and cover images"
            onPress={handleBranding}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Institution</Text>
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <SettingItem 
            icon={CreditCard} 
            title="Subscription Plan" 
            subtitle={`${activeSchool?.plan?.toUpperCase() || 'FREE'} Plan`}
            onPress={() => router.push('/school/plans' as any)}
          />
          <SettingItem
            icon={Shield}
            title="Privacy & Permissions"
            subtitle="Manage teacher & student access"
            onPress={handlePrivacy}
          />
          <SettingItem 
            icon={Globe} 
            title="Visibility" 
            subtitle="Make school discoverable"
            toggle
            value={publicProfile}
            onValueChange={setPublicProfile}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Notifications</Text>
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <SettingItem
            icon={Bell}
            title="Push Notifications"
            subtitle="Alerts for new enrollments & payments"
            toggle
            value={notifications}
            onValueChange={handleNotificationsToggle}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <SettingItem 
            icon={LogOut} 
            title="Logout" 
            onPress={handleLogout}
            danger
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={{ color: C.textMuted }}>Version 1.0.0 (LMS-PRO)</Text>
      </View>
    </ScrollView>
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    padding: 40,
    alignItems: 'center',
    paddingBottom: 140,
  },
});
