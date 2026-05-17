import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Role = 'admin' | 'librarian' | 'teacher' | 'student';
interface User { id: string; username: string; full_name: string; role: Role; }
interface AuthState { user: User | null; token: string | null; loading: boolean; login: (u: string, p: string) => Promise<string | null>; logout: () => void; can: (...r: Role[]) => boolean; }
interface ThemeState { dark: boolean; toggle: () => void; }

const AuthCtx = createContext<AuthState>({} as AuthState);
const ThemeCtx = createContext<ThemeState>({ dark: false, toggle: () => {} });
export const useAuth = () => useContext(AuthCtx);
export const useTheme = () => useContext(ThemeCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) { setLoading(false); return; }
        fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(json => setUser(json.data))
            .catch(() => { setToken(null); localStorage.removeItem('token'); })
            .finally(() => setLoading(false));
    }, [token]);

    async function login(username: string, password: string) {
        try {
            const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
            const json = await res.json();
            if (!res.ok) return json.message || 'Login failed';
            localStorage.setItem('token', json.data.token);
            setToken(json.data.token);
            setUser(json.data.user);
            return null;
        } catch { return 'Server not available'; }
    }

    function logout() { setUser(null); setToken(null); localStorage.removeItem('token'); }
    function can(...roles: Role[]) { return user !== null && roles.includes(user.role); }

    return <AuthCtx.Provider value={{ user, token, loading, login, logout, can }}>{children}</AuthCtx.Provider>;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    }, [dark]);
    return <ThemeCtx.Provider value={{ dark, toggle: () => setDark(!dark) }}>{children}</ThemeCtx.Provider>;
}
