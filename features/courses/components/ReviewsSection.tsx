import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Star, Send } from 'lucide-react-native';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { coursesApi } from '@/features/courses/api/coursesApi';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

interface ReviewsSectionProps {
  courseId: string;
  isEnrolled: boolean;
}

function StarRow({ rating, onRate, size = 20 }: { rating: number; onRate?: (r: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onRate?.(s)} disabled={!onRate}>
          <Star
            size={size}
            color="#F59E0B"
            fill={s <= rating ? '#F59E0B' : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function ReviewsSection({ courseId, isEnrolled }: ReviewsSectionProps) {
  const { C } = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, [courseId]);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await coursesApi.fetchReviews(courseId);
      setReviews(data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (myRating === 0) {
      Alert.alert('Select a rating', 'Please tap the stars to rate this course.');
      return;
    }
    setIsSubmitting(true);
    try {
      await coursesApi.submitReview(courseId, { rating: myRating, comment: myComment.trim() || undefined });
      setMyComment('');
      setMyRating(0);
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={[styles.summary, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.avgRating, { color: C.text }]}>{avgRating.toFixed(1)}</Text>
        <StarRow rating={Math.round(avgRating)} size={18} />
        <Text style={[styles.reviewCount, { color: C.textMuted }]}>
          {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
        </Text>
      </View>

      {/* Write a review (enrolled users only) */}
      {isEnrolled && (
        <View style={[styles.writeReview, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.writeTitle, { color: C.text }]}>Your Review</Text>
          <StarRow rating={myRating} onRate={setMyRating} size={28} />
          <TextInput
            style={[styles.commentInput, { color: C.text, backgroundColor: C.background, borderColor: C.border }]}
            placeholder="Share your experience (optional)..."
            placeholderTextColor={C.textMuted}
            value={myComment}
            onChangeText={setMyComment}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: Colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator size="small" color="white" />
              : <>
                  <Send size={16} color="white" />
                  <Text style={styles.submitBtnText}>Submit Review</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
      ) : reviews.length === 0 ? (
        <Text style={[styles.empty, { color: C.textMuted }]}>
          No reviews yet.{isEnrolled ? ' Be the first!' : ''}
        </Text>
      ) : (
        reviews.map((review) => (
          <View key={review.id} style={[styles.reviewCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.reviewHeader}>
              <Image
                source={{ uri: review.user.avatarUrl || `https://i.pravatar.cc/100?u=${review.id}` }}
                style={styles.avatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.reviewerName, { color: C.text }]}>
                  {review.user.firstName} {review.user.lastName}
                </Text>
                <Text style={[styles.reviewDate, { color: C.textMuted }]}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <StarRow rating={review.rating} size={14} />
            </View>
            {review.comment ? (
              <Text style={[styles.reviewComment, { color: C.textMuted }]}>{review.comment}</Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  summary: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  avgRating: { fontSize: 48, fontWeight: '800' },
  reviewCount: { fontSize: 13 },
  writeReview: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  writeTitle: { fontSize: 16, fontWeight: '700' },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
  },
  submitBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  empty: { textAlign: 'center', marginTop: 20, fontSize: 14 },
  reviewCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerName: { fontSize: 14, fontWeight: '700' },
  reviewDate: { fontSize: 12 },
  reviewComment: { fontSize: 14, lineHeight: 20 },
});
