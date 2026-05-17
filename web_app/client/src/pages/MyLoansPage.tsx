import { useEffect, useState } from 'react';
import { useAuth } from '../context';
import { api } from '../services/api';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('bg');

export function MyLoansPage() {
    const { user, can } = useAuth();
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const isTeacher = can('teacher');

    useEffect(() => {
        async function load() {
            try {
                if (isTeacher) { setLoans(await api.loans.list()); }
                else {
                    const allStudents = await api.students.list().catch(() => []);
                    const me = allStudents.find((s: any) => s.user_id === user?.id);
                    if (me) { const all = await api.loans.list().catch(() => []); setLoans(all.filter((l: any) => l.student_id === me.id)); }
                }
            } catch {}
            setLoading(false);
        }
        load();
    }, []);

    const now = new Date();
    return (
        <div>
            <div className="page-head">
                <h1>{isTeacher ? 'Заемания на ученици' : 'Моите заемания'}</h1>
                <p>{isTeacher ? 'Преглед на всички заемания.' : 'Книгите, които имате заети.'}</p>
            </div>
            {loading ? <div className="empty">Зареждане...</div> :
            <div className="list">
                {loans.length===0 && <div className="empty">{isTeacher ? 'Няма заемания.' : 'Нямате заети книги.'}</div>}
                {loans.map(l => {
                    const overdue = !l.returned_at && new Date(l.due_at) < now;
                    const cls = l.returned_at ? 'returned' : overdue ? 'overdue' : 'active';
                    return <div key={l.id} className="item">
                        <div className={'loan-dot '+cls}>{l.returned_at?<CheckCircle size={18}/>:overdue?<AlertTriangle size={18}/>:<Clock size={18}/>}</div>
                        <div className="item-body">
                            <div className="item-title">{l.book_title}</div>
                            <div className="item-sub">{isTeacher && l.student_name+' · '+l.student_grade+' · '}{fmtDate(l.borrowed_at)} → {fmtDate(l.due_at)}{l.returned_at && ' · върната '+fmtDate(l.returned_at)}</div>
                        </div>
                    </div>;
                })}
            </div>}
        </div>
    );
}
