import { Colors } from '@/core/theme/colors';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { useThemeStore } from '@/core/theme/themeStore';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomDialog } from '@/shared/components/ui/CustomDialog';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { bookmarks, enrolledCourses, completedCourses, timeline } = useCourseStore();
  const { setTheme } = useThemeStore();
  const { colorScheme, setColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    type?: 'default' | 'destructive' | 'success';
  }>({ visible: false, title: '', message: '' });

  const handleThemeToggle = useCallback((isDark: boolean) => {
    const nextTheme = isDark ? 'dark' : 'light';
    setTheme(nextTheme);
    setColorScheme(nextTheme);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setTheme, setColorScheme]);

  const completionProgress =
    enrolledCourses.length === 0
      ? 0
      : Math.round((completedCourses.length / enrolledCourses.length) * 100);

  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const xpToNextLevel = level * 1000;
  const xpProgress = Math.min(100, (xp / xpToNextLevel) * 100);

  useEffect(() => {
    const loadBiometricPref = async () => {
      const val = await AsyncStorage.getItem('biometric_enabled');
      setIsBiometricEnabled(val === 'true');
    };
    loadBiometricPref();
  }, []);

  const handleBiometricToggle = useCallback(async (nextValue: boolean) => {
    if (nextValue) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setDialogConfig({
          visible: true,
          title: 'Biometrics Unavailable',
          message: 'Face ID / Touch ID is not set up on this device yet.',
          confirmText: 'Got it',
          type: 'default'
        });
        return;
      }
    }

    setIsBiometricEnabled(nextValue);
    await AsyncStorage.setItem('biometric_enabled', String(nextValue));
  }, []);

  const handleLogout = () => {
    setDialogConfig({
      visible: true,
      title: 'Sign Out',
      message: 'Are you sure you want to sign out? Your learning progress is saved!',
      confirmText: 'Sign Out',
      type: 'destructive',
      onConfirm: logout
    });
  };

  if (!user) return null;

  return (
    <View className="flex-1">
      <CustomDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        type={dialogConfig.type}
        onConfirm={() => {
          dialogConfig.onConfirm?.();
          setDialogConfig(prev => ({ ...prev, visible: false }));
        }}
        onCancel={() => setDialogConfig(prev => ({ ...prev, visible: false }))}
      />
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Header & Avatar */}
        <View className="items-center pb-8" style={{ paddingTop: insets.top + 24 }}>
          <View className="relative p-1 bg-white rounded-full shadow-lg">
            <Image
              source={user.avatar?.url || 'https://via.placeholder.com/150'}
              className="w-28 h-28 rounded-full border-4 border-white"
              contentFit="cover"
            />
          </View>
        <Text className="text-2xl font-extrabold text-text mt-4 tracking-tighter">{user.username}</Text>
        <View className="flex-row items-center bg-indigo-50 px-3 py-1 rounded-full mt-2">
          <Ionicons name="flash" size={14} color={Colors.primary} />
          <Text className="text-xs font-bold text-primary ml-1 uppercase tracking-widest">Level {level} Explorer</Text>
        </View>
      </View>

      {/* Level Progress */}
      <View className="px-5 mb-8">
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-border/40">
          <View className="flex-row justify-between items-end mb-3">
            <View>
                <Text className="text-sm font-bold text-text mb-1">Learning Rank</Text>
                <Text className="text-xs text-text-muted">Mastering multiple tech tracks</Text>
            </View>
            <Text className="text-sm font-black text-primary">{Math.floor(xp)} / {xpToNextLevel} XP</Text>
          </View>
          <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <View 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${xpProgress}%` }} 
            />
          </View>
          <Text className="text-[10px] font-bold text-text-muted uppercase text-center mt-3 tracking-widest">
            {xpToNextLevel - xp} XP TO LEVEL {level + 1}
          </Text>
        </View>
      </View>

      {/* Badges / Achievements */}
      <View className="px-5 mb-8">
        <Text className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 ml-1">Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {[
            { id: 'early-bird', icon: 'sunny', color: '#F59E0B', title: 'Early Bird' },
            { id: 'fast-learner', icon: 'rocket', color: '#8B5CF6', title: 'Fast Learner' },
            { id: 'quiz-master', icon: 'trophy', color: '#10B981', title: 'Quiz Master' },
            { id: 'streak-king', icon: 'flame', color: '#EF4444', title: 'Streak King' },
          ].map((badge) => (
            <View key={badge.id} className="items-center bg-white p-4 rounded-3xl border border-border/40 w-24">
              <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: `${badge.color}15` }}>
                <Ionicons name={badge.icon as any} size={24} color={badge.color} />
              </View>
              <Text className="text-[10px] font-bold text-text text-center">{badge.title}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Bento Stats */}
      <View className="flex-row px-5 space-x-3 mb-8">
        <View className="flex-1 bg-white rounded-3xl p-4 items-center shadow-sm border border-border/50">
          <View className="w-10 h-10 rounded-full bg-indigo-50 items-center justify-center mb-2">
            <Ionicons name="layers" size={20} color={Colors.primary} />
          </View>
          <Text className="text-xl font-bold text-text">{enrolledCourses.length}</Text>
          <Text className="text-[10px] font-bold text-text-muted uppercase mt-1">Courses</Text>
        </View>

        <View className="flex-1 bg-white rounded-3xl p-4 items-center shadow-sm border border-border/50">
          <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mb-2">
            <Ionicons name="heart" size={20} color="#FF9500" />
          </View>
          <Text className="text-xl font-bold text-text">{bookmarks.length}</Text>
          <Text className="text-[10px] font-bold text-text-muted uppercase mt-1">Saved</Text>
        </View>

        <View className="flex-1 bg-white rounded-3xl p-4 items-center shadow-sm border border-border/50">
          <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mb-2">
            <Ionicons name="checkmark-done" size={20} color="#16A34A" />
          </View>
          <Text className="text-xl font-bold text-text">{completionProgress}%</Text>
          <Text className="text-[10px] font-bold text-text-muted uppercase mt-1">Progress</Text>
        </View>
      </View>

      {/* Learning Journey Timeline */}
      <View className="px-5 mb-8">
        <Text className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 ml-1">Learning Journey</Text>
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-border/50">
          {(timeline.length > 0 ? timeline : [{ id: 'join-event', action: 'Joined Edurise LMS', type: 'join' as const, timestamp: Date.now() }]).map((item, index, arr) => (
            <View key={item.id || index} className="flex-row">
              <View className="items-center mr-4">
                <View className={`w-8 h-8 rounded-full items-center justify-center z-10 
                  ${item.type === 'complete' ? 'bg-emerald-100' : 
                    item.type === 'enroll' ? 'bg-blue-100' : 
                    item.type === 'quiz' ? 'bg-orange-100' : 
                    item.type === 'bookmark' ? 'bg-indigo-100' : 'bg-primary-lighter'}`}>
                  <Ionicons 
                    name={
                      item.type === 'complete' ? 'checkmark-circle' : 
                      item.type === 'enroll' ? 'book' : 
                      item.type === 'quiz' ? 'trophy' : 
                      item.type === 'bookmark' ? 'bookmark' : 'person-add'
                    } 
                    size={16} 
                    color={
                      item.type === 'complete' ? '#10B981' : 
                      item.type === 'enroll' ? '#3B82F6' : 
                      item.type === 'quiz' ? '#F59E0B' : 
                      item.type === 'bookmark' ? '#6366F1' : Colors.primary
                    } 
                  />
                </View>
                {index !== arr.length - 1 && (
                  <View className="w-0.5 flex-1 bg-border -my-1" />
                )}
              </View>
              <View className="flex-1 pb-6 pt-1">
                <Text className="text-sm font-bold text-text mb-1">{item.action}</Text>
                <Text className="text-xs text-text-muted">
                  {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Settings Group */}
      <View className="px-5">
        <Text className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 ml-1">Preferences</Text>
        <View className="bg-white rounded-3xl px-4 shadow-sm border border-border/50">
          <View className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
                <Ionicons name="moon" size={18} color="#555" />
              </View>
              <Text className="text-base font-semibold text-text">Dark Mode</Text>
            </View>
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={handleThemeToggle}
              trackColor={{ false: '#D1D1D6', true: Colors.primary }}
            />
          </View>

          <View className="h-[1px] bg-background" />

          <TouchableOpacity className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
                <Ionicons name="notifications" size={18} color="#555" />
              </View>
              <Text className="text-base font-semibold text-text">Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          <View className="h-[1px] bg-background" />

          <View className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
                <Ionicons name="lock-closed" size={18} color="#555" />
              </View>
              <Text className="text-base font-semibold text-text">Biometric Unlock</Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
            />
          </View>
        </View>
      </View>

      {/* Logout */}
      <View className="mt-10 px-5 pb-12 items-center">
        <TouchableOpacity
          className="w-full h-14 rounded-2xl bg-white border border-red-50 justify-center items-center"
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text className="text-error text-base font-bold">Sign Out</Text>
        </TouchableOpacity>
        <Text className="mt-4 text-text-muted text-[11px] font-medium opacity-50">App Version 2.1.0</Text>
      </View>
    </ScrollView>
  </View>
  );
}

