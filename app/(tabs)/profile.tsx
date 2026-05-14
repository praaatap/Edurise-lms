import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { useThemeStore } from '@/core/theme/themeStore';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CustomDialog } from '@/shared/components/ui/CustomDialog';
import { analytics } from '@/core/services/analyticsService';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';
import { UnsplashPicker } from '@/shared/components/ui/UnsplashPicker';

import { ProfileHeader } from '@/features/auth/components/Profile/ProfileHeader';
import { ProfileStats } from '@/features/auth/components/Profile/ProfileStats';
import { LevelProgress } from '@/features/auth/components/Profile/LevelProgress';
import { ProfileTimeline } from '@/features/auth/components/Profile/ProfileTimeline';

const BADGES = [
  { id: 'early-bird',   icon: 'sunny' as const,   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  title: 'Early Bird'   },
  { id: 'fast-learner', icon: 'rocket' as const,  color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', title: 'Fast Learner' },
  { id: 'quiz-master',  icon: 'trophy' as const,  color: '#10B981', bg: 'rgba(16,185,129,0.12)', title: 'Quiz Master'  },
  { id: 'streak-king',  icon: 'flame' as const,   color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  title: 'Streak King'  },
];

export default function ProfileScreen() {
  const { user, logout, updateProfile, localAvatar: globalLocalAvatar, setLocalAvatar: setGlobalLocalAvatar } = useAuthStore();
  const { bookmarks, enrolledCourses, completedCourses, timeline } = useCourseStore();
  const { setTheme } = useThemeStore();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean; title: string; message: string;
    onConfirm?: () => void; confirmText?: string;
    type?: 'default' | 'destructive' | 'success';
  }>({ visible: false, title: '', message: '' });
  const [isUnsplashVisible, setIsUnsplashVisible] = useState(false);

  const completionProgress =
    enrolledCourses.length === 0 ? 0
      : Math.round((completedCourses.length / enrolledCourses.length) * 100);

  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const xpToNextLevel = level * 1000;
  const xpProgress = Math.min(100, (xp / xpToNextLevel) * 100);

  useScreenTracking('Profile');

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    AsyncStorage.getItem('biometric_enabled').then(val => {
      if (mountedRef.current) setIsBiometricEnabled(val === 'true');
    });
    return () => { mountedRef.current = false; };
  }, []);

  const handleThemeToggle = useCallback((isDarkToggle: boolean) => {
    const nextTheme = isDarkToggle ? 'dark' : 'light';
    setTheme(nextTheme);
    setColorScheme(nextTheme);
    analytics.logEvent('theme_changed', { theme: nextTheme });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setTheme, setColorScheme]);

  const handleBiometricToggle = useCallback(async (nextValue: boolean) => {
    if (nextValue) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        setDialogConfig({ visible: true, title: 'Biometrics Unavailable', message: 'Face ID / Touch ID is not set up on this device yet.', confirmText: 'Got it', type: 'default' });
        return;
      }
    }
    setIsBiometricEnabled(nextValue);
    await AsyncStorage.setItem('biometric_enabled', String(nextValue));
    analytics.logEvent('biometric_toggled', { enabled: nextValue });
  }, []);

  const handleLogout = () => {
    setDialogConfig({
      visible: true, title: 'Sign Out',
      message: 'Are you sure you want to sign out? Your learning progress is saved!',
      confirmText: 'Sign Out', type: 'destructive', onConfirm: () => {
        analytics.logEvent('profile_logout');
        logout();
      },
    });
  };

  const pickProfileImage = useCallback(async () => {
    try {
      const { status: currentStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (currentStatus === 'denied') {
        setDialogConfig({ visible: true, title: 'Permission Required', message: 'Photo library access was denied. Please go to Settings and allow access for Edurise LMS.', confirmText: 'OK', type: 'default' });
        return;
      }
      if (currentStatus !== 'granted') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setDialogConfig({ visible: true, title: 'Permission Required', message: 'Please allow access to your photo library to update your profile picture.', confirmText: 'OK', type: 'default' });
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        setGlobalLocalAvatar(uri);
        updateProfile({ avatar: { url: uri, localPath: uri } });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setDialogConfig({ visible: true, title: 'Error', message: 'Could not open photo library. Please try again.', confirmText: 'OK', type: 'default' });
    }
  }, [setGlobalLocalAvatar, updateProfile]);

  const handleUnsplashSelect = useCallback((url: string) => {
    setGlobalLocalAvatar(url);
    updateProfile({ avatar: { url, localPath: url } });
    setIsUnsplashVisible(false);
    analytics.logEvent('profile_image_updated', { source: 'unsplash' });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [updateProfile, setGlobalLocalAvatar]);

  const showImagePickerOptions = useCallback(() => setIsUnsplashVisible(true), []);

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <CustomDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        type={dialogConfig.type}
        onConfirm={() => { dialogConfig.onConfirm?.(); setDialogConfig(prev => ({ ...prev, visible: false })); }}
        onCancel={() => setDialogConfig(prev => ({ ...prev, visible: false }))}
      />
      <UnsplashPicker
        visible={isUnsplashVisible}
        onClose={() => setIsUnsplashVisible(false)}
        onSelect={handleUnsplashSelect}
        onPickFromGallery={() => {
          setIsUnsplashVisible(false);
          // Delay ensures modal is fully dismissed before iOS shows another native controller.
          const t = setTimeout(() => { if (mountedRef.current) pickProfileImage(); }, 500);
          return () => clearTimeout(t);
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <ProfileHeader
          insets={insets}
          user={user}
          localAvatar={globalLocalAvatar}
          level={level}
          onPickImage={showImagePickerOptions}
        />

        <LevelProgress level={level} xp={xp} xpToNextLevel={xpToNextLevel} xpProgress={xpProgress} />

        <ProfileStats enrolledCount={enrolledCourses.length} bookmarksCount={bookmarks.length} progress={completionProgress} />

        {/* Achievements */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
            Achievements
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {BADGES.map(badge => (
              <View
                key={badge.id}
                style={{
                  alignItems: 'center', padding: 16, borderRadius: 20,
                  backgroundColor: isDark ? Colors.dark.surface : '#fff',
                  borderWidth: 1, borderColor: isDark ? Colors.dark.border : '#e2e8f0',
                  width: 88,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 8, elevation: 2,
                }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: badge.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Ionicons name={badge.icon} size={24} color={badge.color} />
                </View>
                <Text style={{ color: C.text, fontSize: 10, fontWeight: '700', textAlign: 'center' }}>{badge.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <ProfileTimeline timeline={timeline} />

        {/* Settings */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
            Preferences
          </Text>
          <View
            style={{
              backgroundColor: isDark ? Colors.dark.surface : '#fff',
              borderRadius: 24, overflow: 'hidden',
              borderWidth: 1, borderColor: isDark ? Colors.dark.border : '#e2e8f0',
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 10, elevation: 2,
            }}
          >
            {/* Dark Mode */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#ede9fe', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Ionicons name="moon" size={18} color="#6366f1" />
              </View>
              <Text style={{ flex: 1, color: C.text, fontSize: 15, fontWeight: '600' }}>Dark Mode</Text>
              <Switch value={colorScheme === 'dark'} onValueChange={handleThemeToggle} trackColor={{ false: '#D1D1D6', true: Colors.primary }} />
            </View>

            <View style={{ height: 1, backgroundColor: isDark ? Colors.dark.border : '#f1f5f9', marginHorizontal: 16 }} />

            {/* Notifications */}
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }} activeOpacity={0.7} onPress={() => { router.push('/profile/notifications'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: isDark ? 'rgba(249,115,22,0.15)' : '#fff7ed', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Ionicons name="notifications" size={18} color="#f97316" />
              </View>
              <Text style={{ flex: 1, color: C.text, fontSize: 15, fontWeight: '600' }}>Notifications</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: isDark ? Colors.dark.border : '#f1f5f9', marginHorizontal: 16 }} />

            {/* Send Notification */}
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }} activeOpacity={0.7} onPress={() => { router.push('/profile/send-notification' as any); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Ionicons name="send" size={18} color="#6366f1" />
              </View>
              <Text style={{ flex: 1, color: C.text, fontSize: 15, fontWeight: '600' }}>Send Notification</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: isDark ? Colors.dark.border : '#f1f5f9', marginHorizontal: 16 }} />

            {/* Biometric */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#d1fae5', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Ionicons name="finger-print" size={18} color="#10b981" />
              </View>
              <Text style={{ flex: 1, color: C.text, fontSize: 15, fontWeight: '600' }}>Biometric Unlock</Text>
              <Switch value={isBiometricEnabled} onValueChange={handleBiometricToggle} trackColor={{ false: '#D1D1D6', true: '#34C759' }} />
            </View>

            <View style={{ height: 1, backgroundColor: isDark ? Colors.dark.border : '#f1f5f9', marginHorizontal: 16 }} />

            {/* App Icon */}
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }} activeOpacity={0.7} onPress={() => { router.push('/profile/app-icon'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Ionicons name="apps" size={18} color="#22c55e" />
              </View>
              <Text style={{ flex: 1, color: C.text, fontSize: 15, fontWeight: '600' }}>App Icon</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: isDark ? Colors.dark.border : '#f1f5f9', marginHorizontal: 16 }} />

            {/* Privacy */}
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }} activeOpacity={0.7}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#fee2e2', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Ionicons name="shield-checkmark" size={18} color="#ef4444" />
              </View>
              <Text style={{ flex: 1, color: C.text, fontSize: 15, fontWeight: '600' }}>Privacy & Security</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Testing Buttons */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16, gap: 10 }}>
          <TouchableOpacity
            style={{
              height: 52, borderRadius: 18,
              backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff',
              borderWidth: 1, borderColor: isDark ? 'rgba(99,102,241,0.25)' : '#c7d2fe',
              alignItems: 'center', justifyContent: 'center',
            }}
            onPress={() => {
              Sentry.captureException(new Error('Sentry Test Error from Edurise LMS'));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '700' }}>Try Sentry Error</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              height: 52, borderRadius: 18,
              backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb',
              borderWidth: 1, borderColor: isDark ? 'rgba(245,158,11,0.25)' : '#fde68a',
              alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/profile/event-testing' as any);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="flask" size={18} color="#F59E0B" />
            <Text style={{ color: '#F59E0B', fontSize: 14, fontWeight: '700' }}>Event Testing Dashboard</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity
            style={{
              height: 56, borderRadius: 18,
              backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#fff5f5',
              borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#fecaca',
              alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
            }}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '700' }}>Sign Out</Text>
          </TouchableOpacity>
          <Text style={{ color: C.textMuted, fontSize: 11, textAlign: 'center', marginTop: 16, opacity: 0.5, fontWeight: '500' }}>
            App Version 2.1.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
