import { defineStore } from 'pinia';

interface AppPrefs {
  theme: 'light' | 'dark' | 'system';
}

export const useAppStore = defineStore('app', {
  state: (): AppPrefs => ({
    theme: 'light',
  }),
  actions: {
    setTheme(t: AppPrefs['theme']) {
      this.theme = t;
    },
  },
}); 