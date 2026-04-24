import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Button } from './Button';
import { Colors } from '@/core/theme/colors';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  actionTitle?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = React.memo(({
  icon: Icon,
  title,
  message,
  actionTitle,
  onAction,
  className
}: EmptyStateProps) => {
  return (
    <View className={`flex-1 items-center justify-center p-8 ${className}`}>
      {Icon && <Icon size={64} color={Colors.textMuted} strokeWidth={1.5} />}
      <Text className="text-xl font-bold text-text mt-4 text-center">{title}</Text>
      <Text className="text-base text-text-muted mt-2 text-center leading-5">{message}</Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          className="mt-6 min-w-[200px]"
        />
      )}
    </View>
  );
});
