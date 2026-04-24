import { apiClient } from '@/core/api/client';
import { Course, Instructor } from '@/shared/types';

export const coursesApi = {
  fetchInstructors: async () => {
    const response = await apiClient.get('/api/v1/public/randomusers?limit=100');
    return response.data.data.data; // freeapi structure usually nests in data.data for lists
  },

  fetchProducts: async () => {
    const response = await apiClient.get('/api/v1/public/randomproducts?limit=100');
    return response.data.data.data;
  },

  mergeCourses: (instructorsData: any[], productsData: any[]): Course[] => {
    return productsData.map((product, index) => {
      // Pair with an instructor, wrap around if needed
      const instructorRaw = instructorsData[index % instructorsData.length];
      
      const instructor: Instructor = {
        id: instructorRaw.login.uuid || `inst_${index}`,
        name: `${instructorRaw.name.first} ${instructorRaw.name.last}`,
        avatar: instructorRaw.picture.large,
        location: `${instructorRaw.location.city}, ${instructorRaw.location.country}`,
        email: instructorRaw.email,
      };

      return {
        id: product.id.toString(), // stable ID
        title: product.title,
        description: product.description,
        price: product.price,
        thumbnail: product.thumbnail,
        category: product.category,
        rating: product.rating,
        instructor,
        isBookmarked: false,
        isEnrolled: false,
        tags: product.tags || [],
      };
    });
  }
};
