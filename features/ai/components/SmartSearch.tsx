import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles, Search, X } from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';
import { smartSearch } from '../services/groqAgent';
import { useCourseStore } from '@/features/courses/store/courseStore';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';

export const SmartSearch = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { setAiRecommendedIds } = useCourseStore();

  const handleSmartSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const recommendedIds = await smartSearch(query);
    setAiRecommendedIds(recommendedIds);
    
    setIsSearching(false);
  };

  const clearSearch = () => {
    setQuery('');
    setAiRecommendedIds([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Animated.View 
      entering={FadeInUp} 
      layout={Layout.springify()}
      className="bg-white/80 dark:bg-slate-900/80 border border-primary/20 rounded-3xl p-4 mb-6 shadow-sm overflow-hidden"
      style={{ borderStyle: 'dashed' }}
    >
      <View className="flex-row items-center mb-3">
        <View className="bg-primary/10 p-2 rounded-xl mr-3">
          <Sparkles size={20} color={Colors.primary} />
        </View>
        <View>
          <Text className="text-sm font-bold text-primary">AI Smart Search</Text>
          <Text className="text-xs text-text-muted">Search by intent, e.g. "I want to be a dev"</Text>
        </View>
      </View>

      <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-1">
        <Search size={18} color={Colors.textMuted} />
        <TextInput
          className="flex-1 h-12 ml-3 text-text"
          placeholder="Describe what you want to learn..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSmartSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch} className="p-2">
            <X size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        onPress={handleSmartSearch}
        disabled={isSearching || !query.trim()}
        className={`mt-3 py-3 rounded-2xl flex-row items-center justify-center ${isSearching ? 'bg-primary/50' : 'bg-primary'}`}
      >
        {isSearching ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Sparkles size={16} color="white" className="mr-2" />
            <Text className="text-white font-bold ml-2">Find Courses with AI</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};
