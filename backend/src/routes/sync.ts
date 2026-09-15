import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../db/prisma.js';

const quizAttemptUploadSchema = z.object({
  attempts: z.array(
    z.object({
      id: z.string(),
      subjectId: z.string(),
      unitId: z.string().optional(),
      score: z.number(),
      totalQuestions: z.number().int().default(0),
      correctCount: z.number().int().default(0),
      completedAt: z.string().datetime().or(z.string()),
    })
  ),
});

export async function syncRoutes(fastify: FastifyInstance) {
  // Batch upload offline quiz attempts
  // Allows optional JWT auth (authenticated students save to their profile, guest attempts saved anonymously)
  fastify.post('/attempts', async (request: FastifyRequest, reply: FastifyReply) => {
    let userId: string | null = null;

    // Optional user token extraction
    try {
      if (request.headers.authorization) {
        const decoded: any = await request.jwtVerify();
        userId = decoded?.id || null;
      }
    } catch {
      // Unauthenticated / guest mode allowed
      userId = null;
    }

    const parseResult = quizAttemptUploadSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid attempts payload',
        details: parseResult.error.flatten(),
      });
    }

    const { attempts } = parseResult.data;
    if (attempts.length === 0) {
      return reply.send({ syncedCount: 0, syncedIds: [] });
    }

    const syncedIds: string[] = [];

    // Use transaction to upsert attempts safely
    await prisma.$transaction(async (tx) => {
      for (const attempt of attempts) {
        const completedDate = new Date(attempt.completedAt);

        await tx.quizAttempt.upsert({
          where: { id: attempt.id },
          create: {
            id: attempt.id,
            userId: userId,
            subjectId: attempt.subjectId,
            unitId: attempt.unitId || null,
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            correctCount: attempt.correctCount,
            isSynced: true,
            completedAt: isNaN(completedDate.getTime()) ? new Date() : completedDate,
          },
          update: {
            userId: userId || undefined,
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            correctCount: attempt.correctCount,
            isSynced: true,
          },
        });

        syncedIds.push(attempt.id);
      }
    });

    return reply.send({
      syncedCount: syncedIds.length,
      syncedIds,
      timestamp: new Date().toISOString(),
    });
  });
}
