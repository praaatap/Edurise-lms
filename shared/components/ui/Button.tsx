import { Colors } from '@/core/theme/colors';
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  style?: any;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
}

export const Button = React.memo(({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className = '',
  textClassName = '',
  style,
  rightIcon,
  leftIcon,
}: ButtonProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-secondary';
      case 'ghost':
        return 'bg-transparent border border-border';
      case 'outline':
        return 'bg-transparent border border-primary';
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
      case 'outline':
        return Colors.primary;
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
      style={style}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
          <Text 
            className={`text-base font-bold ${variant === 'ghost' ? 'text-text' : variant === 'outline' ? 'text-primary' : 'text-white'} ${textClassName}`}
            style={{ color: getTextColor() }}
          >
            {title}
          </Text>
          {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
});
