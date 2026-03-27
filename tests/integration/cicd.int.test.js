import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(__dirname, '../../src/index.js');

function createTmpProject() {
  const dir = mkdtempSync(join(tmpdir(), 'tskickstart-cicd-'));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'test-cicd', version: '1.0.0' }, null, 2));
  return dir;
}

function runCli(cwd, extraEnv = {}) {
  execSync(`node ${cliPath}`, {
    cwd,
    env: { ...process.env, NO_INSTALL: '1', PROJECT_TYPE: 'backend', BACKEND_FRAMEWORK: 'hono', ...extraEnv },
    stdio: 'pipe',
  });
}

describe('cicd option', () => {
  let tmpDir;

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('generates ci and deploy workflows with proper triggers', () => {
    tmpDir = createTmpProject();
    runCli(tmpDir, { SETUP_CICD: '1', CICD_TARGET: 'railway' });

    const ci = readFileSync(join(tmpDir, '.github/workflows/ci.yml'), 'utf-8');
    const staging = readFileSync(join(tmpDir, '.github/workflows/deploy-staging.yml'), 'utf-8');
    const prod = readFileSync(join(tmpDir, '.github/workflows/deploy-production.yml'), 'utf-8');

    expect(ci).toContain('pull_request');
    expect(ci).toContain('npm run lint');
    expect(ci).toContain('npm run typecheck');
    expect(ci).toContain('npm test');
    expect(staging).toContain('branches:');
    expect(staging).toContain('- dev');
    expect(prod).toContain('branches:');
    expect(prod).toContain('- main');
  });

  it('includes selected deploy target in generated workflows', () => {
    tmpDir = createTmpProject();
    runCli(tmpDir, { SETUP_CICD: '1', CICD_TARGET: 'flyio' });

    const staging = readFileSync(join(tmpDir, '.github/workflows/deploy-staging.yml'), 'utf-8');
    expect(staging).toContain('Deploy target: flyio');
  });

  it('generates .github/SECRETS.md', () => {
    tmpDir = createTmpProject();
    runCli(tmpDir, { SETUP_CICD: '1', CICD_TARGET: 'docker' });

    expect(existsSync(join(tmpDir, '.github/SECRETS.md'))).toBe(true);
    const secrets = readFileSync(join(tmpDir, '.github/SECRETS.md'), 'utf-8');
    expect(secrets).toContain('Required GitHub Secrets');
    expect(secrets).toContain('DEPLOY_TOKEN');
  });
});
