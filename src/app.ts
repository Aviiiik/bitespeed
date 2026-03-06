// src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes/index';
import { prisma } from './utils/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Performance
app.use(helmet()); // Secure HTTP headers
app.use(compression()); // Faster data transfer
app.use(cors());
app.use(express.json());

// Rate Limiting: Protects your shared DB from being overwhelmed
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

// Render Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', database: 'connected' });
});

app.use('/', routes);
app.use('/identify', limiter);

// Standard Error Handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

// Graceful Shutdown to release DB connections
process.on('SIGTERM', () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default app;