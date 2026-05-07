import { create } from 'zustand';
import { SchoolAnalytics } from '@/shared/types';
import { schoolApi } from '@/features/school/api/schoolApi';

// Backend user shape from /schools/:id/members
interface MemberUser {
  id: string;
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: string;
  enrollmentsCount: number;
}

interface AdminState {
  analytics: SchoolAnalytics | null;
  teachers: MemberUser[];
  students: MemberUser[];
  isLoading: boolean;
  error: string | null;
  inviteEmail: string;
  pendingInvites: string[];

  loadDashboard: (schoolId: string) => Promise<void>;
  refreshTeachers: (schoolId: string) => Promise<void>;
  refreshStudents: (schoolId: string) => Promise<void>;
  sendInvite: (schoolId: string, email: string) => Promise<void>;
  kickTeacher: (schoolId: string, teacherId: string) => Promise<void>;
  kickStudent: (schoolId: string, studentId: string) => Promise<void>;
  setInviteEmail: (email: string) => void;
  clearError: () => void;
}

function mapMember(raw: any): MemberUser {
  return {
    id: raw.id,
    _id: raw.id,
    username: raw.username ?? `${raw.firstName ?? ''} ${raw.lastName ?? ''}`.trim(),
    firstName: raw.firstName ?? '',
    lastName: raw.lastName ?? '',
    email: raw.email,
    avatarUrl: raw.avatarUrl,
    role: raw.role,
    enrollmentsCount: raw._count?.enrollments ?? 0,
  };
}

function mapAnalytics(raw: any): SchoolAnalytics {
  return {
    totalStudents: raw.totalStudents ?? 0,
    totalTeachers: raw.totalTeachers ?? 0,
    totalCourses: raw.totalCourses ?? 0,
    totalRevenue: raw.totalRevenue ?? 0,
    monthlyRevenue: raw.monthlyRevenue ?? 0,
    activeEnrollments: raw.activeEnrollments ?? 0,
    completionRate: raw.completionRate ?? 0,
    enrollmentsOverTime: raw.enrollmentsOverTime ?? [],
    topCourses: raw.topCourses ?? [],
  };
}

export const useAdminStore = create<AdminState>((set, get) => ({
  analytics: null,
  teachers: [],
  students: [],
  isLoading: false,
  error: null,
  inviteEmail: '',
  pendingInvites: [],

  loadDashboard: async (schoolId) => {
    set({ isLoading: true, error: null });
    try {
      const [analyticsRes, teachersRes, studentsRes] = await Promise.allSettled([
        schoolApi.getAnalytics(schoolId),
        schoolApi.getTeachers(schoolId),
        schoolApi.getStudents(schoolId),
      ]);

      set({
        analytics: analyticsRes.status === 'fulfilled' && analyticsRes.value.success
          ? mapAnalytics(analyticsRes.value.data)
          : null,
        teachers: teachersRes.status === 'fulfilled' && teachersRes.value.success
          ? (teachersRes.value.data.members ?? []).map(mapMember)
          : [],
        students: studentsRes.status === 'fulfilled' && studentsRes.value.success
          ? (studentsRes.value.data.members ?? []).map(mapMember)
          : [],
        isLoading: false,
      });
    } catch {
      set({ error: 'Failed to load dashboard', isLoading: false });
    }
  },

  refreshTeachers: async (schoolId) => {
    try {
      const res = await schoolApi.getTeachers(schoolId);
      if (res.success) {
        set({ teachers: (res.data.members ?? []).map(mapMember) });
      }
    } catch {
      set({ error: 'Failed to load teachers' });
    }
  },

  refreshStudents: async (schoolId) => {
    try {
      const res = await schoolApi.getStudents(schoolId);
      if (res.success) {
        set({ students: (res.data.members ?? []).map(mapMember) });
      }
    } catch {
      set({ error: 'Failed to load students' });
    }
  },

  sendInvite: async (schoolId, email) => {
    set({ isLoading: true, error: null });
    try {
      await schoolApi.inviteTeacher(schoolId, email);
      set((state) => ({
        pendingInvites: [...state.pendingInvites, email],
        inviteEmail: '',
        isLoading: false,
      }));
      await get().refreshTeachers(schoolId);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to send invitation';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  kickTeacher: async (schoolId, teacherId) => {
    try {
      await schoolApi.removeTeacher(schoolId, teacherId);
      set((state) => ({
        teachers: state.teachers.filter((t) => t.id !== teacherId),
      }));
    } catch {
      set({ error: 'Failed to remove teacher' });
    }
  },

  kickStudent: async (schoolId, studentId) => {
    try {
      await schoolApi.removeStudent(schoolId, studentId);
      set((state) => ({
        students: state.students.filter((s) => s.id !== studentId),
      }));
    } catch {
      set({ error: 'Failed to remove student' });
    }
  },

  setInviteEmail: (email) => set({ inviteEmail: email }),
  clearError: () => set({ error: null }),
}));
