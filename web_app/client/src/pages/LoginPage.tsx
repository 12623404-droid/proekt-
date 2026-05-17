import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth, useTheme } from '../context';
import { BookOpen, Sun, Moon } from 'lucide-react';

export function LoginPage() {
    const { login } = useAuth();
    const { dark, toggle } = useTheme();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError('');
        const err = await login(username, password);
        setBusy(false);
        if (err) setError(err);
        else navigate('/');
    }

    return (
        <div className="login-page">
            <form className="login-box" onSubmit={handleSubmit}>
                <button type="button" className="btn-theme" onClick={toggle} style={{ position: 'absolute', top: 16, right: 16 }}>
                    {dark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <BookOpen size={36} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                <h1>Училищна библиотека</h1>
                <p>Влезте в системата</p>
                {error && <div className="login-error">{error}</div>}
                <input className="inp" placeholder="Потребителско име" value={username} onChange={e => setUsername(e.target.value)} />
                <input className="inp" placeholder="Парола" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                <button className="btn" type="submit" disabled={!username || !password || busy}>
                    {busy ? 'Влизане...' : 'Вход'}
                </button>
            </form>
        </div>
    );
}
