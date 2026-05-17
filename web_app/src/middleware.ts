import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from './models';

const SECRET = process.env['JWT_SECRET'] || 'athenaeum-secret';

export interface AuthPayload { id: string; username: string; role: Role; }
declare global { namespace Express { interface Request { user?: AuthPayload; } } }

export function signToken(payload: AuthPayload): string {
    return jwt.sign(payload, SECRET, { expiresIn: '24h' });
}

export function auth(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) { res.status(401).json({ message: 'No token' }); return; }
    try {
        req.user = jwt.verify(token, SECRET) as AuthPayload;
        next();
    } catch {
        res.status(401).json({ message: 'Bad token' });
    }
}

export function requireRole(...roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ message: 'No permission' });
            return;
        }
        next();
    };
}
