import { create } from 'zustand';
import { Lesson, LessonType, QuizQuestion } from '@/shared/types';

interface LessonDraft extends Omit<Lesson, '_id' | 'courseId'> {
  tempId: string; // local-only ID before saving
}

interface LessonState {
  draftLessons: LessonDraft[];
  editingLessonId: string | null;

  // Actions
  addLesson: (type: LessonType) => void;
  updateLesson: (tempId: string, updates: Partial<LessonDraft>) => void;
  removeLesson: (tempId: string) => void;
  reorderLessons: (from: number, to: number) => void;
  setEditingLesson: (tempId: string | null) => void;
  addQuizQuestion: (tempId: string, question: QuizQuestion) => void;
  updateQuizQuestion: (tempId: string, questionId: string, updates: Partial<QuizQuestion>) => void;
  removeQuizQuestion: (tempId: string, questionId: string) => void;
  clearDraftLessons: () => void;
  getLessonsSorted: () => LessonDraft[];
}

function generateTempId(): string {
  return `lesson_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  draftLessons: [],
  editingLessonId: null,

  addLesson: (type) => {
    const tempId = generateTempId();
    const order = get().draftLessons.length + 1;
    const newLesson: LessonDraft = {
      tempId,
      title: `Lesson ${order}`,
      type,
      order,
      isPreview: false,
      ...(type === 'quiz' ? { questions: [] } : {}),
    };
    set((state) => ({
      draftLessons: [...state.draftLessons, newLesson],
      editingLessonId: tempId,
    }));
  },

  updateLesson: (tempId, updates) => {
    set((state) => ({
      draftLessons: state.draftLessons.map((l) =>
        l.tempId === tempId ? { ...l, ...updates } : l
      ),
    }));
  },

  removeLesson: (tempId) => {
    set((state) => ({
      draftLessons: state.draftLessons
        .filter((l) => l.tempId !== tempId)
        .map((l, i) => ({ ...l, order: i + 1 })),
      editingLessonId: state.editingLessonId === tempId ? null : state.editingLessonId,
    }));
  },

  reorderLessons: (from, to) => {
    set((state) => {
      const lessons = [...state.draftLessons];
      const [moved] = lessons.splice(from, 1);
      lessons.splice(to, 0, moved);
      return {
        draftLessons: lessons.map((l, i) => ({ ...l, order: i + 1 })),
      };
    });
  },

  setEditingLesson: (tempId) => set({ editingLessonId: tempId }),

  addQuizQuestion: (tempId, question) => {
    set((state) => ({
      draftLessons: state.draftLessons.map((l) =>
        l.tempId === tempId
          ? {
              ...l,
              questions: [
                ...(l.questions ?? []),
                { ...question, id: generateQuestionId() },
              ],
            }
          : l
      ),
    }));
  },

  updateQuizQuestion: (tempId, questionId, updates) => {
    set((state) => ({
      draftLessons: state.draftLessons.map((l) =>
        l.tempId === tempId
          ? {
              ...l,
              questions: (l.questions ?? []).map((q) =>
                q.id === questionId ? { ...q, ...updates } : q
              ),
            }
          : l
      ),
    }));
  },

  removeQuizQuestion: (tempId, questionId) => {
    set((state) => ({
      draftLessons: state.draftLessons.map((l) =>
        l.tempId === tempId
          ? { ...l, questions: (l.questions ?? []).filter((q) => q.id !== questionId) }
          : l
      ),
    }));
  },

  clearDraftLessons: () => set({ draftLessons: [], editingLessonId: null }),

  getLessonsSorted: () => {
    return [...get().draftLessons].sort((a, b) => a.order - b.order);
  },
}));
