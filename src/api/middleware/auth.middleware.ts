import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../utils/errors';

export interface AuthPayload {
  userId: string;
  tenantId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'secret';
    const payload = jwt.verify(token, secret) as AuthPayload;

    req.user = payload;
    next();
  } catch (err) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};