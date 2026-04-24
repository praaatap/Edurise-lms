import React, { useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = useCallback(async (data: RegisterFormValues) => {
    try {
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        role: 'USER',
      };
      await register(payload);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Try a different email.';
      Alert.alert('Registration Failed', message);
    }
  }, [register]);

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
            paddingTop: Platform.OS === 'ios' ? 80 : 60,
            paddingBottom: 40 
        }}
      >
        <View className="mb-10">
          <Text className="text-5xl font-extrabold text-text tracking-tighter mb-3">Create Account</Text>
          <Text className="text-lg text-text-muted leading-6 font-medium max-w-[80%]">Join our community of learners today</Text>
        </View>

        <View className="w-full">
          <View className="mb-8">
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
                />
              )}
            />
          </View>

          <Button
            title="Create account"
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            className="h-14 rounded-2xl shadow-sm"
          />
        </View>

        <View className="flex-row justify-center items-center mt-auto pt-10">
          <Text className="text-text-muted text-base">Already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-text text-base font-bold ml-1.5">Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
