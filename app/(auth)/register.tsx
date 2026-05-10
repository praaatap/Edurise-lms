import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useTheme } from '@/core/theme/useTheme';
import { CustomDialog } from '@/shared/components/ui/CustomDialog';
import { User, Mail, Lock, BookOpen, GraduationCap, Building2 } from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['student', 'teacher', 'admin']),
  schoolCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const HERO_URI = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const { C, isDark } = useTheme();
  const [dialogConfig, setDialogConfig] = useState({ visible: false, title: '', message: '' });

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      schoolCode: '',
    },
    mode: 'onBlur',
  });

  const selectedRole = watch('role');

  const onSubmit = useCallback(async (data: RegisterFormValues) => {
    try {
      await register({
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role.toUpperCase(),
      });
      
      // Continue to school registration if role is admin
      if (data.role === 'admin') {
        router.push('/(auth)/school-register' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Try a different email.';
      setDialogConfig({ visible: true, title: 'Registration Failed', message });
    }
  }, [register]);

  const renderRoleOption = (role: 'student' | 'teacher' | 'admin', label: string, Icon: any) => {
    const isSelected = selectedRole === role;
    return (
      <TouchableOpacity
        style={[
          styles.roleOption,
          { 
            backgroundColor: isSelected ? Colors.primary + '15' : C.surface,
            borderColor: isSelected ? Colors.primary : C.border 
          }
        ]}
        onPress={() => setValue('role', role)}
        activeOpacity={0.7}
      >
        <Icon size={20} color={isSelected ? Colors.primary : C.textMuted} />
        <Text style={[styles.roleLabel, { color: isSelected ? Colors.primary : C.text }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: C.background }}
    >
      <CustomDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText="OK"
        type="default"
        onConfirm={() => setDialogConfig(p => ({ ...p, visible: false }))}
        onCancel={() => setDialogConfig(p => ({ ...p, visible: false }))}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="h-40 w-full relative">
          <Image
            source={HERO_URI}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="disk"
            transition={400}
          />
          <View
            className="absolute inset-0"
            style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)' }}
          />
          <View className="absolute bottom-4 left-6 flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center mr-3">
              <BookOpen size={22} color="white" />
            </View>
            <Text className="text-white text-2xl font-black tracking-tight">Edurise</Text>
          </View>
        </View>

        <View
          className="flex-1 rounded-t-3xl -mt-6 px-6 pt-6 pb-10"
          style={{ backgroundColor: C.background }}
        >
          <Text style={{ color: C.text }} className="text-2xl font-extrabold tracking-tight mb-1">
            Join the Community 🚀
          </Text>
          <Text style={{ color: C.textMuted }} className="text-sm font-medium mb-6">
            Choose your role and start your journey
          </Text>

          {/* Role Selector */}
          <View style={styles.roleContainer}>
            {renderRoleOption('student', 'Student', User)}
            {renderRoleOption('teacher', 'Teacher', GraduationCap)}
            {renderRoleOption('admin', 'School Admin', Building2)}
          </View>

          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Username"
                placeholder="johndoe"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.username?.message}
                autoCapitalize="none"
                leftIcon={<User size={18} color={C.textMuted} />}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="name@company.com"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={18} color={C.textMuted} />}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
                secureTextEntry
                leftIcon={<Lock size={18} color={C.textMuted} />}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="••••••••"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.confirmPassword?.message}
                secureTextEntry
                leftIcon={<Lock size={18} color={C.textMuted} />}
              />
            )}
          />

          {selectedRole === 'student' && (
            <Controller
              control={control}
              name="schoolCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="School Code (Optional)"
                  placeholder="e.g. SCH-1234"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.schoolCode?.message}
                  autoCapitalize="characters"
                  leftIcon={<Building2 size={18} color={C.textMuted} />}
                  hint="Join your school directly with a code"
                />
              )}
            />
          )}

          <View className="mt-4">
            <Button
              title={selectedRole === 'admin' ? 'Create School Profile' : 'Join Now'}
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
              className="h-14 rounded-2xl shadow-sm"
            />
          </View>

          <View className="flex-row justify-center items-center mt-6">
            <Text style={{ color: C.textMuted }} className="text-base">
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text className="text-primary text-base font-bold">Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 6,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
