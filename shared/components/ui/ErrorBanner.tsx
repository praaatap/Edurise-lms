import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorBannerProps {
  error: string | null;
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  if (!error) return null;

  return (
    <View className="flex-row items-center bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-4">
      <Ionicons name="alert-circle" size={18} color="#EF4444" />
      <Text className="text-error text-sm font-medium ml-2 flex-1">{error}</Text>
    </View>
  );
}
