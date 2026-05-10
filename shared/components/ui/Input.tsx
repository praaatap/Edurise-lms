import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  containerStyle?: any;
}

export const Input = React.memo(({ label, error, hint, leftIcon, containerStyle, secureTextEntry, className = '', ...props }: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { C } = useTheme();

  const isPassword = secureTextEntry;

  return (
    <View style={containerStyle} className={`mb-4 ${className}`}>
      {label && (
        <Text style={{ color: C.textMuted }} className="text-sm font-semibold mb-2 ml-0.5">
          {label}
        </Text>
      )}
      <View
        className="flex-row items-center rounded-2xl px-4 border"
        style={{
          backgroundColor: C.surfaceElevated,
          borderColor: error ? Colors.error : isFocused ? Colors.primary : C.border,
          minHeight: 52,
        }}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-base py-3"
          style={{ color: C.text }}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={C.textMuted}
          secureTextEntry={isPassword && !isVisible}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setIsVisible(v => !v)} className="ml-2 p-1">
            {isVisible
              ? <Eye size={18} color={C.textMuted} />
              : <EyeOff size={18} color={C.textMuted} />
            }
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-error text-xs mt-1.5 ml-1 font-medium">{error}</Text>
      )}
      {hint && !error && (
        <Text style={{ color: C.textMuted }} className="text-xs mt-1.5 ml-1">{hint}</Text>
      )}
    </View>
  );
});
