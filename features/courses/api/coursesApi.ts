import { apiClient } from '@/core/api/client';
import { Course, CourseLevel, Instructor } from '@/shared/types';

// Curated high-quality tech-related Unsplash IDs
const COURSE_IMAGES = [
  'https://picsum.photos/seed/course1/1000/600',
  'https://picsum.photos/seed/course2/1000/600',
  'https://picsum.photos/seed/course3/1000/600',
  'https://picsum.photos/seed/course4/1000/600',
  'https://picsum.photos/seed/course5/1000/600',
  'https://picsum.photos/seed/course6/1000/600',
  'https://picsum.photos/seed/course7/1000/600',
  'https://picsum.photos/seed/course8/1000/600',
  'https://picsum.photos/seed/course9/1000/600',
  'https://picsum.photos/seed/course10/1000/600',
];

const TECH_TOPICS = [
  'React Native & Expo Mastery',
  'Advanced Next.js Systems',
  'Generative AI for Engineers',
  'AWS Cloud Architect Training',
  'Full-Stack Node.js Patterns',
  'Ethical Hacking & Security',
  'Data Analytics with Python',
  'Modern UI/UX Design Trends',
  'DevOps & CI/CD Pipelines',
  'Rust for Systems Programming'
];

const TECH_CATEGORIES = [
  'Web Dev', 'Mobile App', 'AI & ML', 'Cloud Computing', 'Cybersecurity', 'Data Science'
];

const LEVEL_SEQUENCE: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

export const coursesApi = {
  fetchInstructors: async () => {
    const response = await apiClient.get('/api/v1/public/randomusers?limit=20');
    return response.data.data.data;
  },

  fetchProducts: async () => {
    const response = await apiClient.get('/api/v1/public/randomproducts?limit=20');
    return response.data.data.data;
  },

  mergeCourses: (instructorsData: any[], productsData: any[]): Course[] => {
    return productsData.map((product, index) => {
      // Pair with an instructor
      const instructorRaw = instructorsData[index % instructorsData.length];

      // Give them a tech-focused role
      const techRoles = ['Principal Engineer', 'Tech Lead', 'Security Expert', 'AI Scientist', 'UX Director', 'Cloud Architect'];

      // pravatar.cc gives real human faces instantly with no loading issues
      const seed = (index + 1) * 7 + 10; // gives IDs like 17, 24, 31... all valid pravatar IDs
      const avatarUrl = `https://i.pravatar.cc/400?img=${seed}`;

      const instructor: Instructor = {
        id: instructorRaw.login.uuid || `inst_${index}`,
        name: `${instructorRaw.name.first} ${instructorRaw.name.last}`,
        avatar: avatarUrl,
        location: `${instructorRaw.location.city}, ${instructorRaw.location.country}`,
        email: instructorRaw.email,
        role: techRoles[index % techRoles.length],
      };

      const price = product.price ?? 49.99;
      const level: CourseLevel =
        price < 30 ? 'Beginner' : price < 60 ? 'Intermediate' : 'Advanced';

      // Re-theme titles to be Tech focused instead of random product names
      const category = TECH_CATEGORIES[index % TECH_CATEGORIES.length];
      const title = TECH_TOPICS[index % TECH_TOPICS.length];

      const thumbnail = COURSE_IMAGES[index % COURSE_IMAGES.length];

      return {
        id: product.id.toString(),
        title,
        description: `Master the core concepts of ${title} with industry-leading experts. This course covers everything from fundamentals to advanced production patterns.`,
        price: parseFloat(price.toFixed(2)),
        thumbnail,
        category,
        rating: 4.5 + Math.random() * 0.5, // High quality ratings
        level,
        instructor,
        isBookmarked: false,
        isEnrolled: false,
        tags: [category, 'Technology', 'Professional'],
        lessonsCount: LEVEL_SEQUENCE.indexOf(level) * 4 + 10,
        reviewsCount: Math.floor(Math.random() * 500) + 100,
      };
    });
  }
};
