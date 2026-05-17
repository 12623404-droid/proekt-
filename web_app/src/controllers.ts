import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel, BookModel, StudentModel, LoanModel } from './models';
import { signToken } from './middleware';

export class AuthController {
    constructor(private userModel: UserModel) {}
    login = async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) return res.status(400).json({ message: 'Missing fields' });
            const user = await this.userModel.findByUsername(username);
            if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Wrong username or password' });
            const token = signToken({ id: user.id, username: user.username, role: user.role });
            res.json({ data: { token, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } } });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    me = async (req: Request, res: Response) => {
        try {
            const user = await this.userModel.findById(req.user!.id);
            if (!user) return res.status(404).json({ message: 'Not found' });
            res.json({ data: user });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
}

export class UserController {
    constructor(private userModel: UserModel) {}
    getAll = async (_req: Request, res: Response) => {
        try { res.json({ data: await this.userModel.findAll() }); }
        catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    create = async (req: Request, res: Response) => {
        try {
            const { username, password, full_name, role } = req.body;
            if (!username || !password || !full_name) return res.status(400).json({ message: 'Missing fields' });
            if (await this.userModel.findByUsername(username)) return res.status(409).json({ message: 'Username taken' });
            const user = await this.userModel.create(username, await bcrypt.hash(password, 10), full_name, role || 'student');
            res.status(201).json({ data: user });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    update = async (req: Request, res: Response) => {
        try {
            const data = { ...req.body };
            if (data.password) data.password = await bcrypt.hash(data.password, 10);
            const result = await this.userModel.update(req.params['id'], data);
            if (!result) return res.status(404).json({ message: 'Not found' });
            res.json({ data: result });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    delete = async (req: Request, res: Response) => {
        try {
            if (req.user?.id === req.params['id']) return res.status(400).json({ message: 'Cant delete yourself' });
            if (!(await this.userModel.delete(req.params['id']))) return res.status(404).json({ message: 'Not found' });
            res.json({ message: 'Deleted' });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
}

export class BookController {
    constructor(private bookModel: BookModel) {}
    getAll = async (_req: Request, res: Response) => {
        try { res.json({ data: await this.bookModel.findAll() }); }
        catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    getOne = async (req: Request, res: Response) => {
        try {
            const book = await this.bookModel.findById(req.params['id']);
            if (!book) return res.status(404).json({ message: 'Not found' });
            res.json({ data: book });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    create = async (req: Request, res: Response) => {
        try {
            const { title, author, year, copies } = req.body;
            if (!title || !author) return res.status(400).json({ message: 'Title and author required' });
            res.status(201).json({ data: await this.bookModel.create(title, author, year || null, copies || 1) });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    update = async (req: Request, res: Response) => {
        try {
            const book = await this.bookModel.update(req.params['id'], req.body);
            if (!book) return res.status(404).json({ message: 'Not found' });
            res.json({ data: book });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    delete = async (req: Request, res: Response) => {
        try {
            if (!(await this.bookModel.delete(req.params['id']))) return res.status(404).json({ message: 'Not found' });
            res.json({ message: 'Deleted' });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
}

export class StudentController {
    constructor(private studentModel: StudentModel) {}
    getAll = async (_req: Request, res: Response) => {
        try { res.json({ data: await this.studentModel.findAll() }); }
        catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    getOne = async (req: Request, res: Response) => {
        try {
            const s = await this.studentModel.findById(req.params['id']);
            if (!s) return res.status(404).json({ message: 'Not found' });
            res.json({ data: s });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    create = async (req: Request, res: Response) => {
        try {
            if (!req.body.name) return res.status(400).json({ message: 'Name required' });
            res.status(201).json({ data: await this.studentModel.create(req.body.name, req.body.grade || '-', req.body.user_id) });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    update = async (req: Request, res: Response) => {
        try {
            const s = await this.studentModel.update(req.params['id'], req.body);
            if (!s) return res.status(404).json({ message: 'Not found' });
            res.json({ data: s });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    delete = async (req: Request, res: Response) => {
        try {
            if (!(await this.studentModel.delete(req.params['id']))) return res.status(404).json({ message: 'Not found' });
            res.json({ message: 'Deleted' });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
}

export class LoanController {
    constructor(private loanModel: LoanModel, private bookModel: BookModel) {}
    getAll = async (_req: Request, res: Response) => {
        try { res.json({ data: await this.loanModel.findAll() }); }
        catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    getMyLoans = async (req: Request, res: Response) => {
        try {
            const sid = req.query['student_id'] as string;
            res.json({ data: sid ? await this.loanModel.findByStudentId(sid) : [] });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    create = async (req: Request, res: Response) => {
        try {
            const { book_id, student_id, days } = req.body;
            if (!book_id || !student_id) return res.status(400).json({ message: 'Missing fields' });
            if ((await this.bookModel.availableCopies(book_id)) <= 0) return res.status(409).json({ message: 'No copies available' });
            let d = Number(days) || 14;
            if (d < 7) d = 7;
            if (d > 14) d = 14;
            res.status(201).json({ data: await this.loanModel.create(book_id, student_id, d) });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    returnBook = async (req: Request, res: Response) => {
        try {
            const loan = await this.loanModel.returnBook(req.params['id']);
            if (!loan) return res.status(404).json({ message: 'Not found' });
            res.json({ data: loan });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
    delete = async (req: Request, res: Response) => {
        try {
            if (!(await this.loanModel.delete(req.params['id']))) return res.status(404).json({ message: 'Not found' });
            res.json({ message: 'Deleted' });
        } catch (err) { console.log(err); res.status(500).json({ message: 'Server error' }); }
    };
}
