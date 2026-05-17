import { Router } from 'express';
import pool from '../db/pool';
import { auth, requireRole } from '../middleware';
import { UserModel, BookModel, StudentModel, LoanModel } from '../models';
import { AuthController, UserController, BookController, StudentController, LoanController } from '../controllers';

const userModel = new UserModel(pool);
const bookModel = new BookModel(pool);
const studentModel = new StudentModel(pool);
const loanModel = new LoanModel(pool);

const authCtrl = new AuthController(userModel);
const userCtrl = new UserController(userModel);
const bookCtrl = new BookController(bookModel);
const studentCtrl = new StudentController(studentModel);
const loanCtrl = new LoanController(loanModel, bookModel);

const router = Router();

router.post('/auth/login', authCtrl.login);
router.get('/auth/me', auth, authCtrl.me);

router.get('/users',        auth, requireRole('admin'), userCtrl.getAll);
router.post('/users',       auth, requireRole('admin'), userCtrl.create);
router.put('/users/:id',    auth, requireRole('admin'), userCtrl.update);
router.delete('/users/:id', auth, requireRole('admin'), userCtrl.delete);

router.get('/books',          auth, bookCtrl.getAll);
router.get('/books/:id',      auth, bookCtrl.getOne);
router.post('/books',         auth, requireRole('admin', 'librarian'), bookCtrl.create);
router.put('/books/:id',      auth, requireRole('admin', 'librarian'), bookCtrl.update);
router.delete('/books/:id',   auth, requireRole('admin', 'librarian'), bookCtrl.delete);

router.get('/students',        auth, studentCtrl.getAll);
router.get('/students/:id',    auth, studentCtrl.getOne);
router.post('/students',       auth, requireRole('admin', 'librarian'), studentCtrl.create);
router.put('/students/:id',    auth, requireRole('admin', 'librarian'), studentCtrl.update);
router.delete('/students/:id', auth, requireRole('admin'), studentCtrl.delete);

router.get('/loans',              auth, loanCtrl.getAll);
router.get('/loans/my',           auth, loanCtrl.getMyLoans);
router.post('/loans',             auth, requireRole('admin', 'librarian'), loanCtrl.create);
router.patch('/loans/:id/return', auth, requireRole('admin', 'librarian'), loanCtrl.returnBook);
router.delete('/loans/:id',       auth, requireRole('admin'), loanCtrl.delete);

export default router;
