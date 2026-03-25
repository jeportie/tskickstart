import { Elysia } from 'elysia';

import { env } from './env.js';

const app = new Elysia().get('/', () => ({ message: 'Hello, World!' })).get('/health', () => ({ status: 'ok' }));

function isTestEnv() {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

export function startServer(): void {
  app.listen(env.PORT);
  console.log(`Server running at http://localhost:${env.PORT}`);
}

if (!isTestEnv()) {
  startServer();
}

export default app;
