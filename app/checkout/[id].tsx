import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  ArrowLeft, 
  CheckCircle2, 
  Zap
} from 'lucide-react-native';
import { Button } from '@/shared/components/ui/Button';
import { Image } from 'expo-image';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { apiClient } from '@/core/api/client';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { C, isDark } = useTheme();
  const { getCourseById, enrollCourse } = useCourseStore();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const course = getCourseById(id as string);

  if (!course) return null;

  const handlePurchase = async () => {
    setIsPurchasing(true);
    setPurchaseError(null);
    try {
      if (course.price === 0) {
        // Free course: enroll directly
        await enrollCourse(course.id);
      } else {
        // Paid course: create purchase record (marks as PENDING, auto-enrolls on free)
        await apiClient.post(`/purchases/checkout/${course.id}`);
        // Also enroll locally so UI updates immediately
        await enrollCourse(course.id);
      }
      router.replace(`/learn/${course.id}` as any);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message;
      if (err?.response?.status === 409 || msg?.includes('already')) {
        // Already purchased/enrolled — just navigate
        router.replace(`/learn/${course.id}` as any);
        return;
      }
      setPurchaseError(msg ?? 'Something went wrong. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const features = [
    'Lifetime access to all materials',
    'Official certificate of completion',
    'Direct teacher support (AI-enhanced)',
    'Downloadable offline resources',
  ];

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Secure Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Course Summary */}
        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.courseRow}>
            <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />
            <View style={styles.courseInfo}>
              <Text style={[styles.courseTitle, { color: C.text }]} numberOfLines={2}>{course.title}</Text>
              <Text style={[styles.courseInstructor, { color: C.textMuted }]}>by {course.instructor.name}</Text>
              <Text style={[styles.priceTag, { color: Colors.primary }]}>${course.price.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsContainer}>
          <Text style={[styles.sectionLabel, { color: C.text }]}>What you'll get:</Text>
          {features.map((feature, i) => (
            <View key={i} style={styles.benefitRow}>
              <View style={[styles.checkIcon, { backgroundColor: Colors.primary + '15' }]}>
                <CheckCircle2 size={16} color={Colors.primary} />
              </View>
              <Text style={[styles.benefitText, { color: C.text }]}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentContainer}>
          <Text style={[styles.sectionLabel, { color: C.text }]}>Payment Method</Text>
          <TouchableOpacity style={[styles.paymentMethod, { borderColor: Colors.primary, backgroundColor: Colors.primary + '05' }]}>
            <View style={styles.paymentLeft}>
              <CreditCard size={20} color={Colors.primary} />
              <Text style={[styles.paymentText, { color: C.text }]}>Credit / Debit Card</Text>
            </View>
            <View style={[styles.radioOuter, { borderColor: Colors.primary }]}>
              <View style={[styles.radioInner, { backgroundColor: Colors.primary }]} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.paymentMethod, { borderColor: C.border, backgroundColor: C.surface }]}>
            <View style={styles.paymentLeft}>
              <Zap size={20} color={C.textMuted} />
              <Text style={[styles.paymentText, { color: C.text }]}>Apple / Google Pay</Text>
            </View>
            <View style={[styles.radioOuter, { borderColor: C.border }]} />
          </TouchableOpacity>
        </View>

        {/* Security Trust */}
        <View style={[styles.securityCard, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
          <ShieldCheck size={20} color="#10B981" />
          <Text style={[styles.securityText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Payments are secured with 256-bit SSL encryption.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Payment Action */}
      <View style={[styles.footer, { backgroundColor: C.surface, borderTopColor: C.border }]}>
        <View style={styles.priceSummary}>
          <Text style={[styles.totalLabel, { color: C.textMuted }]}>Total Amount</Text>
          <Text style={[styles.totalPrice, { color: C.text }]}>${course.price.toFixed(2)}</Text>
        </View>
        {purchaseError ? (
          <Text style={{ color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>
            {purchaseError}
          </Text>
        ) : null}
        <Button
          title={course.price === 0 ? 'Enroll for Free' : 'Confirm & Pay'}
          onPress={handlePurchase}
          isLoading={isPurchasing}
          style={{ height: 56, borderRadius: 16 }}
          rightIcon={isPurchasing ? <ActivityIndicator size="small" color="white" /> : <Lock size={18} color="white" />}
        />
      </View>
    </View>
  );
}

// Internal ScrollView to avoid dependency issues in this pass
const ScrollView = (props: any) => {
  const { ScrollView: RNScrollView } = require('react-native');
  return <RNScrollView {...props} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  section: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  courseRow: {
    flexDirection: 'row',
    gap: 16,
  },
  thumbnail: {
    width: 100,
    height: 70,
    borderRadius: 12,
  },
  courseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 13,
    marginBottom: 4,
  },
  priceTag: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  benefitsContainer: {
    marginBottom: 32,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentContainer: {
    marginBottom: 24,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentText: {
    fontSize: 15,
    fontWeight: '600',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    gap: 16,
  },
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: '800',
  },
});
