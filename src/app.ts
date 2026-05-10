import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes (add as you build them)
// app.use('/api/auth', authRoutes);
// app.use('/api/campaigns', campaignRoutes);
// app.use('/api/contacts', contactRoutes);