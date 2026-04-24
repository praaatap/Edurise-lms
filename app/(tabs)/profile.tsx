import { Colors } from '@/core/theme/colors';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuthStore();
  const { courses, bookmarks, enrolledCourses, completedCourses, quizScores, timeline } = useCourseStore();
  const insets = useSafeAreaInsets();
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const completionProgress =
    enrolledCourses.length === 0
      ? 0
      : Math.round((completedCourses.length / enrolledCourses.length) * 100);

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
        Alert.alert(
          'Biometrics Unavailable',
          'Face ID / Touch ID is not set up on this device yet.'
        );
        return;
      }
    }

    setIsBiometricEnabled(nextValue);
    await AsyncStorage.setItem('biometric_enabled', String(nextValue));
  }, []);



  const handleLogout = () => {
    Alert.alert('Sign Out', 'Come back soon!', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null;

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    >
      {/* Header */}
      <View className="items-center pb-8" style={{ paddingTop: insets.top + 24 }}>
        <View className="relative p-1 bg-white rounded-full shadow-sm">
          <Image
            source={user.avatar?.url || 'https://via.placeholder.com/150'}
            className="w-24 h-24 rounded-full"
            contentFit="cover"
          />

        </View>
        <Text className="text-2xl font-extrabold text-text mt-4 tracking-tighter">{user.username}</Text>
        <Text className="text-sm text-text-muted mt-1">{user.email}</Text>
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

      {/* System Status / DB Performance */}
      <View className="px-5 mb-8">
        <Text className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 ml-1">System Status</Text>
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-border/50">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base font-semibold text-text">Database Performance</Text>
            <View className="flex-row items-center bg-green-50 px-2 py-1 rounded-full">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
              <Text className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Optimal</Text>
            </View>
          </View>
          <View className="flex-row justify-between">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-extrabold text-text mb-1">24<Text className="text-sm font-semibold text-text-muted">ms</Text></Text>
              <Text className="text-[10px] font-bold text-text-muted uppercase">Latency</Text>
            </View>
            <View className="w-[1px] bg-border/50 mx-2" />
            <View className="flex-1 items-center">
              <Text className="text-2xl font-extrabold text-text mb-1">99.9<Text className="text-sm font-semibold text-text-muted">%</Text></Text>
              <Text className="text-[10px] font-bold text-text-muted uppercase">Uptime</Text>
            </View>
            <View className="w-[1px] bg-border/50 mx-2" />
            <View className="flex-1 items-center">
              <Text className="text-2xl font-extrabold text-text mb-1">1.2<Text className="text-sm font-semibold text-text-muted">k</Text></Text>
              <Text className="text-[10px] font-bold text-text-muted uppercase">Queries/s</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Learning Journey Timeline */}
      <View className="px-5 mb-8">
        <Text className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 ml-1">Learning Journey</Text>
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-border/50">
          {(timeline.length > 0 ? timeline : [{ id: 'join-event', action: 'Joined Mini LMS', type: 'join' as const, timestamp: Date.now() }]).map((item, index, arr) => (
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

      {/* Quiz Performance */}
      {Object.keys(quizScores).length > 0 && (
        <View className="px-5 mb-8">
          <Text className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 ml-1">Quiz Performance</Text>
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-border/50">
            {Object.entries(quizScores).map(([courseId, score]) => {
              const course = courses.find(c => c.id === courseId);
              return (
                <View key={courseId} className="flex-row items-center justify-between mb-4 last:mb-0">
                  <View className="flex-1 mr-4">
                    <Text className="text-sm font-bold text-text" numberOfLines={1}>{course?.title || 'Unknown Course'}</Text>
                    <View className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <View 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${score}%` }} 
                      />
                    </View>
                  </View>
                  <View className="bg-indigo-50 px-3 py-1 rounded-full">
                    <Text className="text-xs font-bold text-primary">{score}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Settings Group */}
      <View className="px-5">
        <Text className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 ml-1">Preferences</Text>
        <View className="bg-white rounded-3xl px-4 shadow-sm border border-border/50">
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
  );
}
