import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Trophy, Share2 } from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import Animated, { FadeIn } from 'react-native-reanimated';

interface CertificateModalProps {
  visible: boolean;
  onClose: () => void;
  onShare: () => void;
  courseTitle: string;
}

export const CertificateModal = ({ visible, onClose, onShare, courseTitle }: CertificateModalProps) => {
  const { C, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <Animated.View
          entering={FadeIn.duration(400)}
          style={{ backgroundColor: C.surface, width: '100%', borderRadius: 40, overflow: 'hidden' }}
        >
          <View
            style={{
              padding: 32,
              alignItems: 'center',
              borderWidth: 12,
              borderColor: isDark ? Colors.dark.surfaceElevated : '#EEF2FF',
              margin: 8,
              borderRadius: 32,
            }}
          >
            <View style={{ width: 80, height: 80, backgroundColor: `${Colors.primary}1A`, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Trophy size={40} color={Colors.primary} />
            </View>

            <Text style={{ color: Colors.primary }} className="text-[10px] font-black uppercase tracking-[4px] mb-2">
              Certificate of Achievement
            </Text>
            <Text style={{ color: C.textMuted }} className="text-xs mb-6 uppercase tracking-widest">
              This is to certify that
            </Text>

            <Text style={{ color: C.text }} className="text-3xl font-black text-center mb-2 italic">
              Student Name
            </Text>
            <View style={{ height: 1, backgroundColor: C.border, width: 160, marginBottom: 24 }} />

            <Text style={{ color: C.textMuted }} className="text-sm text-center mb-8 px-4">
              has successfully completed the professional course
              <Text style={{ color: C.text }} className="font-bold"> {courseTitle} </Text>
              demonstrating mastery in the required skills and concepts.
            </Text>

            <View className="flex-row justify-between w-full mt-4 px-4">
              <View className="items-center">
                <View style={{ height: 1, backgroundColor: C.border, width: 96, marginBottom: 8 }} />
                <Text style={{ color: C.textMuted }} className="text-[10px] font-bold uppercase">Instructor</Text>
              </View>
              <View className="items-center">
                <View style={{ height: 1, backgroundColor: C.border, width: 96, marginBottom: 8 }} />
                <Text style={{ color: C.textMuted }} className="text-[10px] font-bold uppercase">Date</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', padding: 24, backgroundColor: C.surfaceElevated, borderTopWidth: 1, borderTopColor: C.border }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
              onPress={onClose}
            >
              <Text style={{ color: C.text }} className="font-bold">Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: Colors.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
              onPress={onShare}
            >
              <Share2 size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="font-bold text-white">Share</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
