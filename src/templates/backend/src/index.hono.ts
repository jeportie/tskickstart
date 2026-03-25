import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import { env } from './env.js';

const app = new Hono();

app.get('/', (c) => c.json({ message: 'Hello, World!' }));

app.get('/health', (c) => c.json({ status: 'ok' }));

function isTestEnv() {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

export function startServer(): void {
  serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
  });
}

if (!isTestEnv()) {
  startServer();
}

export default app;
