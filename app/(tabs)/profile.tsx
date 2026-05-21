import { analytics } from '@/core/services/analyticsService';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCourseStore } from '@/features/courses/store/courseStore';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { CustomDialog } from '@/shared/components/ui/CustomDialog';
import { UnsplashPicker } from '@/shared/components/ui/UnsplashPicker';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';
import { getFloatingTabBarContentInset } from '@/shared/utils/navigationLayout';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LevelProgress } from '@/features/auth/components/Profile/LevelProgress';
import { ProfileHeader } from '@/features/auth/components/Profile/ProfileHeader';
import { ProfileStats } from '@/features/auth/components/Profile/ProfileStats';
import { ProfileTimeline } from '@/features/auth/components/Profile/ProfileTimeline';

const BADGES = [
  {
    id: 'early-bird',
    icon: 'sunny' as const,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    title: 'Early Bird',
  },
  {
    id: 'fast-learner',
    icon: 'rocket' as const,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.12)',
    title: 'Fast Learner',
  },
  {
    id: 'quiz-master',
    icon: 'trophy' as const,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    title: 'Quiz Master',
  },
  {
    id: 'streak-king',
    icon: 'flame' as const,
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
    title: 'Streak King',
  },
];

export default function ProfileScreen() {
  const {
    user,
    logout,
    updateProfile,
    localAvatar: globalLocalAvatar,
    setLocalAvatar: setGlobalLocalAvatar,
  } = useAuthStore();
  const { bookmarks, enrolledCourses, completedCourses, timeline } =
    useCourseStore();
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tabBarContentInset = getFloatingTabBarContentInset(insets.bottom);
  const signOutSheetRef = useRef<BottomSheet>(null);
  const signOutSnapPoints = useRef(['36%']).current;

  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    type?: 'default' | 'destructive' | 'success';
  }>({ visible: false, title: '', message: '' });
  const [isUnsplashVisible, setIsUnsplashVisible] = useState(false);
  const [photoHistory, setPhotoHistory] = useState<string[]>([]);
  const { width } = useWindowDimensions();
  const photoGridSize = (width - 40 - 4) / 3; // 3 columns with 2px gaps

  const completionProgress =
    enrolledCourses.length === 0
      ? 0
      : Math.round((completedCourses.length / enrolledCourses.length) * 100);

  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const xpToNextLevel = level * 1000;
  const xpProgress = Math.min(100, (xp / xpToNextLevel) * 100);

  useScreenTracking('Profile');

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    AsyncStorage.getItem('biometric_enabled').then((val) => {
      if (mountedRef.current) setIsBiometricEnabled(val === 'true');
    });
    return () => {
      mountedRef.current = false;
    };
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
          type: 'default',
        });
        return;
      }
    }
    setIsBiometricEnabled(nextValue);
    await AsyncStorage.setItem('biometric_enabled', String(nextValue));
    analytics.logEvent('biometric_toggled', { enabled: nextValue });
  }, []);

  const handleLogout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signOutSheetRef.current?.expand();
  }, []);

  const confirmLogout = useCallback(() => {
    signOutSheetRef.current?.close();
    analytics.logEvent('profile_logout');
    logout();
  }, [logout]);

  const renderSheetBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    [],
  );

  const pickProfileImage = useCallback(async () => {
    try {
      const { status: currentStatus } =
        await ImagePicker.getMediaLibraryPermissionsAsync();
      if (currentStatus === 'denied') {
        setDialogConfig({
          visible: true,
          title: 'Permission Required',
          message:
            'Photo library access was denied. Please go to Settings and allow access for Edurise LMS.',
          confirmText: 'OK',
          type: 'default',
        });
        return;
      }
      if (currentStatus !== 'granted') {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setDialogConfig({
            visible: true,
            title: 'Permission Required',
            message:
              'Please allow access to your photo library to update your profile picture.',
            confirmText: 'OK',
            type: 'default',
          });
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
        setPhotoHistory((prev) =>
          [uri, ...prev.filter((u) => u !== uri)].slice(0, 9),
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setDialogConfig({
        visible: true,
        title: 'Error',
        message: 'Could not open photo library. Please try again.',
        confirmText: 'OK',
        type: 'default',
      });
    }
  }, [setGlobalLocalAvatar, updateProfile]);

  const handleUnsplashSelect = useCallback(
    (url: string) => {
      setGlobalLocalAvatar(url);
      updateProfile({ avatar: { url, localPath: url } });
      setPhotoHistory((prev) =>
        [url, ...prev.filter((u) => u !== url)].slice(0, 9),
      );
      setIsUnsplashVisible(false);
      analytics.logEvent('profile_image_updated', { source: 'unsplash' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [updateProfile, setGlobalLocalAvatar],
  );

  const showImagePickerOptions = useCallback(
    () => setIsUnsplashVisible(true),
    [],
  );

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <CustomDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        type={dialogConfig.type}
        onConfirm={() => {
          dialogConfig.onConfirm?.();
          setDialogConfig((prev) => ({ ...prev, visible: false }));
        }}
        onCancel={() =>
          setDialogConfig((prev) => ({ ...prev, visible: false }))
        }
      />
      <UnsplashPicker
        visible={isUnsplashVisible}
        onClose={() => setIsUnsplashVisible(false)}
        onSelect={handleUnsplashSelect}
        onPickFromGallery={() => {
          setIsUnsplashVisible(false);
          // Delay ensures modal is fully dismissed before iOS shows another native controller.
          const t = setTimeout(() => {
            if (mountedRef.current) pickProfileImage();
          }, 500);
          return () => clearTimeout(t);
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarContentInset }}
      >
        <ProfileHeader
          insets={insets}
          user={user}
          localAvatar={globalLocalAvatar}
          level={level}
          onPickImage={showImagePickerOptions}
        />

        <LevelProgress
          level={level}
          xp={xp}
          xpToNextLevel={xpToNextLevel}
          xpProgress={xpProgress}
        />

        <ProfileStats
          enrolledCount={enrolledCourses.length}
          bookmarksCount={bookmarks.length}
          progress={completionProgress}
        />

        {/* Photo History — Instagram-style grid */}
        {(photoHistory.length > 0 || globalLocalAvatar) && (
          <Animated.View
            entering={FadeInDown.springify()}
            style={{ paddingHorizontal: 20, marginBottom: 24 }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: C.textMuted,
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                }}
              >
                Photos
              </Text>
              <TouchableOpacity onPress={showImagePickerOptions}>
                <Text
                  style={{
                    color: Colors.primary,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  + Add
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
              {[
                globalLocalAvatar,
                ...photoHistory.filter((p) => p !== globalLocalAvatar),
              ]
                .filter(Boolean)
                .slice(0, 9)
                .map((uri, i) => (
                  <Animated.View
                    key={uri}
                    entering={FadeIn.delay(i * 50)}
                    style={{
                      width: photoGridSize,
                      height: photoGridSize,
                      borderRadius: i === 0 ? 14 : 8,
                      overflow: 'hidden',
                      borderWidth: i === 0 ? 2.5 : 0,
                      borderColor: i === 0 ? Colors.primary : 'transparent',
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={showImagePickerOptions}
                    >
                      <Image
                        source={{ uri: uri! }}
                        style={{ width: photoGridSize, height: photoGridSize }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                      {i === 0 && (
                        <View
                          style={{
                            position: 'absolute',
                            bottom: 4,
                            left: 4,
                            backgroundColor: Colors.primary,
                            borderRadius: 6,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                          }}
                        >
                          <Text
                            style={{
                              color: '#fff',
                              fontSize: 9,
                              fontWeight: '800',
                            }}
                          >
                            CURRENT
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              {/* Add more button if less than 9 */}
              {[globalLocalAvatar, ...photoHistory].filter(Boolean).length <
                9 && (
                <TouchableOpacity
                  onPress={showImagePickerOptions}
                  activeOpacity={0.7}
                  style={{
                    width: photoGridSize,
                    height: photoGridSize,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: C.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.03)'
                      : '#F8FAFC',
                  }}
                >
                  <Ionicons name="add" size={24} color={C.textMuted} />
                  <Text
                    style={{
                      color: C.textMuted,
                      fontSize: 10,
                      fontWeight: '600',
                      marginTop: 4,
                    }}
                  >
                    Add Photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {/* Achievements */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text
            style={{
              color: C.textMuted,
              fontSize: 11,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 12,
            }}
          >
            Achievements
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {BADGES.map((badge) => (
              <View
                key={badge.id}
                style={{
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: isDark ? Colors.dark.surface : '#fff',
                  borderWidth: 1,
                  borderColor: isDark ? Colors.dark.border : '#e2e8f0',
                  width: 88,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.2 : 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: badge.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Ionicons name={badge.icon} size={24} color={badge.color} />
                </View>
                <Text
                  style={{
                    color: C.text,
                    fontSize: 10,
                    fontWeight: '700',
                    textAlign: 'center',
                  }}
                >
                  {badge.title}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <ProfileTimeline timeline={timeline} />

        {/* Settings */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <View>
              <Text
                style={{
                  color: C.textMuted,
                  fontSize: 11,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 1.4,
                }}
              >
                Settings
              </Text>
              <Text
                style={{
                  color: C.text,
                  fontSize: 18,
                  fontWeight: '800',
                  marginTop: 4,
                }}
              >
                Control your experience
              </Text>
            </View>
            <View
              style={{
                backgroundColor: isDark
                  ? 'rgba(72,199,142,0.12)'
                  : 'rgba(72,199,142,0.1)',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
              }}
            >
              <Text
                style={{
                  color: Colors.primary,
                  fontSize: 11,
                  fontWeight: '800',
                  letterSpacing: 0.8,
                }}
              >
                Personal
              </Text>
            </View>
          </View>

          <View style={{ gap: 14 }}>
            <View
              style={{
                backgroundColor: isDark ? Colors.dark.surface : '#fff',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: isDark ? Colors.dark.border : '#e2e8f0',
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.18 : 0.05,
                shadowRadius: 14,
                elevation: 2,
              }}
            >
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: C.textMuted,
                    fontSize: 11,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                  }}
                >
                  Appearance
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
                activeOpacity={0.7}
                onPress={() => {
                  router.push('/profile/app-icon');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: isDark
                      ? 'rgba(34,197,94,0.15)'
                      : '#dcfce7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="apps" size={18} color="#22c55e" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: C.text, fontSize: 15, fontWeight: '700' }}
                  >
                    App Icon
                  </Text>
                  <Text
                    style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}
                  >
                    Choose a cleaner badge for your home screen
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={C.textMuted}
                />
              </TouchableOpacity>
            </View>

            <View
              style={{
                backgroundColor: isDark ? Colors.dark.surface : '#fff',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: isDark ? Colors.dark.border : '#e2e8f0',
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.18 : 0.05,
                shadowRadius: 14,
                elevation: 2,
              }}
            >
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: C.textMuted,
                    fontSize: 11,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                  }}
                >
                  Notifications & Security
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
                activeOpacity={0.7}
                onPress={() => {
                  router.push('/profile/notifications');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: isDark
                      ? 'rgba(249,115,22,0.15)'
                      : '#fff7ed',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="notifications" size={18} color="#f97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: C.text, fontSize: 15, fontWeight: '700' }}
                  >
                    Notifications
                  </Text>
                  <Text
                    style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}
                  >
                    Manage reminders and alerts
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={C.textMuted}
                />
              </TouchableOpacity>

              <View
                style={{
                  height: 1,
                  backgroundColor: isDark ? Colors.dark.border : '#f1f5f9',
                  marginHorizontal: 16,
                }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: isDark
                      ? 'rgba(16,185,129,0.15)'
                      : '#d1fae5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="finger-print" size={18} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: C.text, fontSize: 15, fontWeight: '700' }}
                  >
                    Biometric Unlock
                  </Text>
                  <Text
                    style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}
                  >
                    Use Face ID or fingerprint to sign in
                  </Text>
                </View>
                <Switch
                  value={isBiometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                />
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: isDark ? Colors.dark.border : '#f1f5f9',
                  marginHorizontal: 16,
                }}
              />

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: isDark
                      ? 'rgba(239,68,68,0.12)'
                      : '#fee2e2',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="shield-checkmark" size={18} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: C.text, fontSize: 15, fontWeight: '700' }}
                  >
                    Privacy & Security
                  </Text>
                  <Text
                    style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}
                  >
                    Review account privacy settings
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={C.textMuted}
                />
              </TouchableOpacity>
            </View>

            <View
              style={{
                backgroundColor: isDark ? Colors.dark.surface : '#fff',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: isDark ? Colors.dark.border : '#e2e8f0',
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.18 : 0.05,
                shadowRadius: 14,
                elevation: 2,
              }}
            >
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: C.textMuted,
                    fontSize: 11,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                  }}
                >
                  Developer
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
                activeOpacity={0.7}
                onPress={() => {
                  router.push('/profile/send-notification' as any);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: isDark
                      ? 'rgba(99,102,241,0.15)'
                      : '#eef2ff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="send" size={18} color="#6366f1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: C.text, fontSize: 15, fontWeight: '700' }}
                  >
                    Send Notification
                  </Text>
                  <Text
                    style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}
                  >
                    Trigger test notifications from inside the app
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={C.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Developer tools */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View
            style={{
              backgroundColor: isDark ? Colors.dark.surface : '#fff',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: isDark ? Colors.dark.border : '#e2e8f0',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.18 : 0.05,
              shadowRadius: 14,
              elevation: 2,
            }}
          >
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 8,
              }}
            >
              <Text
                style={{
                  color: C.textMuted,
                  fontSize: 11,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                }}
              >
                Developer Tools
              </Text>
            </View>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
              onPress={() => {
                Sentry.captureException(
                  new Error('Sentry Test Error from Edurise LMS'),
                );
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="bug" size={18} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: C.text, fontSize: 15, fontWeight: '700' }}
                >
                  Try Sentry Error
                </Text>
                <Text
                  style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}
                >
                  Send a test error to verify monitoring
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </TouchableOpacity>

            <View
              style={{
                height: 1,
                backgroundColor: isDark ? Colors.dark.border : '#f1f5f9',
                marginHorizontal: 16,
              }}
            />

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/profile/event-testing' as any);
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fffbeb',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="flask" size={18} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: C.text, fontSize: 15, fontWeight: '700' }}
                >
                  Event Testing Dashboard
                </Text>
                <Text
                  style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}
                >
                  Inspect analytics, events, and debug flows
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign out */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: isDark ? Colors.dark.surface : '#fff',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(239,68,68,0.18)' : '#fecaca',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.18 : 0.05,
              shadowRadius: 14,
              elevation: 2,
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 16,
                paddingVertical: 16,
                backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#fff5f5',
              }}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#ef4444"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ color: '#ef4444', fontSize: 15, fontWeight: '800' }}
              >
                Sign Out
              </Text>
            </TouchableOpacity>

            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: C.textMuted,
                  fontSize: 11,
                  textAlign: 'center',
                  opacity: 0.65,
                  fontWeight: '600',
                }}
              >
                App Version 2.1.0
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <BottomSheet
        ref={signOutSheetRef}
        index={-1}
        snapPoints={signOutSnapPoints}
        enablePanDownToClose
        backdropComponent={renderSheetBackdrop}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#374151' : '#E2E8F0',
          width: 40,
        }}
        backgroundStyle={{
          borderRadius: 32,
          backgroundColor: C.surface,
        }}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: isDark ? 'rgba(239,68,68,0.14)' : '#FEF2F2',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="log-out-outline" size={26} color="#EF4444" />
          </View>
          <Text
            style={{ color: C.text, fontSize: 24, fontWeight: '800' }}
            className="mb-2"
          >
            Sign Out
          </Text>
          <Text
            style={{ color: C.textMuted, fontSize: 14, lineHeight: 22 }}
            className="mb-6"
          >
            Your learning progress is saved. You can sign back in at any time.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#EF4444',
              paddingVertical: 16,
              borderRadius: 18,
              alignItems: 'center',
              marginBottom: 12,
            }}
            activeOpacity={0.85}
            onPress={confirmLogout}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
              Sign Out Now
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: isDark ? Colors.dark.surfaceElevated : '#F8FAFC',
              borderWidth: 1,
              borderColor: C.border,
              paddingVertical: 16,
              borderRadius: 18,
              alignItems: 'center',
            }}
            activeOpacity={0.8}
            onPress={() => signOutSheetRef.current?.close()}
          >
            <Text style={{ color: C.text, fontSize: 15, fontWeight: '700' }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
