/** @type {import('jest').Config} */
module.exports = {
  maxWorkers: 1,
  testTimeout: 120000,
  rootDir: '../..',
  testMatch: ['<rootDir>/tests/e2e/**/*.e2e.ts'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  verbose: true,
};
