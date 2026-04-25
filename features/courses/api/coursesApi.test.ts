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

  it('should fetch instructors', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ 
      data: { data: { data: [{ login: { uuid: '1' } }] } } 
    });
    
    const res = await coursesApi.fetchInstructors();
    
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/public/randomusers?limit=20');
    expect(res[0].login.uuid).toBe('1');
  });

  it('should fetch products', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ 
      data: { data: { data: [{ id: '1', price: 10 }] } } 
    });
    
    const res = await coursesApi.fetchProducts();
    
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/public/randomproducts?limit=20');
    expect(res[0].id).toBe('1');
  });

  it('should merge courses correctly', () => {
    const mockInstructors = [
      {
        login: { uuid: 'inst1' },
        name: { first: 'John', last: 'Doe' },
        location: { city: 'NY', country: 'US' },
        email: 'john@example.com',
        picture: { large: 'avatar.jpg' }
      }
    ];

    const mockProducts = [
      { id: 'prod1', price: 29.99 }
    ];

    const merged = coursesApi.mergeCourses(mockInstructors, mockProducts);
    
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('prod1');
    expect(merged[0].instructor.name).toBe('John Doe');
    expect(merged[0].price).toBe(29.99);
    expect(merged[0].level).toBe('Beginner');
  });
});
