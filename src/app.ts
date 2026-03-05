// src/app.ts (Temporary test file)
import express from 'express';
import { prisma } from './utils/db';
import { Request, Response } from 'express'; // Import types for request and response 
import { validateIdentify } from './middleware/validation';
import { handleIdentify } from './controllers/identityController';
const app = express();
app.use(express.json());
app.post('/identify', validateIdentify, handleIdentify)
app.get('/health', async (req: Request, res: Response) => {  // Add types (import below)
  try {
    const count = await prisma.contact.count({ where: { deletedAt: null } });
    res.json({ status: 'OK', message: `DB connected! Active contacts: ${count}` });
  } catch (error) {
    res.status(500).json({ error: 'DB connection failed', details: error });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Test server on http://localhost:${PORT}/health`);
});