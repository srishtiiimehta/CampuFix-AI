import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export type UserRole = 'student' | 'staff';

export interface AuthUser {
  userId: string;
  name: string;
  role: UserRole;
  username: string;
}

export interface UserRecord extends AuthUser {
  passwordHash: string;
}

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'campusfix-jwt-secret-key-change-in-production';

// Seeded users with pre-hashed passwords using bcryptjs
const SEED_USERS: UserRecord[] = [
  {
    userId: 'stu_alex_c',
    username: 'alex',
    name: 'Alex Chen (Sophomore)',
    role: 'student',
    // 'student123' hashed with bcrypt salt 10
    passwordHash: bcrypt.hashSync('student123', 10),
  },
  {
    userId: 'staff_marcus_v',
    username: 'marcus',
    name: 'Marcus Vance (Facilities Lead)',
    role: 'staff',
    // 'staff123' hashed with bcrypt salt 10
    passwordHash: bcrypt.hashSync('staff123', 10),
  },
];

export class AuthStore {
  private users: UserRecord[] = [...SEED_USERS];

  public findByUsername(username: string): UserRecord | undefined {
    return this.users.find((u) => u.username.toLowerCase() === username.toLowerCase().trim());
  }

  public findById(userId: string): UserRecord | undefined {
    return this.users.find((u) => u.userId === userId);
  }

  public verifyPassword(user: UserRecord, plainPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, user.passwordHash);
  }

  public generateToken(user: AuthUser): string {
    return jwt.sign(
      {
        userId: user.userId,
        name: user.name,
        role: user.role,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  public verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      return decoded;
    } catch {
      return null;
    }
  }
}

export const authStore = new AuthStore();

/**
 * Middleware: Requires a valid JWT token in Authorization: Bearer <token>
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required. Please log in.',
    });
  }

  const token = authHeader.substring(7).trim();
  const user = authStore.verifyToken(token);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired authentication token.',
    });
  }

  req.user = user;
  next();
}

/**
 * Middleware: Requires a specific user role (e.g. 'staff')
 */
export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required.',
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Only authorized ${role} accounts have permission for this facility operation.`,
      });
    }

    next();
  };
}
