import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { Tabs } from 'expo-router';
import {
  Heart, LayoutGrid, House, User,
  GraduationCap, BookOpen, PlusCircle, Users, BarChart3, Settings, Trophy
} from 'lucide-react-native';
import { Platform, View } from 'react-native';
import { Image } from 'expo-image';
import { useAuthStore } from '@/features/auth/store/authStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FloatingAIBtn } from '@/shared/components/ui/FloatingAIBtn';
import { NetworkStatus } from '@/shared/components/ui/NetworkStatus';
import { User as UserType } from '@/shared/types';

const TAB_BAR_STYLE = (C: ReturnType<typeof useTheme>['C'], isDark: boolean) => ({
  backgroundColor: C.surface,
  position: 'absolute' as const,
  bottom: 0,
  left: 0,
  right: 0,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  borderTopWidth: isDark ? 1 : 0,
  borderTopColor: isDark ? C.border : 'transparent',
  height: Platform.OS === 'ios' ? 120 : 100,
  paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  paddingTop: 8,
  elevation: isDark ? 0 : 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: isDark ? 0 : 0.08,
  shadowRadius: 16,
});

const SCREEN_OPTIONS = (C: ReturnType<typeof useTheme>['C'], isDark: boolean) => ({
  tabBarActiveTintColor: Colors.primary,
  tabBarInactiveTintColor: isDark ? '#6B7280' : Colors.textMuted,
  headerShown: false,
  tabBarStyle: TAB_BAR_STYLE(C, isDark),
  tabBarLabelStyle: {
    fontSize: 10,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
});

// ─── Student Tabs ─────────────────────────────────────────────────────────────
function StudentTabs({ C, isDark, user, localAvatar, bookmarkCount }: {
  C: ReturnType<typeof useTheme>['C'];
  isDark: boolean;
  user: UserType | null;
  localAvatar: string | null;
  bookmarkCount: number;
}) {
  return (
    <Tabs screenOptions={SCREEN_OPTIONS(C, isDark)}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => <House size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Schools',
          tabBarLabel: 'Schools',
          tabBarIcon: ({ color, focused }) => <GraduationCap size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'Saved',
          tabBarLabel: 'Saved',
          tabBarBadge: bookmarkCount > 0 ? bookmarkCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.primary,
            color: 'white',
            fontSize: 10,
            lineHeight: 14,
            minWidth: 16,
            marginTop: 4,
          },
          tabBarIcon: ({ color, focused }) => <Heart size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Achievements',
          tabBarLabel: 'Achievements',
          tabBarIcon: ({ color, focused }) => <Trophy size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => {
            const avatarUrl = localAvatar || (typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url);
            if (avatarUrl && avatarUrl.trim() !== '') {
              return (
                <View
                  style={{
                    borderRadius: 13,
                    overflow: 'hidden',
                    borderWidth: 2,
                    borderColor: focused ? Colors.primary : 'transparent',
                    width: 26,
                    height: 26,
                  }}
                >
                  <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                </View>
              );
            }
            return <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />;
          },
        }}
      />
      {/* Hide admin/teacher tabs from student */}
      <Tabs.Screen name="teacher-dashboard" options={{ href: null }} />
      <Tabs.Screen name="teacher-courses" options={{ href: null }} />
      <Tabs.Screen name="teacher-create" options={{ href: null }} />
      <Tabs.Screen name="teacher-students" options={{ href: null }} />
      <Tabs.Screen name="admin-dashboard" options={{ href: null }} />
      <Tabs.Screen name="admin-teachers" options={{ href: null }} />
      <Tabs.Screen name="admin-students" options={{ href: null }} />
      <Tabs.Screen name="admin-analytics" options={{ href: null }} />
      <Tabs.Screen name="admin-settings" options={{ href: null }} />
    </Tabs>
  );
}

// ─── Teacher Tabs ─────────────────────────────────────────────────────────────
function TeacherTabs({ C, isDark, user, localAvatar }: {
  C: ReturnType<typeof useTheme>['C'];
  isDark: boolean;
  user: UserType | null;
  localAvatar: string | null;
}) {
  return (
    <Tabs screenOptions={SCREEN_OPTIONS(C, isDark)}>
      <Tabs.Screen
        name="teacher-dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <BarChart3 size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="teacher-courses"
        options={{
          title: 'My Courses',
          tabBarLabel: 'Courses',
          tabBarIcon: ({ color, focused }) => <BookOpen size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="teacher-create"
        options={{
          title: 'Create',
          tabBarLabel: 'Create',
          tabBarIcon: ({ color, focused }) => <PlusCircle size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="teacher-students"
        options={{
          title: 'Students',
          tabBarLabel: 'Students',
          tabBarIcon: ({ color, focused }) => <Users size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => {
            const avatarUrl = localAvatar || (typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url);
            if (avatarUrl && avatarUrl.trim() !== '') {
              return (
                <View style={{ borderRadius: 13, overflow: 'hidden', borderWidth: 2, borderColor: focused ? Colors.primary : 'transparent', width: 26, height: 26 }}>
                  <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                </View>
              );
            }
            return <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />;
          },
        }}
      />
      {/* Hide non-teacher tabs */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="bookmarks" options={{ href: null }} />
      <Tabs.Screen name="admin-dashboard" options={{ href: null }} />
      <Tabs.Screen name="admin-teachers" options={{ href: null }} />
      <Tabs.Screen name="admin-students" options={{ href: null }} />
      <Tabs.Screen name="admin-analytics" options={{ href: null }} />
      <Tabs.Screen name="admin-settings" options={{ href: null }} />
    </Tabs>
  );
}

// ─── Admin Tabs ───────────────────────────────────────────────────────────────
function AdminTabs({ C, isDark }: { C: ReturnType<typeof useTheme>['C']; isDark: boolean }) {
  return (
    <Tabs screenOptions={SCREEN_OPTIONS(C, isDark)}>
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <BarChart3 size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="admin-teachers"
        options={{
          title: 'Teachers',
          tabBarLabel: 'Teachers',
          tabBarIcon: ({ color, focused }) => <GraduationCap size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="admin-students"
        options={{
          title: 'Students',
          tabBarLabel: 'Students',
          tabBarIcon: ({ color, focused }) => <Users size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="admin-analytics"
        options={{
          title: 'Analytics',
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, focused }) => <LayoutGrid size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="admin-settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => <Settings size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      {/* Hide non-admin tabs */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="bookmarks" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="teacher-dashboard" options={{ href: null }} />
      <Tabs.Screen name="teacher-courses" options={{ href: null }} />
      <Tabs.Screen name="teacher-create" options={{ href: null }} />
      <Tabs.Screen name="teacher-students" options={{ href: null }} />
    </Tabs>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function TabLayout() {
  const { user, localAvatar } = useAuthStore();
  const bookmarks = useCourseStore((s) => s.bookmarks);
  const bookmarkCount = bookmarks.length;
  const { C, isDark } = useTheme();

  const role = user?.role ?? 'student';

  const tabContent = () => {
    if (role === 'admin') {
      return <AdminTabs C={C} isDark={isDark} />;
    }
    if (role === 'teacher') {
      return <TeacherTabs C={C} isDark={isDark} user={user} localAvatar={localAvatar} />;
    }
    return (
      <StudentTabs
        C={C}
        isDark={isDark}
        user={user}
        localAvatar={localAvatar}
        bookmarkCount={bookmarkCount}
      />
    );
  };

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <NetworkStatus />
        {tabContent()}
        {role === 'student' && <FloatingAIBtn />}
      </View>
    </SafeAreaProvider>
  );
}