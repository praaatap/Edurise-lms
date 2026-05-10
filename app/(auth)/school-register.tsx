
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useTheme } from '@/core/theme/useTheme';
import { useSchoolStore } from '@/features/school/store/schoolStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Building2, Globe, Mail, Type } from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';

const schoolSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Lower case letters, numbers and hyphens only'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  contactEmail: z.string().email('Invalid email address'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

type SchoolFormValues = z.infer<typeof schoolSchema>;

export default function SchoolRegisterScreen() {
  const router = useRouter();
  const { createSchool, isLoading } = useSchoolStore();
  const { user } = useAuthStore();
  const { C } = useTheme();

  const { control, handleSubmit, formState: { errors } } = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      category: 'Education',
      contactEmail: user?.email || '',
      website: '',
    },
  });

  const onSubmit = async (data: SchoolFormValues) => {
    try {
      await createSchool(data);
      router.replace('/(tabs)/admin-dashboard' as any);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create school');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: C.background }}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Building2 size={32} color="white" />
          </View>
          <Text style={[styles.title, { color: C.text }]}>Create Your School 🏛️</Text>
          <Text style={[styles.subtitle, { color: C.textMuted }]}>
            Set up your digital campus in minutes
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="School Name"
                placeholder="Greenwood International Academy"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.name?.message}
                leftIcon={<Building2 size={18} color={C.textMuted} />}
              />
            )}
          />

          <Controller
            control={control}
            name="slug"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="School URL Slug"
                placeholder="greenwood-academy"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.slug?.message}
                autoCapitalize="none"
                leftIcon={<Globe size={18} color={C.textMuted} />}
                hint="Your school will be found at edurise.com/schools/slug"
              />
            )}
          />

          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Category"
                placeholder="K-12, Higher Ed, Skills, etc."
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.category?.message}
                leftIcon={<Type size={18} color={C.textMuted} />}
              />
            )}
          />

          <Controller
            control={control}
            name="contactEmail"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Official Contact Email"
                placeholder="admin@school.com"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.contactEmail?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={18} color={C.textMuted} />}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Description"
                placeholder="Briefly describe your school and mission..."
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.description?.message}
                multiline
                numberOfLines={4}
                style={{ height: 100, textAlignVertical: 'top' }}
              />
            )}
          />

          <View style={styles.footer}>
            <Button
              title="Launch School"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
              className="h-14 rounded-2xl"
            />
            <Text style={[styles.disclaimer, { color: C.textMuted }]}>
              By launching, you agree to our School Terms and Service Level Agreement.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    gap: 4,
  },
  footer: {
    marginTop: 24,
    gap: 12,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
