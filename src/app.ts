// src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());                        // Allow frontend / Postman requests
app.use(express.json());                // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Optional: form data (not needed for task)


app.use('/', routes);


app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});


app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(`Identify endpoint: POST http://localhost:${PORT}/identify`);
  console.log(`Health check:     GET  http://localhost:${PORT}/health`);
  console.log(`Environment:      ${process.env.NODE_ENV || 'development'}`);
 
});

export default app;