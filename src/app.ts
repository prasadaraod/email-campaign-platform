import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './api/middleware/errorHandler';
import authRoutes from './api/routes/auth.routes';
import contactRoutes from './api/routes/contact.routes';
import campaignRoutes from './api/routes/campaign.routes';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/campaigns', campaignRoutes);

app.use(errorHandler);