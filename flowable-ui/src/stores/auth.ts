import { defineStore } from "pinia";
import { loadAuth, setAuth, clearAuth, isAuthed, api } from "@/api/client";
import type { User } from "@/types";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    loading: false,
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
  },
  actions: {
    async initialize() {
      if (this.initialized) return;
      this.initialized = true;
      loadAuth();
      if (!isAuthed()) return;
      try {
        const data = await api<{ data: User[] }>("/identity/users?size=1");
        if (data.data && data.data.length > 0) {
          this.user = data.data[0];
        }
      } catch {
        clearAuth();
        this.user = null;
      }
    },
    async signIn(username: string, password: string) {
      this.loading = true;
      try {
        setAuth(username, password);
        const data = await api<{ data: User[] }>("/identity/users?size=1");
        if (data.data && data.data.length > 0) {
          this.user = data.data[0];
        } else {
          this.user = { id: username, firstName: username, lastName: "", displayName: username, email: "" };
        }
      } catch (e) {
        clearAuth();
        throw e;
      } finally {
        this.loading = false;
      }
    },
    signOut() {
      clearAuth();
      this.user = null;
      this.initialized = false;
    },
  },
});
