import { useEffect, useState } from 'react';
import { useAuth } from '../context';
import { api } from '../services/api';
import { BookOpen, Pencil, Trash2, Plus } from 'lucide-react';

export function BooksPage() {
    const { can } = useAuth();
    const [books, setBooks] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ title: '', author: '', year: '', copies: '1' });
    const [editing, setEditing] = useState<any>(null);

    function load() { api.books.list().then(setBooks).catch(() => {}); }
    useEffect(load, []);

    const shown = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

    async function addBook() {
        if (!form.title || !form.author) return;
        await api.books.create({ title: form.title, author: form.author, year: form.year ? +form.year : null, copies: +form.copies || 1 });
        setForm({ title: '', author: '', year: '', copies: '1' }); load();
    }

    async function saveEdit() {
        await api.books.update(editing.id, { title: editing.title, author: editing.author, year: editing.year ? +editing.year : null, copies: +editing.copies || 1 });
        setEditing(null); load();
    }

    return (
        <div>
            <div className="page-head"><h1>Каталог</h1><p>{books.length} заглавия.</p></div>
            <div className="toolbar"><input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Търсене..." /></div>
            {can('admin', 'librarian') &&
                <div className="form-panel">
                    <input className="inp" placeholder="Заглавие" value={form.title} onChange={e => setForm({...form, title: e.target.value})} onKeyDown={e => e.key==='Enter' && addBook()} />
                    <input className="inp" placeholder="Автор" value={form.author} onChange={e => setForm({...form, author: e.target.value})} onKeyDown={e => e.key==='Enter' && addBook()} />
                    <input className="inp inp-sm" placeholder="Година" type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
                    <input className="inp inp-sm" placeholder="Бр." type="number" value={form.copies} onChange={e => setForm({...form, copies: e.target.value})} />
                    <button className="btn" onClick={addBook} disabled={!form.title||!form.author}><Plus size={15}/> Добави</button>
                </div>}
            <div className="list">
                {shown.length===0 && <div className="empty">Няма книги.</div>}
                {shown.map(b => <div key={b.id} className="item">
                    <div className="item-icon"><BookOpen size={20}/></div>
                    <div className="item-body">
                        <div className="item-title">{b.title}</div>
                        <div className="item-sub">{b.author}{b.year ? ' · '+b.year : ''}</div>
                    </div>
                    <div className="avail"><span className={(b.available_copies??b.copies)>0?'avail-ok':'avail-none'}>{b.available_copies??b.copies}</span><span style={{color:'var(--muted)'}}> / {b.copies}</span></div>
                    {can('admin','librarian') && <div className="item-actions">
                        <button className="btn-ghost" onClick={() => setEditing({...b, year: b.year?.toString()||'', copies: b.copies.toString()})}><Pencil size={16}/></button>
                        <button className="btn-ghost" onClick={() => { api.books.remove(b.id).then(load); }}><Trash2 size={16}/></button>
                    </div>}
                </div>)}
            </div>
            {editing && <div className="modal-overlay" onClick={() => setEditing(null)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                    <h2>Редактирай книга</h2>
                    <div className="modal-fields">
                        <input className="inp" value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} placeholder="Заглавие"/>
                        <input className="inp" value={editing.author} onChange={e => setEditing({...editing, author: e.target.value})} placeholder="Автор"/>
                        <input className="inp" type="number" value={editing.year} onChange={e => setEditing({...editing, year: e.target.value})} placeholder="Година"/>
                        <input className="inp" type="number" value={editing.copies} onChange={e => setEditing({...editing, copies: e.target.value})} placeholder="Бройки"/>
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
