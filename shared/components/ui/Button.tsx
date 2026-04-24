import { Colors } from '@/core/theme/colors';
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
}

export const Button = React.memo(({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className = '',
  textClassName = '',
}: ButtonProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-secondary';
      case 'ghost':
        return 'bg-transparent border border-border';
      case 'danger':
        return 'bg-error';
      case 'primary':
      default:
        return 'bg-primary';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'ghost':
        return Colors.text;
      default:
        return 'white';
    }
  };

  return (
    <TouchableOpacity
      className={`py-3 px-6 rounded-xl items-center justify-center flex-row ${getVariantClasses()} ${disabled ? 'opacity-50' : ''} ${className}`}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text 
          className={`text-base font-bold ${variant === 'ghost' ? 'text-text' : 'text-white'} ${textClassName}`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
});
