import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.js';
import { subjectRoutes } from './routes/subjects.js';
import { syncRoutes } from './routes/sync.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : true,
  });

  // Enable CORS
  app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'If-None-Match'],
    exposedHeaders: ['ETag'],
  });

  // JWT configuration
  const jwtSecret = process.env.JWT_SECRET || 'kurazprep-dev-secret-key-change-in-prod';
  app.register(jwt, {
    secret: jwtSecret,
  });

  // Authentication decorator
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized: Invalid or missing token' });
    }
  });

  // Health check route
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'kurazprep-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // API v1 Routes
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(subjectRoutes, { prefix: '/api/v1/subjects' });
  app.register(syncRoutes, { prefix: '/api/v1/sync' });

  return app;
}

export default buildApp;
