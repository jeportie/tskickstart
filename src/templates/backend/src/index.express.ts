import express from 'express';

import { env } from './env.js';

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

function isTestEnv() {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

export function startServer(): void {
  app.listen(env.PORT, () => {
    console.log(`Server running at http://localhost:${env.PORT}`);
  });
}

if (!isTestEnv()) {
  startServer();
}

export default app;
