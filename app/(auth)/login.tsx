import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = useCallback(async (data: LoginFormValues) => {
    try {
      await login(data);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid email or password';
      Alert.alert('Login Failed', message);
    }
  }, [login]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 32,
          paddingTop: Platform.OS === 'ios' ? 100 : 60,
          paddingBottom: 40
        }}
      >
        <View className="mb-12">
          <Text className="text-5xl font-extrabold text-text tracking-tighter mb-3">Welcome</Text>
          <Text className="text-lg text-text-muted leading-6 font-medium max-w-[80%]">Sign in to access your dashboard</Text>
        </View>

        <View className="w-full">
          <View className="mb-6">
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
                />
              )}
            />
          </View>

          <Button
            title="Continue"
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            className="h-14 rounded-2xl shadow-sm"
          />

          <TouchableOpacity
            onPress={() => { }}
            className="self-center mt-6"
          >
            <Text className="text-sm text-text-muted font-semibold">Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center items-center mt-auto pt-10">
          <Text className="text-text-muted text-base">New here?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text className="text-text text-base font-bold ml-1.5">Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
