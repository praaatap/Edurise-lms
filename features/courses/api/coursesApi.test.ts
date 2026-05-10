import { coursesApi } from './coursesApi';
import { apiClient } from '@/core/api/client';

jest.mock('@/core/api/client', () => ({
  apiClient: {
    get: jest.fn(),
  }
}));

describe('Courses API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch courses from backend', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 'course-1',
            title: 'Test Course',
            description: 'A test course',
            price: '49.99',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            category: 'Web Dev',
            difficulty: 'BEGINNER',
            rating: 4.5,
            totalLessons: 10,
            instructorName: 'John Doe',
          }
        ],
      }
    });

    const courses = await coursesApi.fetchCourses();

    expect(apiClient.get).toHaveBeenCalledWith('/courses', { params: { limit: 50 } });
    expect(courses).toHaveLength(1);
    expect(courses[0].id).toBe('course-1');
    expect(courses[0].title).toBe('Test Course');
    expect(courses[0].price).toBe(49.99);
    expect(courses[0].level).toBe('Beginner');
  });

  it('should handle empty courses response', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: [] }
    });

    const courses = await coursesApi.fetchCourses();
    expect(courses).toHaveLength(0);
  });

  it('should return empty arrays from legacy mock methods', async () => {
    const instructors = await coursesApi.fetchInstructors();
    const products = await coursesApi.fetchProducts();
    const merged = coursesApi.mergeCourses([], []);

    expect(instructors).toHaveLength(0);
    expect(products).toHaveLength(0);
    expect(merged).toHaveLength(0);
  });
});
