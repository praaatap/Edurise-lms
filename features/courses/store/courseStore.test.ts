import { useCourseStore } from '@/features/courses/store/courseStore';
import { scheduleBookmarkMilestoneNotification } from '@/features/notifications/services/notificationService';

// Mock the API and external services
jest.mock('@/features/courses/api/coursesApi', () => ({
    coursesApi: {
        fetchInstructors: jest.fn(),
        fetchProducts: jest.fn(),
        mergeCourses: jest.fn(),
    },
}));

jest.mock('@/features/courses/utils/ai', () => ({
    aiService: {
        getRecommendedCourses: jest.fn(),
    },
}));

jest.mock('@/features/notifications/services/notificationService', () => ({
    scheduleBookmarkMilestoneNotification: jest.fn(),
}));

describe('courseStore State Management', () => {
    const initialState = useCourseStore.getState();

    beforeEach(() => {
        // Reset state before each test
        useCourseStore.setState(initialState, true);
        jest.clearAllMocks();
    });

    describe('Bookmarks & Notifications', () => {
        it('should add a course to bookmarks', () => {
            const { toggleBookmark } = useCourseStore.getState();

            toggleBookmark('course-1');

            expect(useCourseStore.getState().bookmarks).toContain('course-1');
        });

        it('should remove a course from bookmarks if it already exists', () => {
            useCourseStore.setState({ bookmarks: ['course-1'] });
            const { toggleBookmark } = useCourseStore.getState();

            toggleBookmark('course-1');

            expect(useCourseStore.getState().bookmarks).not.toContain('course-1');
        });

        it('should trigger milestone notification when 5 courses are bookmarked', () => {
            useCourseStore.setState({ bookmarks: ['c1', 'c2', 'c3', 'c4'] });
            const { toggleBookmark } = useCourseStore.getState();

            toggleBookmark('c5');

            expect(useCourseStore.getState().bookmarks.length).toBe(5);
            expect(scheduleBookmarkMilestoneNotification).toHaveBeenCalledTimes(1);
        });
    });

    describe('Enrollment & Completion', () => {
        it('should enroll in a course', () => {
            const { enrollCourse } = useCourseStore.getState();

            enrollCourse('course-1');

            expect(useCourseStore.getState().enrolledCourses).toContain('course-1');
        });

        it('should unenroll from a course and remove from completed', () => {
            useCourseStore.setState({
                enrolledCourses: ['course-1', 'course-2'],
                completedCourses: ['course-1']
            });
            const { unenrollCourse } = useCourseStore.getState();

            unenrollCourse('course-1');

            expect(useCourseStore.getState().enrolledCourses).not.toContain('course-1');
            expect(useCourseStore.getState().completedCourses).not.toContain('course-1');
        });

        it('should mark an enrolled course as complete', () => {
            useCourseStore.setState({ enrolledCourses: ['course-1'] });
            const { completeCourse } = useCourseStore.getState();

            completeCourse('course-1');

            expect(useCourseStore.getState().completedCourses).toContain('course-1');
        });

        it('should auto-enroll when completing an unenrolled course', () => {
            const { completeCourse } = useCourseStore.getState();

            completeCourse('course-2');

            expect(useCourseStore.getState().enrolledCourses).toContain('course-2');
            expect(useCourseStore.getState().completedCourses).toContain('course-2');
        });
    });

    describe('Quiz Scores', () => {
        it('should update quiz score, keeping the highest score', () => {
            const { updateQuizScore } = useCourseStore.getState();

            // Initial score
            updateQuizScore('course-1', 50);
            expect(useCourseStore.getState().quizScores['course-1']).toBe(50);

            // Higher score updates it
            updateQuizScore('course-1', 80);
            expect(useCourseStore.getState().quizScores['course-1']).toBe(80);

            // Lower score is ignored
            updateQuizScore('course-1', 40);
            expect(useCourseStore.getState().quizScores['course-1']).toBe(80); // Stays 80
        });
    });

    describe('Search functionality', () => {
        it('should filter courses based on search query', () => {
            const mockCourses = [
                { id: '1', title: 'React Native Basics', description: '', category: 'Mobile', instructor: { name: 'John' } },
                { id: '2', title: 'Advanced GraphQL', description: '', category: 'Web', instructor: { name: 'Jane' } },
            ] as any; // Cast as any for simplicity in test mock data

            useCourseStore.setState({ courses: mockCourses });
            const { searchCourses } = useCourseStore.getState();

            // Search matching title
            searchCourses('react');
            expect(useCourseStore.getState().searchQuery).toBe('react');
            expect(useCourseStore.getState().filteredCourses.length).toBe(1);
            expect(useCourseStore.getState().filteredCourses[0].id).toBe('1');

            // Search matching category
            searchCourses('web');
            expect(useCourseStore.getState().filteredCourses[0].id).toBe('2');

            // Empty search should return all
            searchCourses('');
            expect(useCourseStore.getState().filteredCourses.length).toBe(2);
        });
    });

  describe('Timeline Events', () => {
    it('should add a timeline event when a course is bookmarked', () => {
      const mockCourse = { id: 'c1', title: 'Test Course' } as any;
      useCourseStore.setState({ courses: [mockCourse] });
      const { toggleBookmark } = useCourseStore.getState();

      toggleBookmark('c1');

      const timeline = useCourseStore.getState().timeline;
      expect(timeline.length).toBe(1);
      expect(timeline[0].courseId).toBe('c1');
      expect(timeline[0].type).toBe('bookmark');
    });

    it('should limit timeline to 20 events', () => {
      const { addTimelineEvent } = useCourseStore.getState();
      
      for (let i = 0; i < 25; i++) {
        addTimelineEvent({
          courseId: `c${i}`,
          title: `Title ${i}`,
          action: `Action ${i}`,
          type: 'enroll'
        });
      }

      expect(useCourseStore.getState().timeline.length).toBe(20);
    });
  });

  describe('AI Recommendations', () => {
    it('should update aiRecommendedIds', () => {
      const { setAiRecommendedIds } = useCourseStore.getState();
      
      setAiRecommendedIds(['id1', 'id2']);
      
      expect(useCourseStore.getState().aiRecommendedIds).toEqual(['id1', 'id2']);
    });
  });
});