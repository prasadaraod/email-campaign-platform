import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './api/middleware/errorHandler';
import authRoutes from './api/routes/auth.routes';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handler — must be last
app.use(errorHandler);