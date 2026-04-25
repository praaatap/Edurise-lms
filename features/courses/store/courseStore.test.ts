import { useCourseStore } from './courseStore';

describe('Course Store', () => {
  beforeEach(() => {
    // Reset state before each test
    useCourseStore.setState({
      courses: [{ id: 'course_1', title: 'Test Course' } as any],
      filteredCourses: [],
      recommendedCourses: [],
      bookmarks: [],
      enrolledCourses: [],
      completedCourses: [],
      timeline: [],
      notes: {},
      streak: 0,
    });
  });

  it('should toggle bookmarks correctly', () => {
    const store = useCourseStore.getState();
    const courseId = 'course_1';

    // Initial state
    expect(store.bookmarks).toEqual([]);

    // Add bookmark
    store.toggleBookmark(courseId);
    expect(useCourseStore.getState().bookmarks).toEqual([courseId]);

    // Remove bookmark
    useCourseStore.getState().toggleBookmark(courseId);
    expect(useCourseStore.getState().bookmarks).toEqual([]);
  });

  it('should enroll in a course and add timeline event', () => {
    const store = useCourseStore.getState();
    const courseId = 'course_1';

    store.enrollCourse(courseId);
    const updatedStore = useCourseStore.getState();

    expect(updatedStore.enrolledCourses).toContain(courseId);
    expect(updatedStore.timeline.length).toBe(1);
    expect(updatedStore.timeline[0].type).toBe('enroll');
    expect(updatedStore.timeline[0].courseId).toBe(courseId);
  });

  it('should unenroll from a course', () => {
    useCourseStore.setState({ enrolledCourses: ['course_1', 'course_2'] });
    
    useCourseStore.getState().unenrollCourse('course_1');
    
    expect(useCourseStore.getState().enrolledCourses).toEqual(['course_2']);
  });

  it('should complete a course and update streak', () => {
    const courseId = 'course_1';
    
    useCourseStore.getState().completeCourse(courseId);
    const updatedStore = useCourseStore.getState();

    expect(updatedStore.completedCourses).toContain(courseId);
    expect(updatedStore.timeline.some(e => e.type === 'complete')).toBe(true);
  });

  it('should add notes', () => {
    const courseId = 'course_1';
    const noteContent = 'This is a test note';

    useCourseStore.getState().addNote(courseId, noteContent);
    
    expect(useCourseStore.getState().notes[courseId]).toContain(noteContent);
  });

  it('should update quiz scores', () => {
    const courseId = 'course_1';
    
    useCourseStore.getState().updateQuizScore(courseId, 85);
    expect(useCourseStore.getState().quizScores[courseId]).toBe(85);

    // Should only update if new score is higher
    useCourseStore.getState().updateQuizScore(courseId, 70);
    expect(useCourseStore.getState().quizScores[courseId]).toBe(85);

    useCourseStore.getState().updateQuizScore(courseId, 95);
    expect(useCourseStore.getState().quizScores[courseId]).toBe(95);
  });
});