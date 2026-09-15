import 'dotenv/config';
import { buildApp } from './app.js';

export const app = buildApp();

// Vercel Serverless Function Handler (Zero-configuration entrypoint)
export default async function handler(req: any, res: any) {
  await app.ready();
  app.server.emit('request', req, res);
}

// Local server execution
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  app.listen({ port: PORT, host: HOST }, (err, address) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    console.log(`🚀 KurazPrep Fastify API listening on ${address}`);
  });
}
