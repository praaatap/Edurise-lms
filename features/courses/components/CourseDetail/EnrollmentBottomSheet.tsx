import { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { CreditCard, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';

interface EnrollmentBottomSheetProps {
  bottomSheetRef: any;
  isEnrolled: boolean;
  courseTitle: string;
  coursePrice: number;
  onConfirmEnrollment: () => void;
  onUnenroll: () => void;
  onGoAhead: () => void;
}

export const EnrollmentBottomSheet = ({
  bottomSheetRef,
  isEnrolled,
  courseTitle,
  coursePrice,
  onConfirmEnrollment,
  onUnenroll,
  onGoAhead,
}: EnrollmentBottomSheetProps) => {
  const snapPoints = useMemo(() => ['45%'], []);
  const { C } = useTheme();

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: C.border, width: 40 }}
      backgroundStyle={{ borderRadius: 40, backgroundColor: C.surface }}
    >
      <BottomSheetView className="p-8 items-center w-full">
        {!isEnrolled ? (
          <>
            <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-6">
              <CreditCard size={32} color={Colors.primary} />
            </View>
            <Text style={{ color: C.text }} className="text-2xl font-extrabold mb-2">Confirm Enrollment</Text>
            <Text style={{ color: C.textMuted }} className="text-base text-center mb-8 leading-6">
              You are about to enroll in <Text style={{ color: C.text }} className="font-bold">{courseTitle}</Text>.
            </Text>

            <TouchableOpacity
              className="bg-primary w-full h-15 py-4 rounded-2xl justify-center items-center shadow-md mb-4"
              onPress={onConfirmEnrollment}
            >
              <Text className="text-white text-lg font-bold">Confirm & Start • ${coursePrice.toFixed(2)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full py-2 items-center"
              onPress={() => bottomSheetRef.current?.close()}
            >
              <Text style={{ color: C.textMuted }} className="text-base font-semibold">Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View className="w-16 h-16 bg-success/10 rounded-full items-center justify-center mb-6">
              <CheckCircle2 size={32} color={Colors.success} />
            </View>
            <Text style={{ color: C.text }} className="text-2xl font-extrabold mb-2">You are enrolled!</Text>
            <Text style={{ color: C.textMuted }} className="text-base text-center mb-8 leading-6">
              What would you like to do with <Text style={{ color: C.text }} className="font-bold">{courseTitle}</Text>?
            </Text>

            <TouchableOpacity
              className="bg-success w-full h-15 py-4 rounded-2xl justify-center items-center shadow-md mb-4 flex-row"
              onPress={onGoAhead}
            >
              <Text className="text-white text-lg font-bold mr-2">Go Ahead (Continue Learning)</Text>
              <ArrowRight size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full py-4 items-center rounded-2xl border border-error/30"
              onPress={onUnenroll}
            >
              <Text className="text-error text-base font-bold">Un-enroll from Course</Text>
            </TouchableOpacity>
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
};
