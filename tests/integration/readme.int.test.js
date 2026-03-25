import { describe, expect, it } from 'vitest';

import { generateReadme } from '../../src/utils/readme.js';

describe('README generation detail', () => {
  it('includes detailed workflows and tool guides for a CLI stack', () => {
    const content = generateReadme({
      _pkgName: 'demo-cli',
      projectType: 'cli',
      cliFramework: 'commander',
      lintOption: ['cspell'],
      vitestPreset: 'native',
      setupSemanticRelease: true,
    });

    expect(content).toContain('## Implementation Workflow');
    expect(content).toContain('## Testing Workflow');
    expect(content).toContain('## Tool Playbooks');
    expect(content).toContain('### Commander.js');
    expect(content).toContain('### CSpell');
    expect(content).toContain('### semantic-release');
    expect(content).toContain(".command('hello')");
  });

  it('includes backend-specific framework and infra guidance', () => {
    const content = generateReadme({
      _pkgName: 'demo-backend',
      projectType: 'backend',
      backendFramework: 'hono',
      setupDocker: true,
      lintOption: ['secretlint'],
      vitestPreset: 'native',
    });

    expect(content).toContain('### Hono');
    expect(content).toContain('### Zod');
    expect(content).toContain('### Docker');
    expect(content).toContain('### Secretlint');
    expect(content).toContain('src/env.ts');
    expect(content).toContain('npm run docker:up');
  });

  it('omits Zod playbook when backend Zod is disabled', () => {
    const content = generateReadme({
      _pkgName: 'demo-backend-no-zod',
      projectType: 'backend',
      backendFramework: 'hono',
      setupZod: false,
      setupDocker: false,
      vitestPreset: 'native',
    });

    expect(content).not.toContain('### Zod');
    expect(content).not.toContain('**Zod**');
  });
});
