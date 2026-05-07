import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSchoolStore } from '@/features/school/store/schoolStore';
import { useTheme } from '@/core/theme/useTheme';
import { SchoolCard } from '@/features/school/components/SchoolCard';
import { Search, Filter, GraduationCap } from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';
import { Input } from '@/shared/components/ui/Input';
import { useRouter } from 'expo-router';

export default function SchoolsIndex() {
  const { schools, fetchSchools, isLoading } = useSchoolStore();
  const { C } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    fetchSchools(text);
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: Colors.primary, fontWeight: '700' }}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.text }]}>Discover Schools 🏫</Text>
        <Text style={[styles.subtitle, { color: C.textMuted }]}>
          Find the perfect institution for your learning goals
        </Text>
      </View>

      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <Input
            placeholder="Search by name, category, or slug..."
            value={search}
            onChangeText={handleSearch}
            leftIcon={<Search size={18} color={C.textMuted} />}
            containerStyle={{ marginBottom: 0 }}
          />
        </View>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Filter size={20} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={schools}
        renderItem={({ item }) => <SchoolCard school={item} />}
        keyExtractor={(item) => item._id ?? item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchSchools} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.categoriesSection}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Featured Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {['All', 'Development', 'Design', 'Business', 'Music', 'Health'].map((cat) => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.catChip, { backgroundColor: cat === 'All' ? Colors.primary : C.surface, borderColor: C.border }]}
                >
                  <Text style={[styles.catText, { color: cat === 'All' ? 'white' : C.textMuted }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <GraduationCap size={64} color={C.border} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>
              {search ? 'No schools matching your search' : 'No schools found'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  backBtn: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  categoriesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  categoriesScroll: {
    gap: 10,
    paddingHorizontal: 4,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
