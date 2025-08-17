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
            if (!this.accessToken) {
                this.loadFromStorage();
            }
            if (this.accessToken) {
                api.setToken(this.accessToken);
                try {
                    await api.get('/wheel-sets');
                    return;
                } catch {
                    // token 失效，继续走注册/登录
                }
            }

            const deviceId = getOrCreateDeviceId();
            const email = `device-${deviceId}@local.dev`;
            const password = `p-${deviceId}`;
            try {
                const reg = await api.post<{ accessToken: string; refreshToken: string; user: { id: string; email: string } }>(
                    '/auth/register',
                    { email, password },
                );
                this.accessToken = reg.accessToken;
                this.refreshToken = reg.refreshToken;
                this.user = reg.user;
                api.setToken(this.accessToken);
                this.saveToStorage();
                return;
            } catch {
                // 已注册则登录
            }
            const login = await api.post<{ accessToken: string; refreshToken: string; user: { id: string; email: string } }>(
                '/auth/login',
                { email, password },
            );
            this.accessToken = login.accessToken;
            this.refreshToken = login.refreshToken;
            this.user = login.user;
            api.setToken(this.accessToken);
            this.saveToStorage();
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


