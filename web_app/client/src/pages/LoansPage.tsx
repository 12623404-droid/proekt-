import { useEffect, useState } from 'react';
import { useAuth } from '../context';
import { api } from '../services/api';
import { Clock, AlertTriangle, CheckCircle, RotateCcw, Trash2, Plus } from 'lucide-react';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('bg');

export function LoansPage() {
    const { can } = useAuth();
    const [loans, setLoans] = useState<any[]>([]);
    const [books, setBooks] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [form, setForm] = useState({book_id:'',student_id:'',days:'14'});
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');

    function load() {
        Promise.all([api.loans.list(), api.books.list(), api.students.list()])
            .then(([l,b,s]) => { setLoans(l); setBooks(b); setStudents(s); }).catch(() => {});
    }
    useEffect(load, []);

    async function borrow() {
        if (!form.book_id || !form.student_id) return;
        setError('');
        try { await api.loans.create({book_id:form.book_id, student_id:form.student_id, days:+form.days}); setForm({book_id:'',student_id:'',days:'14'}); load(); }
        catch (e: any) { setError(e.message); }
    }

    const now = new Date();
    const shown = loans.filter(l => {
        if (filter==='active') return !l.returned_at && new Date(l.due_at) >= now;
        if (filter==='overdue') return !l.returned_at && new Date(l.due_at) < now;
        if (filter==='returned') return l.returned_at;
        return true;
    });

    return (
        <div>
            <div className="page-head"><h1>Заемания</h1><p>Срок от 7 до 14 дни.</p></div>
            <div className="form-panel">
                <select className="inp" value={form.book_id} onChange={e => setForm({...form, book_id:e.target.value})}>
                    <option value="">Книга...</option>
                    {books.map(b => <option key={b.id} value={b.id}>{b.title} ({b.available_copies??b.copies} нал.)</option>)}
                </select>
                <select className="inp" value={form.student_id} onChange={e => setForm({...form, student_id:e.target.value})}>
                    <option value="">Ученик...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
                </select>
                <select className="inp" style={{maxWidth:120}} value={form.days} onChange={e => setForm({...form, days:e.target.value})}>
                    {[7,8,9,10,11,12,13,14].map(d => <option key={d} value={d}>{d} дни</option>)}
                </select>
                <button className="btn" onClick={borrow} disabled={!form.book_id||!form.student_id}><Plus size={15}/> Заеми</button>
                {error && <span style={{color:'var(--danger)',fontSize:'.85rem'}}>{error}</span>}
            </div>
            <div className="toolbar">
                <div className="filters">
                    {[['all','Всички'],['active','Активни'],['overdue','Просрочени'],['returned','Върнати']].map(([k,l]) =>
                        <button key={k} className={'filter-btn'+(filter===k?' active':'')} onClick={() => setFilter(k)}>{l}</button>
                    )}
                </div>
                <span style={{fontSize:'.8rem',color:'var(--muted)'}}>{shown.length} записа</span>
            </div>
            <div className="list">
                {shown.length===0 && <div className="empty">Няма заемания.</div>}
                {shown.map(l => {
                    const overdue = !l.returned_at && new Date(l.due_at) < now;
                    const cls = l.returned_at ? 'returned' : overdue ? 'overdue' : 'active';
                    return <div key={l.id} className="item">
                        <div className={'loan-dot '+cls}>{l.returned_at?<CheckCircle size={18}/>:overdue?<AlertTriangle size={18}/>:<Clock size={18}/>}</div>
                        <div className="item-body">
                            <div className="item-title">{l.book_title}</div>
                            <div className="item-sub">{l.student_name} · {l.student_grade} · {fmtDate(l.borrowed_at)} → {fmtDate(l.due_at)}{l.returned_at && ' · върната '+fmtDate(l.returned_at)}</div>
                        </div>
                        <div className="item-actions">
                            {!l.returned_at && <button className="btn btn-sm" onClick={() => api.loans.returnIt(l.id).then(load)}><RotateCcw size={14}/> Върни</button>}
                            {can('admin') && <button className="btn-ghost" onClick={() => api.loans.remove(l.id).then(load)}><Trash2 size={16}/></button>}
                        </div>
                    </div>;
                })}
            </div>
        </div>
    );
}
