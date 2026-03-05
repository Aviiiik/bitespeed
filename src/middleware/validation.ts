// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { IdentifyRequest } from '../types';


const identifySchema = z.object({
  email: z.email('Invalid email format').optional().or(z.null()),
  phoneNumber: z.number('Phone must be a number').optional().or(z.null()),
}).refine((data) => data.email !== null || data.phoneNumber !== null, {
  message: 'At least one of email or phoneNumber is required',
  path: ['phoneNumber'], 
});

export function validateIdentify(req: Request, res: Response, next: NextFunction) {
  try {
   
    const validated = identifySchema.parse(req.body);
    (req as Request & { body: IdentifyRequest }).body = validated;
    next();
  } catch (error) {
   
    const issue = (error as z.ZodError).issues[0];
    res.status(400).json({ error: issue.message });
  }
}