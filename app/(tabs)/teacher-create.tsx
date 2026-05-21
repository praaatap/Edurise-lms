import { useState, Fragment } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { coursesApi } from '@/features/courses/api/coursesApi';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Layout,
  ListChecks,
  Rocket,
  Image as ImageIcon,
  Type,
  Tag
} from 'lucide-react-native';

const STEPS = [
  { id: 1, title: 'Basics', icon: Type },
  { id: 2, title: 'Content', icon: Layout },
  { id: 3, title: 'Lessons', icon: ListChecks },
  { id: 4, title: 'Launch', icon: Rocket },
];

export default function TeacherCreate() {
  const router = useRouter();
  const { C } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    level: 'Beginner',
    thumbnail: '',
  });

  const nextStep = () => {
    if (currentStep < STEPS.length) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleLaunch = async () => {
    if (!courseData.title.trim()) {
      Alert.alert('Missing Info', 'Please enter a course title.');
      return;
    }
    setIsLoading(true);
    try {
      await coursesApi.createCourse({
        title: courseData.title,
        description: courseData.description,
        category: courseData.category || 'General',
        price: parseFloat(courseData.price) || 0,
        difficulty: courseData.level.toUpperCase(),
        thumbnailUrl: courseData.thumbnail || undefined,
        isPublished: true,
      });
      setIsLoading(false);
      Alert.alert('Success! 🎉', 'Your course has been published!', [
        { text: 'Go to My Courses', onPress: () => router.replace('/(tabs)/teacher-courses' as any) }
      ]);
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.response?.data?.error?.message || 'Failed to create course. Please try again.';
      Alert.alert('Error', msg);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        return (
          <Fragment key={step.id}>
            <View style={styles.stepWrapper}>
              <View 
                style={[
                  styles.stepCircle, 
                  { 
                    backgroundColor: isCompleted || isActive ? Colors.primary : C.surfaceElevated,
                    borderColor: isActive ? Colors.primary : 'transparent'
                  }
                ]}
              >
                {isCompleted ? (
                  <Check size={14} color="white" />
                ) : (
                  <Text style={[styles.stepNumber, { color: isActive ? 'white' : C.textMuted }]}>
                    {step.id}
                  </Text>
                )}
              </View>
              <Text 
                style={[
                  styles.stepTitle, 
                  { color: isActive ? Colors.primary : C.textMuted, fontWeight: isActive ? '700' : '500' }
                ]}
              >
                {step.title}
              </Text>
            </View>
            {index < STEPS.length - 1 && (
              <View 
                style={[
                  styles.stepLine, 
                  { backgroundColor: isCompleted ? Colors.primary : C.border }
                ]} 
              />
            )}
          </Fragment>
        );
      })}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeader, { color: C.text }]}>Course Basics</Text>
            <Input
              label="Course Title"
              placeholder="e.g. Master React Native in 30 Days"
              value={courseData.title}
              onChangeText={(t) => setCourseData({ ...courseData, title: t })}
              leftIcon={<Type size={18} color={C.textMuted} />}
            />
            <Input
              label="Category"
              placeholder="e.g. Development, Business, Design"
              value={courseData.category}
              onChangeText={(t) => setCourseData({ ...courseData, category: t })}
              leftIcon={<Tag size={18} color={C.textMuted} />}
            />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Price ($)"
                  placeholder="0 for Free"
                  keyboardType="numeric"
                  value={courseData.price}
                  onChangeText={(t) => setCourseData({ ...courseData, price: t })}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Input
                  label="Level"
                  placeholder="Beginner"
                  value={courseData.level}
                  onChangeText={(t) => setCourseData({ ...courseData, level: t })}
                />
              </View>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeader, { color: C.text }]}>Course Content</Text>
            <Input
              label="Description"
              placeholder="Tell your students what they will learn..."
              multiline
              numberOfLines={6}
              style={{ height: 120, textAlignVertical: 'top' }}
              value={courseData.description}
              onChangeText={(t) => setCourseData({ ...courseData, description: t })}
            />
            <TouchableOpacity style={[styles.imagePicker, { backgroundColor: C.surfaceElevated, borderColor: C.border }]}>
              <ImageIcon size={32} color={C.textMuted} />
              <Text style={{ color: C.textMuted, marginTop: 8 }}>Upload Course Thumbnail</Text>
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.stepHeader, { color: C.text }]}>Curriculum</Text>
              <TouchableOpacity style={styles.addLessonBtn}>
                <Text style={{ color: Colors.primary, fontWeight: '700' }}>+ Add Lesson</Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.lessonCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[styles.lessonTitle, { color: C.text }]}>1. Introduction to the Course</Text>
              <Text style={{ color: C.textMuted, fontSize: 12 }}>Video • 5 mins</Text>
            </View>
            
            <View style={[styles.lessonCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[styles.lessonTitle, { color: C.text }]}>2. Setting up the Environment</Text>
              <Text style={{ color: C.textMuted, fontSize: 12 }}>Text Content</Text>
            </View>

            <View style={[styles.lessonCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[styles.lessonTitle, { color: C.text }]}>3. First Quiz</Text>
              <Text style={{ color: C.textMuted, fontSize: 12 }}>Quiz • 5 Questions</Text>
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeader, { color: C.text }]}>Ready to Launch! 🚀</Text>
            <View style={[styles.previewCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <View style={styles.previewImagePlaceholder} />
              <View style={styles.previewInfo}>
                <Text style={[styles.previewTitle, { color: C.text }]}>{courseData.title || 'Course Title'}</Text>
                <Text style={{ color: C.textMuted }}>{courseData.category || 'Category'}</Text>
                <Text style={[styles.previewPrice, { color: Colors.primary }]}>
                  {courseData.price ? `$${courseData.price}` : 'Free'}
                </Text>
              </View>
            </View>
            <Text style={[styles.launchText, { color: C.textMuted }]}>
              Once you publish, students will be able to find and enroll in your course immediately.
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: C.background }}
    >
      <View style={styles.container}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: C.text }]}>Create Course</Text>
          <View style={{ width: 24 }} />
        </View>

        {renderStepIndicator()}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderStepContent()}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: C.surface, borderTopColor: C.border }]}>
          <Button
            title="Back"
            onPress={prevStep}
            variant="outline"
            disabled={currentStep === 1}
            style={{ flex: 1 }}
          />
          <View style={{ width: 12 }} />
          {currentStep === STEPS.length ? (
            <Button
              title="Launch Course"
              onPress={handleLaunch}
              isLoading={isLoading}
              style={{ flex: 2 }}
            />
          ) : (
            <Button
              title="Next Step"
              onPress={nextStep}
              style={{ flex: 2 }}
              rightIcon={<ArrowRight size={18} color="white" />}
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  stepWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 10,
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  stepContent: {
    gap: 16,
  },
  stepHeader: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  imagePicker: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addLessonBtn: {
    padding: 8,
  },
  lessonCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewImagePlaceholder: {
    height: 150,
    backgroundColor: '#E2E8F0',
  },
  previewInfo: {
    padding: 16,
    gap: 4,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  previewPrice: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  launchText: {
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
  },
});
