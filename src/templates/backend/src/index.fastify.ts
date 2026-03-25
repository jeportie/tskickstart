import Fastify from 'fastify';

import { env } from './env.js';

const app = Fastify({ logger: true });

app.get('/', () => ({ message: 'Hello, World!' }));

app.get('/health', () => ({ status: 'ok' }));

function isTestEnv() {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

export async function startServer(): Promise<void> {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (!isTestEnv()) {
  void startServer();
}

export default app;
