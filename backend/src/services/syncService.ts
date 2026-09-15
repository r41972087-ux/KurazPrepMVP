import crypto from 'crypto';
import prisma from '../db/prisma.js';

export interface SubjectSyncPayload {
  subject: {
    id: string;
    name: string;
    stream: 'NATURAL' | 'SOCIAL';
    gradeLevel: number;
    icon: string | null;
    updatedAt: string;
  };
  units: Array<{
    id: string;
    subjectId: string;
    unitNumber: number;
    title: string;
    updatedAt: string;
    shortNotes: Array<{
      id: string;
      unitId: string;
      title: string;
      contentMarkdown: string;
      isHighYield: boolean;
      orderIndex: number;
      updatedAt: string;
    }>;
    questions: Array<{
      id: string;
      unitId: string;
      prompt: string;
      optionsJson: any;
      correctOptionId: string;
      explanation: string;
      updatedAt: string;
    }>;
  }>;
  contentHash: string;
  version: number;
  serverTime: string;
}

/**
 * Calculates deterministic content hash from subject's units, notes, and questions
 */
export function calculateSubjectHash(subject: any, units: any[]): string {
  const hashObj = {
    subjectId: subject.id,
    subjectName: subject.name,
    gradeLevel: subject.gradeLevel,
    units: units.map((u) => ({
      id: u.id,
      unitNumber: u.unitNumber,
      title: u.title,
      notes: (u.shortNotes || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        contentMarkdown: n.contentMarkdown,
        isHighYield: n.isHighYield,
        orderIndex: n.orderIndex,
      })),
      questions: (u.questions || []).map((q: any) => ({
        id: q.id,
        prompt: q.prompt,
        optionsJson: q.optionsJson,
        correctOptionId: q.correctOptionId,
        explanation: q.explanation,
      })),
    })),
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(hashObj))
    .digest('hex');
}

/**
 * Retrieves curriculum delta for a given subject
 */
export async function getSubjectDeltaSync(
  subjectId: string,
  sinceHash?: string
): Promise<{ notModified: boolean; data?: SubjectSyncPayload }> {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      syncMetadata: true,
      units: {
        orderBy: { unitNumber: 'asc' },
        include: {
          shortNotes: {
            orderBy: { orderIndex: 'asc' },
          },
          questions: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });

  if (!subject) {
    throw new Error(`Subject with ID ${subjectId} not found`);
  }

  // Compute current content hash
  const currentHash = calculateSubjectHash(subject, subject.units);

  // Update or persist sync metadata if hash changed or missing
  let syncMeta = subject.syncMetadata;
  if (!syncMeta || syncMeta.contentHash !== currentHash) {
    syncMeta = await prisma.syncMetadata.upsert({
      where: { subjectId: subject.id },
      create: {
        subjectId: subject.id,
        contentHash: currentHash,
        version: (syncMeta?.version || 0) + 1,
      },
      update: {
        contentHash: currentHash,
        version: { increment: 1 },
      },
    });
  }

  // Check if client is already up-to-date
  if (sinceHash && sinceHash === currentHash) {
    return { notModified: true };
  }

  const payload: SubjectSyncPayload = {
    subject: {
      id: subject.id,
      name: subject.name,
      stream: subject.stream,
      gradeLevel: subject.gradeLevel,
      icon: subject.icon,
      updatedAt: subject.updatedAt.toISOString(),
    },
    units: subject.units.map((u) => ({
      id: u.id,
      subjectId: u.subjectId,
      unitNumber: u.unitNumber,
      title: u.title,
      updatedAt: u.updatedAt.toISOString(),
      shortNotes: u.shortNotes.map((n) => ({
        id: n.id,
        unitId: n.unitId,
        title: n.title,
        contentMarkdown: n.contentMarkdown,
        isHighYield: n.isHighYield,
        orderIndex: n.orderIndex,
        updatedAt: n.updatedAt.toISOString(),
      })),
      questions: u.questions.map((q) => ({
        id: q.id,
        unitId: q.unitId,
        prompt: q.prompt,
        optionsJson: q.optionsJson,
        correctOptionId: q.correctOptionId,
        explanation: q.explanation,
        updatedAt: q.updatedAt.toISOString(),
      })),
    })),
    contentHash: currentHash,
    version: syncMeta.version,
    serverTime: new Date().toISOString(),
  };

  return {
    notModified: false,
    data: payload,
  };
}
