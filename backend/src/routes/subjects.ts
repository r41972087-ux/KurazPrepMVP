import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/prisma.js';
import { getSubjectDeltaSync } from '../services/syncService.js';

interface SubjectSyncQuery {
  sinceHash?: string;
}

export async function subjectRoutes(fastify: FastifyInstance) {
  // List all subjects with optional filtering by stream and gradeLevel
  fastify.get('/', async (request: FastifyRequest<{
    Querystring: {
      stream?: 'NATURAL' | 'SOCIAL';
      gradeLevel?: string;
    };
  }>, reply: FastifyReply) => {
    const { stream, gradeLevel } = request.query;

    const subjects = await prisma.subject.findMany({
      where: {
        ...(stream ? { stream } : {}),
        ...(gradeLevel ? { gradeLevel: parseInt(gradeLevel, 10) } : {}),
      },
      include: {
        syncMetadata: {
          select: { contentHash: true, version: true, lastUpdated: true },
        },
        _count: {
          select: { units: true },
        },
      },
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
    });

    return reply.send({
      subjects: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        stream: s.stream,
        gradeLevel: s.gradeLevel,
        icon: s.icon,
        totalUnits: s._count.units,
        contentHash: s.syncMetadata?.contentHash ?? null,
        version: s.syncMetadata?.version ?? 0,
        updatedAt: s.updatedAt,
      })),
    });
  });

  // Get specific subject with units tree
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: { unitNumber: 'asc' },
          include: {
            _count: {
              select: { shortNotes: true, questions: true },
            },
          },
        },
        syncMetadata: true,
      },
    });

    if (!subject) {
      return reply.status(404).send({ error: 'Subject not found' });
    }

    return reply.send({
      subject: {
        id: subject.id,
        name: subject.name,
        stream: subject.stream,
        gradeLevel: subject.gradeLevel,
        icon: subject.icon,
        contentHash: subject.syncMetadata?.contentHash ?? null,
        units: subject.units.map((u) => ({
          id: u.id,
          unitNumber: u.unitNumber,
          title: u.title,
          notesCount: u._count.shortNotes,
          questionsCount: u._count.questions,
        })),
      },
    });
  });

  // DELTA SYNC ENDPOINT: GET /api/v1/subjects/:id/sync
  // Supports query ?sinceHash=... or header If-None-Match
  fastify.get('/:id/sync', async (request: FastifyRequest<{
    Params: { id: string };
    Querystring: SubjectSyncQuery;
  }>, reply: FastifyReply) => {
    const { id } = request.params;
    const clientHash =
      request.query.sinceHash ||
      request.headers['if-none-match']?.replace(/"/g, '');

    try {
      const result = await getSubjectDeltaSync(id, clientHash);

      if (result.notModified) {
        return reply.status(304).send();
      }

      if (!result.data) {
        return reply.status(500).send({ error: 'Failed to generate sync payload' });
      }

      // Send ETag header for HTTP caching
      reply.header('ETag', `"${result.data.contentHash}"`);
      return reply.status(200).send(result.data);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return reply.status(404).send({ error: err.message });
      }
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to synchronize subject curriculum' });
    }
  });
}
