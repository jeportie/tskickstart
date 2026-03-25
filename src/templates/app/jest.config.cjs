module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./tests/setup.ts'],
  testMatch: ['**/tests/unit/**/*.test.{ts,tsx}'],
};
