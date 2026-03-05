

export interface IdentifyRequest {
  email?: string | null;      
  phoneNumber?: number | null; 
}

export interface ConsolidatedContact {
  primaryContactId: number;
  emails: string[];            
  phoneNumbers: string[];      
  secondaryContactIds: number[]; 
}

export interface Contact {
  id: number;
  phoneNumber: string | null;  // String in DB
  email: string | null;
  linkedId: number | null;
  linkPrecedence: 'primary' | 'secondary';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}


export interface IdentifyResponse {
  contact: ConsolidatedContact;
}