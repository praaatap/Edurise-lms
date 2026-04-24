import { Colors } from '@/core/theme/colors';
import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export const Input = React.memo(({ label, error, className = '', ...props }: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={`mb-4 ${className}`}>
      {label && <Text className="text-sm font-semibold text-text mb-1.5 ml-1">{label}</Text>}
      <TextInput
        className={`bg-surface border rounded-xl px-4 py-3 text-base text-text ${
          isFocused ? 'border-primary' : 'border-border'
        } ${error ? 'border-error' : ''}`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor={Colors.textFaint}
        {...props}
      />
      {error && <Text className="text-error text-xs mt-1.5 ml-1 font-medium">{error}</Text>}
    </View>
  );
});
