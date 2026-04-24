
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
} from 'react-native';

import Animated, { ZoomIn } from 'react-native-reanimated';

interface CustomDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'destructive' | 'success';
}

export function CustomDialog({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  type = 'default',
}: CustomDialogProps) {
  if (!visible) return null;

  const isDestructive = type === 'destructive';
  const isSuccess = type === 'success';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1 bg-black/50 justify-center items-center px-8">
          <TouchableWithoutFeedback>
            <Animated.View 
              entering={ZoomIn.duration(250)}
              className="bg-white dark:bg-dark-surface w-full rounded-[28px] p-6 shadow-2xl"
            >
              <Text className="text-xl font-bold text-text dark:text-dark-text mb-3">
                {title}
              </Text>
              <Text className="text-base text-text-muted dark:text-dark-text-muted leading-6 mb-8">
                {message}
              </Text>

              <View className="flex-row justify-end space-x-3">
                {onCancel && (
                  <TouchableOpacity
                    onPress={onCancel}
                    className="px-4 py-2 rounded-full"
                  >
                    <Text className="text-sm font-bold text-primary">
                      {cancelText}
                    </Text>
                  </TouchableOpacity>
                )}
                {onConfirm && (
                  <TouchableOpacity
                    onPress={onConfirm}
                    className={`px-6 py-2 rounded-full ${
                      isDestructive ? 'bg-red-500' : isSuccess ? 'bg-success' : 'bg-primary'
                    }`}
                  >
                    <Text className="text-sm font-bold text-white">
                      {confirmText}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
