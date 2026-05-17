import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { KeyRound, Pencil, Trash2, Plus } from 'lucide-react';

const ROLES = [{v:'admin',l:'Админ'},{v:'librarian',l:'Библиотекар'},{v:'teacher',l:'Учител'},{v:'student',l:'Ученик'}];

export function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [form, setForm] = useState({username:'',password:'',full_name:'',role:'student'});
    const [editing, setEditing] = useState<any>(null);
    const [error, setError] = useState('');

    function load() { api.users.list().then(setUsers).catch(() => {}); }
    useEffect(load, []);

    async function addUser() {
        if (!form.username||!form.password||!form.full_name) return;
        setError('');
        try { await api.users.create(form); setForm({username:'',password:'',full_name:'',role:'student'}); load(); }
        catch (e: any) { setError(e.message); }
    }

    async function saveEdit() {
        const data: any = { full_name: editing.full_name, role: editing.role };
        if (editing.password) data.password = editing.password;
        await api.users.update(editing.id, data); setEditing(null); load();
    }

    return (
        <div>
            <div className="page-head"><h1>Акаунти</h1><p>{users.length} потребителя.</p></div>
            <div className="form-panel">
                <input className="inp" placeholder="Потребител" value={form.username} onChange={e => setForm({...form, username:e.target.value})} />
                <input className="inp" placeholder="Парола" type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} />
                <input className="inp" placeholder="Пълно име" value={form.full_name} onChange={e => setForm({...form, full_name:e.target.value})} />
                <select className="inp" style={{maxWidth:150}} value={form.role} onChange={e => setForm({...form, role:e.target.value})}>
                    {ROLES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                </select>
                <button className="btn" onClick={addUser} disabled={!form.username||!form.password||!form.full_name}><Plus size={15}/> Създай</button>
                {error && <span style={{color:'var(--danger)',fontSize:'.85rem'}}>{error}</span>}
            </div>
            <div className="list">
                {users.map(u => <div key={u.id} className="item">
                    <div className="item-icon round"><KeyRound size={20}/></div>
                    <div className="item-body">
                        <div className="item-title">{u.full_name} <span className={'role-badge role-'+u.role}>{ROLES.find(r=>r.v===u.role)?.l}</span></div>
                        <div className="item-sub">@{u.username}</div>
                    </div>
                    <div className="item-actions">
                        <button className="btn-ghost" onClick={() => setEditing({...u,password:''})}><Pencil size={16}/></button>
                        <button className="btn-ghost" onClick={() => api.users.remove(u.id).then(load).catch(e => setError(e.message))}><Trash2 size={16}/></button>
                    </div>
                </div>)}
            </div>
            {editing && <div className="modal-overlay" onClick={() => setEditing(null)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                    <h2>Редактирай акаунт</h2>
                    <div className="modal-fields">
                        <input className="inp" placeholder="Пълно име" value={editing.full_name} onChange={e => setEditing({...editing, full_name:e.target.value})} />
                        <select className="inp" value={editing.role} onChange={e => setEditing({...editing, role:e.target.value})}>
                            {ROLES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                        </select>
                        <input className="inp" placeholder="Нова парола (или празно)" type="password" value={editing.password} onChange={e => setEditing({...editing, password:e.target.value})} />
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
