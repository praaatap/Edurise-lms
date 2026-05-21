// ─── User & Auth ──────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: { url: string; localPath: string } | string;
  role: UserRole;
  isEmailVerified: boolean;
  // Name fields (from backend)
  firstName?: string;
  lastName?: string;
  level?: number;
  xp?: number;
  badges?: string[];
  // LMS extensions
  schoolId?: string;
  schoolSlug?: string;
  schoolName?: string;
  bio?: string;
  phone?: string;
  // Predictive Analytics
  riskScore?: number;
  lastActive?: string;
  // Stats (from backend /users/me)
  stats?: {
    coursesEnrolled: number;
    coursesCompleted: number;
    bookmarksCount: number;
    avgProgress: number;
  };
}

// ─── School ───────────────────────────────────────────────────────────────────

export type SchoolPlan = 'free' | 'pro' | 'enterprise';

export interface ParentOrganization {
  _id: string;
  name: string;
  adminId: string;
  schoolIds: string[];
}

export interface School {
  // Backend fields (id-based)
  id: string;
  // Legacy alias (kept for backward compatibility with existing screen code)
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  // Legacy alias
  logo?: string;
  joinCode?: string;
  ownerId?: string;
  // Legacy fields
  plan?: SchoolPlan;
  adminId?: string;
  coverImage?: string;
  teacherCount?: number;
  studentCount?: number;
  courseCount?: number;
  rating?: number;
  category?: string;
  isVerified?: boolean;
  createdAt?: string;
  contactEmail?: string;
  website?: string;
  branding?: {
    primaryColor?: string;
    fontFamily?: string;
    borderRadius?: number;
    icon?: string;
  };
  parentId?: string;
}

// ─── Instructor ───────────────────────────────────────────────────────────────

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  location: string;
  email: string;
  role?: string;
  bio?: string;
  coursesCount?: number;
  studentsCount?: number;
  rating?: number;
}

// ─── Lesson ───────────────────────────────────────────────────────────────────

export type LessonType = 'video' | 'text' | 'quiz';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface Lesson {
  _id: string;
  courseId: string;
  title: string;
  type: LessonType;
  order: number;
  duration?: number; // minutes
  // Video
  videoUrl?: string;
  // Text
  content?: string;
  // Quiz
  questions?: QuizQuestion[];
  isPreview?: boolean;
  isCompleted?: boolean;
}

// ─── Course ───────────────────────────────────────────────────────────────────

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;          // 0 = free
  thumbnail: string;
  category: string;
  rating: number;
  level: CourseLevel;
  instructor: Instructor;
  isBookmarked: boolean;
  isEnrolled: boolean;
  tags: string[];
  lessonsCount?: number;
  reviewsCount?: number;
  progress?: number;
  // LMS extensions
  schoolId?: string;
  schoolSlug?: string;
  status?: CourseStatus;
  enrolledCount?: number;
  completedCount?: number;
  lessons?: Lesson[];
  requirements?: string[];
  whatYouLearn?: string[];
  language?: string;
  certificate?: boolean;
  lastUpdated?: string;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score?: number;         // For quizzes
  completedAt?: string;
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  completedLessons: LessonProgress[];
  overallProgress: number; // 0-100
  lastAccessedLessonId?: string;
  startedAt: string;
  completedAt?: string;
  certificateIssued?: boolean;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface Order {
  _id: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentGatewayOrderId?: string;
  createdAt: string;
}

// ─── Admin Analytics ──────────────────────────────────────────────────────────

export interface SchoolAnalytics {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeEnrollments: number;
  completionRate: number;
  enrollmentsOverTime: { date: string; count: number }[];
  topCourses: { courseId: string; title: string; enrollments: number }[];
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'new_lesson'
  | 'enrollment_confirmed'
  | 'certificate_ready'
  | 'quiz_due'
  | 'announcement'
  | 'payment_success'
  | 'teacher_invitation';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, string>;
}
