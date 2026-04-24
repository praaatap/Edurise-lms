import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/core/theme/colors';

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
  return (
    <View className="flex-row items-center bg-surface rounded-2xl px-4 h-12 border border-border shadow-sm">
      <Ionicons name="search-outline" size={18} color={Colors.textFaint} style={{ marginRight: 8 }} />
      <TextInput
        className="flex-1 text-base text-text"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textFaint}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color={Colors.textFaint} />
        </TouchableOpacity>
      )}
    </View>
  );
});
