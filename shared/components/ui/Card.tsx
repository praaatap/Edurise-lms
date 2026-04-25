import React from 'react';
import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = React.memo(({ children, className = '' }: CardProps) => {
  return (
    <View className={`bg-surface dark:bg-dark-surface rounded-2xl p-3 shadow-sm border border-border dark:border-dark-border ${className}`}>
      {children}
    </View>
  );
});
