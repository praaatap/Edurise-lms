import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@/core/theme/colors';

interface BadgeProps {
  text: string;
  dot?: boolean;
  color?: string;
  className?: string;
}

export const Badge = React.memo(({ text, dot, color = Colors.primary, className }: BadgeProps) => {
  return (
    <View 
      className={`flex-row items-center px-2.5 py-1 rounded-full ${className}`}
      style={{ backgroundColor: `${color}15` }}
    >
      {dot && <View className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: color }} />}
      <Text className="text-[10px] font-bold uppercase" style={{ color }}>{text}</Text>
    </View>
  );
});
