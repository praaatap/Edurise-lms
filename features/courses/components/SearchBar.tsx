import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme/useTheme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar = React.memo(({
  value,
  onChangeText,
  placeholder = 'Search courses...'
}: SearchBarProps) => {
  const { C } = useTheme();
  
  return (
    <View className="flex-row items-center bg-surface dark:bg-dark-surface-elevated rounded-2xl px-4 h-12 border border-border dark:border-dark-border shadow-sm">
      <Ionicons name="search-outline" size={18} color={C.textMuted} style={{ marginRight: 8 }} />
      <TextInput
        className="flex-1 text-base text-text dark:text-dark-text"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color={C.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
});
