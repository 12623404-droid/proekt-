import { BrowserRouter, Routes, Route, Navigate, Outlet, NavLink } from 'react-router';
import { AuthProvider, useAuth, useTheme, ThemeProvider } from './context';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { BooksPage } from './pages/BooksPage';
import { StudentsPage } from './pages/StudentsPage';
import { LoansPage } from './pages/LoansPage';
import { UsersPage } from './pages/UsersPage';
import { MyLoansPage } from './pages/MyLoansPage';
import { BookOpen, Home, Users, ClipboardList, Shield, Sun, Moon, LogOut, Library } from 'lucide-react';
import './index.css';

const roleNames: Record<string, string> = { admin: 'Админ', librarian: 'Библиотекар', teacher: 'Учител', student: 'Ученик' };

function Layout() {
    const { user, logout, can } = useAuth();
    const { dark, toggle } = useTheme();

    return (
        <>
            <header className="header">
                <div className="header-inner">
                    <NavLink to="/" className="logo">
                        <BookOpen size={22} />
                        <span className="logo-name">Училищна библиотека</span>
                    </NavLink>
                    <nav>
                        <NavLink to="/" end><Home size={15} /> Начало</NavLink>
                        <NavLink to="/books"><BookOpen size={15} /> Книги</NavLink>
                        {(can('student') || can('teacher')) &&
                            <NavLink to="/my-loans"><Library size={15} /> {can('student') ? 'Моите заемания' : 'Заемания'}</NavLink>
                        }
                        {can('admin', 'librarian') && <NavLink to="/students"><Users size={15} /> Ученици</NavLink>}
                        {can('admin', 'librarian') && <NavLink to="/loans"><ClipboardList size={15} /> Заемания</NavLink>}
                        {can('admin') && <NavLink to="/users"><Shield size={15} /> Акаунти</NavLink>}
                    </nav>
                    <div className="header-right">
                        <button className="btn-theme" onClick={toggle}>{dark ? <Sun size={16}/> : <Moon size={16}/>}</button>
                        <div className="user-badge">
                            <strong>{user?.full_name}</strong>
                            <span className={'role-badge role-' + user?.role}>{roleNames[user?.role || '']}</span>
                            <button className="btn-logout" onClick={logout}><LogOut size={14}/> Изход</button>
                        </div>
                    </div>
                </div>
            </header>
            <main><Outlet /></main>
        </>
    );
}

function RequireAuth() {
    const { user, token, loading } = useAuth();
    if (loading) return <div className="empty">Зареждане...</div>;
    if (!token || !user) return <Navigate to="/login" />;
    return <Outlet />;
}

function RequireRole({ roles }: { roles: string[] }) {
    const { user } = useAuth();
    if (!user || !roles.includes(user.role)) return <Navigate to="/" />;
    return <Outlet />;
}

function LoginGuard() {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (user) return <Navigate to="/" />;
    return <LoginPage />;
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginGuard />} />
                        <Route element={<RequireAuth />}>
                            <Route element={<Layout />}>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/books" element={<BooksPage />} />
                                <Route path="/my-loans" element={<MyLoansPage />} />
                                <Route element={<RequireRole roles={['admin', 'librarian']} />}>
                                    <Route path="/students" element={<StudentsPage />} />
                                    <Route path="/loans" element={<LoansPage />} />
                                </Route>
                                <Route element={<RequireRole roles={['admin']} />}>
                                    <Route path="/users" element={<UsersPage />} />
                                </Route>
                                <Route path="*" element={<Navigate to="/" />} />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}
