let TOKEN: string | null = null;

export function setToken(token: string | null) {
    TOKEN = token;
}

export function getApiBase(): string {
    const base = (import.meta as any)?.env?.VITE_API_BASE as string | undefined;
    return (base && base.replace(/\/$/, '')) || 'http://localhost:3001/api/v1';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string> | undefined),
    };
    if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
    const resp = await fetch(`${getApiBase()}${path}`, { ...init, headers });
    if (!resp.ok) {
        let msg = `${resp.status} ${resp.statusText}`;
        try {
            const data = await resp.json();
            msg = data?.message || msg;
        } catch { }
        throw new Error(msg);
    }
    if (resp.status === 204) return undefined as unknown as T;
    return (await resp.json()) as T;
}

export const api = {
    setToken,
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};


