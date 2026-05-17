import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context';
import { api } from '../services/api';
import { BookOpen, Users, ClipboardList, Shield, ArrowRight, Library } from 'lucide-react';

export function HomePage() {
    const { user, can } = useAuth();
    const [s, setS] = useState({books:0, students:0, active:0, overdue:0});

    useEffect(() => {
        api.books.list().then(b => setS(prev => ({...prev, books:b.length}))).catch(() => {});
        if (can('admin','librarian','teacher')) {
            api.students.list().then(st => setS(prev => ({...prev, students:st.length}))).catch(() => {});
            api.loans.list().then(loans => {
                const now = new Date();
                setS(prev => ({...prev,
                    active: loans.filter((l:any) => !l.returned_at).length,
                    overdue: loans.filter((l:any) => !l.returned_at && new Date(l.due_at)<now).length
                }));
            }).catch(() => {});
        }
    }, []);

    return (
        <div>
            <div className="hero">
                <p className="hero-eyebrow">Добре дошли, {user?.full_name}</p>
                <h1>Училищна библиотека</h1>
                <p>Преглеждайте каталога, управлявайте ученици и следете заеманията.</p>
                <div style={{display:'flex',gap:10,marginTop:'1rem',flexWrap:'wrap'}}>
                    <Link to="/books" className="btn-accent"><ArrowRight size={16}/> Към каталога</Link>
                    {can('admin','librarian') && <Link to="/loans" className="btn-outline">Заемания</Link>}
                    {(can('student')||can('teacher')) && <Link to="/my-loans" className="btn-outline">{can('student')?'Моите заемания':'Виж заемания'}</Link>}
                </div>
            </div>
            <div className="stats">
                <div className="stat"><div className="stat-label">Книги</div><div className="stat-value">{s.books}</div></div>
                {can('admin','librarian','teacher') && <>
                    <div className="stat"><div className="stat-label">Ученици</div><div className="stat-value">{s.students}</div></div>
                    <div className="stat"><div className="stat-label">Активни</div><div className="stat-value">{s.active}</div></div>
                    <div className="stat"><div className="stat-label">Просрочени</div><div className="stat-value">{s.overdue}</div></div>
                </>}
            </div>
            <div className="shortcuts">
                <Link to="/books" className="shortcut"><div className="shortcut-title"><BookOpen size={18}/> Каталог</div><div className="shortcut-desc">Преглед на книги.</div></Link>
                {(can('student')||can('teacher')) && <Link to="/my-loans" className="shortcut"><div className="shortcut-title"><Library size={18}/> {can('student')?'Моите заемания':'Заемания'}</div><div className="shortcut-desc">{can('student')?'Вижте заетите книги.':'Преглед на заеманията.'}</div></Link>}
                {can('admin','librarian') && <>
                    <Link to="/students" className="shortcut"><div className="shortcut-title"><Users size={18}/> Ученици</div><div className="shortcut-desc">Списък на ученици.</div></Link>
                    <Link to="/loans" className="shortcut"><div className="shortcut-title"><ClipboardList size={18}/> Заемания</div><div className="shortcut-desc">Издаване и връщане.</div></Link>
                </>}
                {can('admin') && <Link to="/users" className="shortcut"><div className="shortcut-title"><Shield size={18}/> Акаунти</div><div className="shortcut-desc">Управление на акаунти.</div></Link>}
            </div>
        </div>
    );
}
