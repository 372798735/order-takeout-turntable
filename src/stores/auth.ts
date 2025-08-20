import { defineStore } from 'pinia';
import { api } from '@/api/client';

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: { id: string; email: string } | null;
}

const AUTH_KEY = 'turntable-auth';
const DEVICE_KEY = 'turntable-device-id';

function getOrCreateDeviceId(): string {
    try {
        let id = localStorage.getItem(DEVICE_KEY);
        if (!id) {
            id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            localStorage.setItem(DEVICE_KEY, id);
        }
        return id;
    } catch {
        return `${Date.now()}`;
    }
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        accessToken: null,
        refreshToken: null,
        user: null,
    }),
    actions: {
        phoneToEmail(phone: string): string {
            return `${phone}@phone.local`;
        },
        setAuth(data: { accessToken: string; refreshToken: string; user: { id: string; email: string } }) {
            this.accessToken = data.accessToken;
            this.refreshToken = data.refreshToken;
            this.user = data.user;
            api.setToken(this.accessToken);
            this.saveToStorage();
        },
        async registerWithPhone(phone: string, password: string) {
            const email = this.phoneToEmail(phone);
            const res = await api.post<{ accessToken: string; refreshToken: string; user: { id: string; email: string } }>(
                '/auth/register',
                { email, password },
            );
            this.setAuth(res);
        },
        async loginWithPhone(phone: string, password: string) {
            const email = this.phoneToEmail(phone);
            const res = await api.post<{ accessToken: string; refreshToken: string; user: { id: string; email: string } }>(
                '/auth/login',
                { email, password },
            );
            this.setAuth(res);
        },
        loadFromStorage() {
            try {
                const raw = localStorage.getItem(AUTH_KEY);
                if (raw) {
                    const data: AuthState = JSON.parse(raw);
                    this.accessToken = data.accessToken;
                    this.refreshToken = data.refreshToken;
                    this.user = data.user;
                    api.setToken(this.accessToken);
                }
            } catch { }
        },
        saveToStorage() {
            try {
                localStorage.setItem(
                    AUTH_KEY,
                    JSON.stringify({ accessToken: this.accessToken, refreshToken: this.refreshToken, user: this.user }),
                );
            } catch { }
        },
        async ensureAuth() {
            if (!this.accessToken) this.loadFromStorage();
            if (!this.accessToken) return;
            api.setToken(this.accessToken);
            try {
                await api.get('/wheel-sets');
            } catch {
                this.logout();
            }
        },
        logout() {
            this.accessToken = null;
            this.refreshToken = null;
            this.user = null;
            api.setToken(null);
            try { localStorage.removeItem(AUTH_KEY); } catch { }
        },
    },
});


