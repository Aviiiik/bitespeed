
import { PrismaClient, LinkPrecedence } from '@prisma/client';
import { ConsolidatedContact, IdentifyRequest } from '../types';
import { prisma } from '../utils/db';

export async function identifyContact(input: IdentifyRequest): Promise<ConsolidatedContact> {
  const email = input.email ?? null;
  const phoneNumber = input.phoneNumber ? String(input.phoneNumber) : null;

  if (!email && !phoneNumber) {
    throw new Error('At least one of email or phoneNumber is required');
  }

  console.log(`[identify] Processing: email=${email}, phone=${phoneNumber}`);

  
  const tx = prisma;

 
  const matches = await tx.contact.findMany({
    where: {
      deletedAt: null,
      OR: [
        ...(email ? [{ email }] : []),
        ...(phoneNumber ? [{ phoneNumber }] : []),
      ],
    },
  });

  console.log(`[identify] Found ${matches.length} matching contacts`);

  if (matches.length === 0) {
   
    const newContact = await tx.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: LinkPrecedence.primary,
      },
    });

    console.log(`[identify] Created new primary: ID ${newContact.id}`);

    return buildConsolidatedResponse([newContact], newContact.id);
  }

  
  const rootIds = await Promise.all(
    matches.map((match) => getRoot(tx, match.id))
  );
  const uniqueRootIds = [...new Set(rootIds)];

  console.log(`[identify] Unique roots found: ${uniqueRootIds}`);

  let primaryId: number;
  let groupContacts: Awaited<ReturnType<typeof getFullGroup>>;

  if (uniqueRootIds.length === 1) {
   
    primaryId = uniqueRootIds[0];
    groupContacts = await getFullGroup(tx, primaryId);

    const hasNewEmail = email && !groupContacts.some((c) => c.email === email);
    const hasNewPhone = phoneNumber && !groupContacts.some((c) => c.phoneNumber === phoneNumber);

    if (hasNewEmail || hasNewPhone) {
      console.log(`[identify] Adding new secondary (email new=${hasNewEmail}, phone new=${hasNewPhone})`);

      await tx.contact.create({
        data: {
          email: hasNewEmail ? email : undefined,
          phoneNumber: hasNewPhone ? phoneNumber : undefined,
          linkedId: primaryId,
          linkPrecedence: LinkPrecedence.secondary,
        },
      });

    
      groupContacts = await getFullGroup(tx, primaryId);
    }
  } else {
   
    const rootDetails = await Promise.all(
      uniqueRootIds.map(async (rootId) => ({
        id: rootId,
        createdAt: (await tx.contact.findUnique({ where: { id: rootId } }))!.createdAt,
      }))
    );

    const sortedRoots = rootDetails.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    primaryId = sortedRoots[0].id;

    console.log(`[identify] Merging groups → primary ID = ${primaryId}`);

    const now = new Date();
    for (const { id } of sortedRoots.slice(1)) {
      await tx.contact.update({
        where: { id },
        data: {
          linkedId: primaryId,
          linkPrecedence: LinkPrecedence.secondary,
          updatedAt: now,
        },
      });
    }

    groupContacts = await getFullGroup(tx, primaryId);
  }

  const response = buildConsolidatedResponse(groupContacts, primaryId);
  console.log(`[identify] Returning consolidated contact: primary=${response.primaryContactId}`);

  return response;
}


async function getRoot(tx: PrismaClient, contactId: number): Promise<number> {
  let currentId = contactId;
  while (true) {
    const contact = await tx.contact.findUnique({ where: { id: currentId } });
    if (!contact?.linkedId) return currentId;
    currentId = contact.linkedId;
  }
}

async function getFullGroup(tx: PrismaClient, primaryId: number): Promise<any[]> {
  const group: any[] = [];
  const visited = new Set<number>();

  const traverse = async (id: number) => {
    if (visited.has(id)) return;
    visited.add(id);

    const contact = await tx.contact.findUnique({
      where: { id, deletedAt: null },
      include: { linkedFrom: true },
    });

    if (!contact) return;

    group.push(contact);

    
    for (const child of contact.linkedFrom) {
      await traverse(child.id);
    }
  };

  await traverse(primaryId);
  return group;
}

function buildConsolidatedResponse(contacts: any[], primaryId: number): ConsolidatedContact {
  const primary = contacts.find((c) => c.id === primaryId)!;


  const emailsSet = new Set<string>();
  const phonesSet = new Set<string>();

  contacts.forEach((c) => {
    if (c.email) emailsSet.add(c.email);
    if (c.phoneNumber) phonesSet.add(c.phoneNumber);
  });

  let emails = Array.from(emailsSet);
  let phoneNumbers = Array.from(phonesSet);


  if (primary.email && emails[0] !== primary.email) {
    const idx = emails.indexOf(primary.email);
    if (idx !== -1) {
      [emails[0], emails[idx]] = [emails[idx], emails[0]];
    }
  }

  if (primary.phoneNumber && phoneNumbers[0] !== primary.phoneNumber) {
    const idx = phoneNumbers.indexOf(primary.phoneNumber);
    if (idx !== -1) {
      [phoneNumbers[0], phoneNumbers[idx]] = [phoneNumbers[idx], phoneNumbers[0]];
    }
  }

 
  const secondaryIds = contacts
    .filter((c) => c.id !== primaryId)
    .map((c) => c.id)
    .sort((a, b) => a - b);

  return {
    primaryContactId: primaryId,
    emails,
    phoneNumbers,
    secondaryContactIds: secondaryIds,
  };
}