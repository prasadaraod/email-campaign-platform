import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { AppError } from '../utils/errors';
import { RegisterInput, LoginInput } from '../api/validators/auth.schema';

export const authService = {
  async register(input: RegisterInput) {
    const { name, email, password, tenantName } = input;

    // Check if user already exists
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    // Create tenant
    const tenantResult = await db.query(
      'INSERT INTO tenants (name) VALUES ($1) RETURNING id',
      [tenantName]
    );
    const tenantId = tenantResult.rows[0].id;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userResult = await db.query(
      `INSERT INTO users (tenant_id, email, password, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, tenant_id`,
      [tenantId, email, hashedPassword, name]
    );
    const user = userResult.rows[0];

    // Generate token
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return {
      token,
      user: { id: user.id, email: user.email, tenantId: user.tenant_id },
    };
  },

  async login(input: LoginInput) {
    const { email, password } = input;

    // Find user
    const result = await db.query(
      'SELECT id, email, password, tenant_id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const user = result.rows[0];

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return {
      token,
      user: { id: user.id, email: user.email, tenantId: user.tenant_id },
    };
  },
};