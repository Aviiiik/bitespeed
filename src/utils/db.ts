
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not found in .env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  ssl: { rejectUnauthorized: false }, 
  max: 5, 
  idleTimeoutMillis: 30000,  
  connectionTimeoutMillis: 2000, 
   allowExitOnIdle: false,
});



const adapter = new PrismaPg(pool);

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ||
  new PrismaClient({ adapter }); 

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export { prisma };