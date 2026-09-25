import { create } from 'zustand';

/**
 * UniMind Auth Store (Zustand)
 * Quản lý trạng thái xác thực cho 3 vai trò: Student, Expert, Admin
 */

const TOKEN_KEY = 'unimind_token';
const USER_KEY  = 'unimind_user';

function loadFromStorage() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw   = localStorage.getItem(USER_KEY);
    const user  = raw ? JSON.parse(raw) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

const { token: initToken, user: initUser } = loadFromStorage();

export const useAuthStore = create((set, get) => ({
  user:    initUser,
  token:   initToken,
  isLoading: false,

  get isLoggedIn() { return !!get().token && !!get().user; },
  get role()       { return get().user?.role ?? null; },
  get isStudent()  { return get().user?.role === 'Student'; },
  get isExpert()   { return get().user?.role === 'Expert'; },
  get isAdmin()    { return get().user?.role === 'Admin'; },

  setAuth: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, token });
  },

  updateUser: (partial) => {
    const next = { ...get().user, ...partial };
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    set({ user: next });
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null });
  },

  setLoading: (v) => set({ isLoading: v }),
}));

/** Lấy role-based redirect path */
export function getDefaultPathByRole(role) {
  if (role === 'Admin')   return '/admin/dashboard';
  if (role === 'Expert')  return '/expert/workspace';
  return '/student/home';
}
