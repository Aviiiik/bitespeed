// src/app.ts (Temporary test file)
import express from 'express';
import { prisma } from './utils/db';

const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    // Simple query to test connection
    const count = await prisma.contact.count();
    res.json({ status: 'OK', message: `DB connected! Contacts table has ${count} rows.` });
  } catch (error) {
    res.status(500).json({ error: 'DB connection failed', details: error });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Test server on http://localhost:${PORT}/health`);
});