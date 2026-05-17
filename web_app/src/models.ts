import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
export type Role = 'admin' | 'librarian' | 'teacher' | 'student';
export interface User { id: string; username: string; password?: string; full_name: string; role: Role; created_at?: string; }
export interface Book { id: string; title: string; author: string; year?: number | null; copies: number; available_copies?: number; created_at?: string; }
export interface Student { id: string; name: string; grade: string; user_id?: string | null; created_at?: string; }
export interface Loan { id: string; book_id: string; student_id: string; borrowed_at: string; due_at: string; returned_at?: string | null; book_title?: string; book_author?: string; student_name?: string; student_grade?: string; }
function makeId() {
    return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}
export class UserModel {
    constructor(private db: Pool) {}
    async findAll() {
        const [rows] = await this.db.query<RowDataPacket[]>('SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at DESC');
        return rows as User[];
    }
    async findById(id: string) {
        const [rows] = await this.db.query<RowDataPacket[]>('SELECT id, username, full_name, role, created_at FROM users WHERE id = ?', [id]);
        return rows[0] as User | undefined;
    }
    async findByUsername(username: string) {
        const [rows] = await this.db.query<RowDataPacket[]>('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0] as (User & { password: string }) | undefined;
    }
    async create(username: string, password: string, full_name: string, role: Role) {
        const id = makeId();
        await this.db.query<ResultSetHeader>('INSERT INTO users (id, username, password, full_name, role) VALUES (?, ?, ?, ?, ?)', [id, username, password, full_name, role]);
        return (await this.findById(id))!;
    }
    async update(id: string, data: { full_name?: string; role?: Role; password?: string }) {
        const existing = await this.findById(id);
        if (!existing) return undefined;
        const sets: string[] = [];
        const vals: any[] = [];
        if (data.full_name) { sets.push('full_name = ?'); vals.push(data.full_name); }
        if (data.role) { sets.push('role = ?'); vals.push(data.role); }
        if (data.password) { sets.push('password = ?'); vals.push(data.password); }
        if (sets.length === 0) return existing;
        vals.push(id);
        await this.db.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);
        return this.findById(id);
    }
    async delete(id: string) {
        const [r] = await this.db.query<ResultSetHeader>('DELETE FROM users WHERE id = ?', [id]);
        return r.affectedRows > 0;
    }
}
export class BookModel {
    constructor(private db: Pool) {}
    async findAll() {
        const [rows] = await this.db.query<RowDataPacket[]>(`
            SELECT b.*, (b.copies - COALESCE(a.cnt, 0)) AS available_copies
            FROM books b
            LEFT JOIN (SELECT book_id, COUNT(*) AS cnt FROM loans WHERE returned_at IS NULL GROUP BY book_id) a
            ON a.book_id = b.id ORDER BY title ASC`);
        return rows as Book[];
    }
    async findById(id: string) {
        const [rows] = await this.db.query<RowDataPacket[]>('SELECT * FROM books WHERE id = ?', [id]);
        return rows[0] as Book | undefined;
    }
    async create(title: string, author: string, year: number | null, copies: number) {
        const id = makeId();
        await this.db.query('INSERT INTO books (id, title, author, year, copies) VALUES (?, ?, ?, ?, ?)', [id, title, author, year, copies]);
        return (await this.findById(id))!;
    }
    async update(id: string, data: any) {
        const old = await this.findById(id);
        if (!old) return undefined;
        const merged = { ...old, ...data };
        await this.db.query('UPDATE books SET title = ?, author = ?, year = ?, copies = ? WHERE id = ?',
            [merged.title, merged.author, merged.year, merged.copies, id]);
        return this.findById(id);
    }
    async delete(id: string) {
        const [r] = await this.db.query<ResultSetHeader>('DELETE FROM books WHERE id = ?', [id]);
        return r.affectedRows > 0;
    }
    async availableCopies(id: string) {
        const [rows] = await this.db.query<RowDataPacket[]>(`
            SELECT (b.copies - COALESCE(a.cnt, 0)) AS available
            FROM books b
            LEFT JOIN (SELECT book_id, COUNT(*) AS cnt FROM loans WHERE returned_at IS NULL GROUP BY book_id) a
            ON a.book_id = b.id WHERE b.id = ?`, [id]);
        return (rows[0] as any)?.available ?? 0;
    }
}
export class StudentModel {
    constructor(private db: Pool) {}
    async findAll() {
        const [rows] = await this.db.query<RowDataPacket[]>('SELECT * FROM students ORDER BY name ASC');
        return rows as Student[];
    }
    async findById(id: string) {
        const [rows] = await this.db.query<RowDataPacket[]>('SELECT * FROM students WHERE id = ?', [id]);
        return rows[0] as Student | undefined;
    }
    async create(name: string, grade: string, userId?: string) {
        const id = makeId();
        await this.db.query('INSERT INTO students (id, name, grade, user_id) VALUES (?, ?, ?, ?)', [id, name, grade, userId || null]);
        return (await this.findById(id))!;
    }
    async update(id: string, data: any) {
        const old = await this.findById(id);
        if (!old) return undefined;
        const merged = { ...old, ...data };
        await this.db.query('UPDATE students SET name = ?, grade = ? WHERE id = ?', [merged.name, merged.grade, id]);
        return this.findById(id);
    }
    async delete(id: string) {
        const [r] = await this.db.query<ResultSetHeader>('DELETE FROM students WHERE id = ?', [id]);
        return r.affectedRows > 0;
    }
}
export class LoanModel {
    constructor(private db: Pool) {}
    private joinQuery = `
        SELECT l.*, b.title AS book_title, b.author AS book_author, s.name AS student_name, s.grade AS student_grade
        FROM loans l JOIN books b ON b.id = l.book_id JOIN students s ON s.id = l.student_id`;
    async findAll() {
        const [rows] = await this.db.query<RowDataPacket[]>(this.joinQuery + ' ORDER BY CASE WHEN l.returned_at IS NULL THEN 0 ELSE 1 END, l.borrowed_at DESC');
        return rows as Loan[];
    }
    async findById(id: string) {
        const [rows] = await this.db.query<RowDataPacket[]>(this.joinQuery + ' WHERE l.id = ?', [id]);
        return rows[0] as Loan | undefined;
    }
    async findByStudentId(studentId: string) {
        const [rows] = await this.db.query<RowDataPacket[]>(this.joinQuery + ' WHERE l.student_id = ? ORDER BY l.borrowed_at DESC', [studentId]);
        return rows as Loan[];
    }
    async create(bookId: string, studentId: string, days: number) {
        const id = makeId();
        const now = new Date();
        const dueDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        await this.db.query('INSERT INTO loans (id, book_id, student_id, borrowed_at, due_at) VALUES (?, ?, ?, ?, ?)',
            [id, bookId, studentId, now, dueDate]);
        return (await this.findById(id))!;
    }
    async returnBook(id: string) {
        await this.db.query('UPDATE loans SET returned_at = NOW() WHERE id = ? AND returned_at IS NULL', [id]);
        return this.findById(id);
    }
    async delete(id: string) {
        const [r] = await this.db.query<ResultSetHeader>('DELETE FROM loans WHERE id = ?', [id]);
        return r.affectedRows > 0;
    }
}
