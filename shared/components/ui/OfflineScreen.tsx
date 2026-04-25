import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface OfflineScreenProps {
  onRetry?: () => void;
  onContinueOffline?: () => void;
}

export const OfflineScreen = ({ onRetry, onContinueOffline }: OfflineScreenProps) => {
  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill}>
        <View className="flex-1 items-center justify-center px-8">
          <Animated.View 
            entering={FadeInDown.delay(200).springify()}
            className="w-24 h-24 bg-red-50 rounded-full items-center justify-center mb-8 shadow-sm"
          >
            <Ionicons name="cloud-offline" size={48} color="#EF4444" />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()} className="items-center">
            <Text className="text-2xl font-extrabold text-text text-center mb-3">
              Oops! No Connection
            </Text>
            <Text className="text-base text-text-muted text-center leading-6 mb-10">
              It looks like you're not connected to the internet. Don't worry, you can still access your cached courses!
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600).springify()} className="w-full gap-4">
            <TouchableOpacity 
              onPress={onRetry}
              className="w-full h-14 bg-primary rounded-2xl items-center justify-center shadow-lg shadow-primary/30"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg">Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={onContinueOffline}
              className="w-full h-14 bg-white border border-border/50 rounded-2xl items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-text font-bold text-lg">Continue Offline</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
