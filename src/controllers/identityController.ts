import { Request, Response } from 'express';
import { identifyContact } from '../services/contactService'; 
import { IdentifyResponse } from '../types';

export async function handleIdentify(req: Request, res: Response<IdentifyResponse | { error: string }>) {
  try {
    // Body is validated & typed already
    const { email, phoneNumber } = (req as Request & { body: typeof req.body }).body;
    const result = await identifyContact({ email, phoneNumber });
    res.status(200).json({ contact: result });
  } catch (error) {
    // Service errors (e.g., validation in service) → 400
    console.error('Identify error:', error);
    res.status(400).json({ error: (error as Error).message });
  }
}