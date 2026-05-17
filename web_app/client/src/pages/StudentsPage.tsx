import { useEffect, useState } from 'react';
import { useAuth } from '../context';
import { api } from '../services/api';
import { UserCircle, Pencil, Trash2, Plus } from 'lucide-react';

export function StudentsPage() {
    const { can } = useAuth();
    const [students, setStudents] = useState<any[]>([]);
    const [form, setForm] = useState({name:'',grade:''});
    const [editing, setEditing] = useState<any>(null);

    function load() { api.students.list().then(setStudents).catch(() => {}); }
    useEffect(load, []);

    async function addStudent() {
        if (!form.name) return;
        await api.students.create({name:form.name, grade:form.grade||'-'});
        setForm({name:'',grade:''}); load();
    }

    async function saveEdit() {
        await api.students.update(editing.id, {name:editing.name, grade:editing.grade});
        setEditing(null); load();
    }

    return (
        <div>
            <div className="page-head"><h1>Ученици</h1><p>{students.length} записа.</p></div>
            <div className="form-panel">
                <input className="inp" placeholder="Име и фамилия" value={form.name} onChange={e => setForm({...form, name:e.target.value})} onKeyDown={e => e.key==='Enter' && addStudent()} />
                <input className="inp" placeholder="Клас" style={{maxWidth:140}} value={form.grade} onChange={e => setForm({...form, grade:e.target.value})} onKeyDown={e => e.key==='Enter' && addStudent()} />
                <button className="btn" onClick={addStudent} disabled={!form.name}><Plus size={15}/> Добави</button>
            </div>
            <div className="list">
                {students.length===0 && <div className="empty">Няма ученици.</div>}
                {students.map(s => <div key={s.id} className="item">
                    <div className="item-icon round"><UserCircle size={22}/></div>
                    <div className="item-body"><div className="item-title">{s.name}</div><div className="item-sub">Клас {s.grade}</div></div>
                    <div className="item-actions">
                        <button className="btn-ghost" onClick={() => setEditing({...s})}><Pencil size={16}/></button>
                        {can('admin') && <button className="btn-ghost" onClick={() => api.students.remove(s.id).then(load)}><Trash2 size={16}/></button>}
                    </div>
                </div>)}
            </div>
            {editing && <div className="modal-overlay" onClick={() => setEditing(null)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                    <h2>Редактирай ученик</h2>
                    <div className="modal-fields">
                        <input className="inp" value={editing.name} onChange={e => setEditing({...editing, name:e.target.value})} />
                        <input className="inp" value={editing.grade} onChange={e => setEditing({...editing, grade:e.target.value})} />
                    </div>
                    <div className="modal-actions">
                        <button className="btn" style={{background:'var(--secondary)',color:'var(--fg)'}} onClick={() => setEditing(null)}>Откажи</button>
                        <button className="btn" onClick={saveEdit}>Запази</button>
                    </div>
                </div>
            </div>}
        </div>
    );
}
