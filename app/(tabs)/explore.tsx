import { Colors } from '@/core/theme/colors';
import { CourseCard } from '@/features/courses/components/CourseCard';
import { SearchBar } from '@/features/courses/components/SearchBar';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Course } from '@/shared/types';
import { LegendList } from '@legendapp/list';
import { Href, useRouter } from 'expo-router';
import { Code, Compass } from 'lucide-react-native'; // Changed icon for empty state
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Updated categories to be strictly tech-focused
const CATEGORIES = [
  'All',
  'Web Dev',
  'Mobile App',
  'AI & ML',
  'Cloud Computing',
  'Cybersecurity',
  'Data Science',
];

function useExploreLogic() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filteredCourses, searchQuery, searchCourses, bookmarks, toggleBookmark } = useCourseStore();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleSearch = useCallback((text: string) => {
    setSelectedCategory('All');
    searchCourses(text);
  }, [searchCourses]);

  const handleCategoryPress = useCallback((category: string) => {
    setSelectedCategory(category);
    if (category === 'All') {
      searchCourses('');
    } else {
      searchCourses(category);
    }
  }, [searchCourses]);

  const handleCoursePress = useCallback((course: Course) => {
    router.push(`/course/${course.id}` as Href);
  }, [router]);

  return {
    insets,
    filteredCourses,
    searchQuery,
    bookmarks,
    toggleBookmark,
    selectedCategory,
    handleSearch,
    handleCategoryPress,
    handleCoursePress,
  };
}

export default function TechExploreScreen() {
  const {
    insets,
    filteredCourses,
    searchQuery,
    bookmarks,
    toggleBookmark,
    selectedCategory,
    handleSearch,
    handleCategoryPress,
    handleCoursePress,
  } = useExploreLogic();

  const renderItem = useCallback(({ item }: { item: Course }) => (
    <View className="mb-5">
      <CourseCard
        course={item}
        onPress={handleCoursePress}
        onToggleBookmark={toggleBookmark}
        isBookmarked={bookmarks.includes(item.id)}
      />
    </View>
  ), [handleCoursePress, toggleBookmark, bookmarks]);

  const ListHeader = useMemo(() => (
    <View className="px-1">
      <View className="px-1 mb-4">
        {/* Updated Header Titles for a Tech Vibe */}
        <Text className="text-3xl font-extrabold text-text tracking-tighter">Tech Academy</Text>
        <Text className="text-base text-text-muted mt-1">Master the latest programming & tech skills</Text>
      </View>
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearch}
        // Updated placeholder for tech context
        placeholder="Search for React, Python, AWS..." 
      />

      <View className="mt-6 mb-4">
        <Text className="text-lg font-bold text-text mb-3 px-1">Tech Tracks</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => handleCategoryPress(category)}
                style={{
                  backgroundColor: isSelected ? Colors.primary : Colors.surface,
                  borderColor: isSelected ? Colors.primary : Colors.border,
                }}
                className="mr-3 px-5 py-2.5 rounded-full border"
              >
                <Text
                  style={{ color: isSelected ? 'white' : Colors.text }}
                  className="font-medium"
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <Text className="text-lg font-bold text-text mt-2 mb-4 px-1">
        {searchQuery && selectedCategory === 'All' ? 'Search Results' : 'Trending Tech Courses'}
      </Text>
    </View>
  ), [searchQuery, handleSearch, selectedCategory, handleCategoryPress]);

  const ListEmpty = useMemo(() => (
    <View className="mt-20">
      <EmptyState
        icon={Code} // Swapped Compass for Code icon to fit the tech theme
        title="No tech courses found"
        message="Try searching for a different language, framework, or skill."
      />
    </View>
  ), []);

  return (
    <View className="flex-1 bg-background">
      <LegendList
        data={filteredCourses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={340}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100
        }}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
      />
    </View>
  );
}