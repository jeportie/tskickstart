const rawPort = Number(process.env.PORT ?? 3000);

const port = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 3000;

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: port,
};
