import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/core/theme/useTheme';
import { Mail, Lock, BookOpen } from 'lucide-react-native';
import { CustomDialog } from '@/shared/components/ui/CustomDialog';
import { useState } from 'react';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Cached hero image via expo-image
const HERO_URI = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { C, isDark } = useTheme();
  const [dialogConfig, setDialogConfig] = useState({ visible: false, title: '', message: '' });

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = useCallback(async (data: LoginFormValues) => {
    try {
      await login(data);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid email or password. Please try again.';
      setDialogConfig({ visible: true, title: 'Login Failed', message });
    }
  }, [login]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: C.background }}
    >
      <CustomDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText="Try Again"
        type="default"
        onConfirm={() => setDialogConfig(p => ({ ...p, visible: false }))}
        onCancel={() => setDialogConfig(p => ({ ...p, visible: false }))}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Hero Image with overlay */}
        <View className="h-56 w-full relative">
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
          {/* App logo on image */}
          <View className="absolute bottom-6 left-6 flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center mr-3">
              <BookOpen size={22} color="white" />
            </View>
            <Text className="text-white text-2xl font-black tracking-tight">Edurise</Text>
          </View>
        </View>

        {/* Form card */}
        <View
          className="flex-1 rounded-t-3xl -mt-6 px-6 pt-8 pb-10"
          style={{ backgroundColor: C.background }}
        >
          <Text style={{ color: C.text }} className="text-3xl font-extrabold tracking-tight mb-1">
            Welcome back Champ! 👋
          </Text>
          <Text style={{ color: C.textMuted }} className="text-base font-medium mb-8">
            Sign in to continue your learning journey
          </Text>

          {/* React Hook Form + Zod fields */}
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
                autoComplete="email"
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
                placeholder="Your password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
                secureTextEntry
                hint="Must be at least 6 characters"
                leftIcon={<Lock size={18} color={C.textMuted} />}
              />
            )}
          />

          <View className="mt-2">
            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
              className="h-14 rounded-2xl shadow-sm"
            />
          </View>

          <View className="flex-row justify-center items-center mt-8">
            <Text style={{ color: C.textMuted }} className="text-base">
              New here?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
              <Text className="text-primary text-base font-bold">Create account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
