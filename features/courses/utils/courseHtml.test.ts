import { generateCourseHtml } from './courseHtml';

describe('Course HTML Generator', () => {
  const mockCourse = {
    title: 'Test Course',
    description: 'Test Description',
    category: 'Test Category',
    thumbnail: 'test.jpg',
    instructor: {
      name: 'Test Instructor',
      avatar: 'avatar.jpg'
    }
  } as any;

  it('should generate HTML with course info', () => {
    const html = generateCourseHtml(mockCourse);
    expect(html).toContain('Test Course');
    expect(html).toContain('Test Description');
    expect(html).toContain('Test Instructor');
    expect(html).toContain('Test Category');
  });

  it('should respect dark mode flag', () => {
    const lightHtml = generateCourseHtml(mockCourse, false);
    const darkHtml = generateCourseHtml(mockCourse, true);
    
    // Light mode background
    expect(lightHtml).toContain('--background: #f8fafc');
    // Dark mode background
    expect(darkHtml).toContain('--background: #0F172A');
  });
});
