export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  location: string;
  email: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  category: string;
  rating: number;
  instructor: Instructor;
  isBookmarked: boolean;
  isEnrolled: boolean;
  tags: string[];
  lessonsCount?: number;
  reviewsCount?: number;
  progress?: number;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: { url: string; localPath: string };
  role: string;
  isEmailVerified: boolean;
}
