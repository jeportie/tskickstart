import fs from 'fs-extra';
import { execa } from 'execa';
import path from 'node:path';
import pc from 'picocolors';

import { prompt } from './prompt.js';

function codeBlock(language, content) {
  return `\`\`\`${language}\n${content}\n\`\`\``;
}

function getProjectTitle(answers) {
  const { projectType } = answers;
  const titles = {
    frontend: 'Frontend Application',
    backend: 'Backend API',
    cli: 'CLI Tool',
    'npm-lib': 'NPM Library',
    app: 'Mobile Application',
  };
  return titles[projectType] || 'Project';
}

function getPrimaryFramework(answers) {
  const { projectType, backendFramework, cliFramework } = answers;

  if (projectType === 'frontend') return 'React + Vite + Tailwind CSS';
  if (projectType === 'backend') {
    const fw = { hono: 'Hono', fastify: 'Fastify', express: 'Express', elysia: 'Elysia (Bun)' };
    return fw[backendFramework] || 'Hono';
  }
  if (projectType === 'cli') {
    const fw = { commander: 'Commander.js', inquirer: 'Inquirer.js', clack: '@clack/prompts' };
    return fw[cliFramework] || 'Commander.js';
  }
  if (projectType === 'npm-lib') return 'TypeScript library + tsup';
  if (projectType === 'app') return 'React Native + Expo';

  return 'TypeScript';
}

function getTestStack(answers) {
  const { projectType, vitestPreset, setupPlaywright, setupAppJest, setupAppDetox } = answers;
  const tests = [];

  if (projectType === 'app') {
    if (setupAppJest) tests.push('Jest');
    if (setupAppDetox) tests.push('Detox');
  } else {
    if (vitestPreset === 'native' || vitestPreset === 'coverage') tests.push('Vitest');
    if (setupPlaywright) tests.push('Playwright');
  }

  return tests.length > 0 ? tests.join(' + ') : 'No test framework configured';
}

function getQualityStack(answers) {
  const { lintOption = [] } = answers;
  const tools = ['TypeScript', 'ESLint', 'Prettier'];
  if (lintOption.includes('cspell')) tools.push('CSpell');
  if (lintOption.includes('secretlint')) tools.push('Secretlint');
  if (lintOption.includes('commitlint')) tools.push('Commitlint');
  return tools.join(', ');
}

function hasCheckScriptTests(answers) {
  const { projectType, vitestPreset, setupAppJest } = answers;
  if (projectType === 'app') return Boolean(setupAppJest);
  return vitestPreset === 'native' || vitestPreset === 'coverage';
}

function getProjectSnapshot(answers) {
  const rows = [
    '| Item | Value |',
    '| --- | --- |',
    `| Project type | ${getProjectTitle(answers)} |`,
    `| Primary stack | ${getPrimaryFramework(answers)} |`,
    `| Testing stack | ${getTestStack(answers)} |`,
    `| Quality stack | ${getQualityStack(answers)} |`,
  ];

  if (answers.setupSemanticRelease) {
    rows.push('| Release automation | semantic-release |');
  }

  return rows.join('\n');
}

function getPrerequisites(answers) {
  const { projectType, backendFramework } = answers;
  const lines = [];

  if (projectType === 'backend' && backendFramework === 'elysia') {
    lines.push('- [Bun](https://bun.sh/) (see `.mise.toml` for pinned version)');
  } else {
    lines.push('- [Node.js](https://nodejs.org/) v22+ (see `.mise.toml` for pinned version)');
  }

  lines.push('- [mise](https://mise.jdx.dev/) (recommended for tool version management)');

  if (projectType === 'app') {
    lines.push('- [Expo CLI](https://docs.expo.dev/get-started/installation/)');
    lines.push('- iOS Simulator (macOS) or Android Emulator');
  }

  return lines.join('\n');
}

function getQuickStart(answers) {
  const { projectType } = answers;
  const commands = ['npm install'];

  if (projectType === 'app') {
    commands.push('npm start');
  } else if (['frontend', 'backend', 'cli'].includes(projectType)) {
    commands.push('npm run dev');
  }

  commands.push('npm run check');

  return `${codeBlock('bash', commands.join('\n'))}\n\nThis sequence installs dependencies, starts the project locally, then runs the full quality gate.`;
}

function getDevelopment(answers) {
  const { projectType, backendFramework } = answers;

  if (projectType === 'frontend') {
    return '```bash\nnpm run dev\n```\n\nOpens the Vite dev server with hot module replacement.';
  }
  if (projectType === 'backend') {
    if (backendFramework === 'elysia') {
      return '```bash\nnpm run dev\n```\n\nStarts the Elysia server with Bun in watch mode.';
    }
    return '```bash\nnpm run dev\n```\n\nStarts the server with `tsx watch` for hot reload.';
  }
  if (projectType === 'cli') {
    return '```bash\nnpm run dev\n```\n\nRuns the CLI directly with `tsx` (no build step needed).';
  }
  if (projectType === 'app') {
    return '```bash\nnpm start\n```\n\nStarts the Expo development server. Scan the QR code with Expo Go or press `i` for iOS / `a` for Android.';
  }
  return '```bash\nnpm run dev\n```';
}

function getBuild(answers) {
  const { projectType } = answers;

  if (projectType === 'frontend') {
    return '```bash\nnpm run build\n```\n\nType-checks and builds for production with Vite. Output in `dist/`.';
  }
  if (projectType === 'backend') {
    return '```bash\nnpm run build\n```\n\nCompiles TypeScript to `dist/`. Run with `npm start`.';
  }
  if (projectType === 'cli' || projectType === 'npm-lib') {
    return '```bash\nnpm run build\n```\n\nBundles with tsup. Output in `dist/`.';
  }
  if (projectType === 'app') {
    return '```bash\nnpx expo run:ios\nnpx expo run:android\n```\n\nBuilds and runs the native app locally.';
  }
  return '';
}

function getTesting(answers) {
  const { projectType, vitestPreset, setupPlaywright, setupAppJest, setupAppDetox } = answers;
  const lines = [];

  if (projectType === 'app') {
    if (setupAppJest) {
      lines.push('```bash\nnpm test\n```\n\nRuns unit tests with Jest + React Native Testing Library.');
    }
    if (setupAppDetox) {
      lines.push(
        '```bash\nnpm run test:e2e:build   # Build the app for testing\nnpm run test:e2e         # Run Detox E2E tests\n```',
      );
    }
    return lines.join('\n\n') || 'No test framework configured.';
  }

  if (vitestPreset === 'native' || vitestPreset === 'coverage') {
    lines.push('```bash\nnpm test              # Run all tests\nnpm run test:unit     # Unit tests only\n```');
    if (vitestPreset === 'coverage') {
      lines.push('```bash\nnpm run test:coverage  # With coverage report\n```');
    }
  }

  if (setupPlaywright) {
    lines.push(
      '```bash\nnpm run test:e2e       # Run Playwright E2E tests\nnpm run test:e2e:ui    # Interactive UI mode\n```',
    );
  }

  return lines.join('\n\n') || 'No test framework configured.';
}

function getProjectStructure(answers) {
  const { projectType } = answers;

  if (projectType === 'frontend') {
    return `\`\`\`
src/
  App.tsx          # Router setup
  Welcome.tsx      # Welcome page component
  main.tsx         # Entry point
  index.css        # Tailwind CSS
tests/
  unit/            # Unit tests
  integration/     # Integration tests
\`\`\``;
  }

  if (projectType === 'backend') {
    return `\`\`\`
src/
  index.ts         # Server entry point
  env.ts           # Environment configuration
tests/
  unit/            # Unit tests
\`\`\``;
  }

  if (projectType === 'cli') {
    return `\`\`\`
src/
  index.ts         # CLI entry point
  commands/
    hello.ts       # Example command
tests/
  unit/            # Unit tests
\`\`\``;
  }

  if (projectType === 'npm-lib') {
    return `\`\`\`
src/
  main.ts          # Library entry point
test/
  main.test.ts     # Tests
\`\`\``;
  }

  if (projectType === 'app') {
    return `\`\`\`
src/
  App.tsx           # Navigation container
  screens/
    HomeScreen.tsx  # Welcome screen
  navigation/
    index.tsx       # Stack navigator
tests/
  unit/             # Jest unit tests
  e2e/              # Detox E2E tests
\`\`\``;
  }

  return '';
}

function getToolsSection(answers) {
  const {
    projectType,
    backendFramework,
    cliFramework,
    lintOption = [],
    vitestPreset,
    setupPlaywright,
    setupAppJest,
    setupAppDetox,
    setupZod,
    setupDocker,
    setupSemanticRelease,
  } = answers;
  const tools = [];

  if (projectType === 'frontend') tools.push('- **React** + **Vite** + **Tailwind CSS v4**');
  if (projectType === 'backend') {
    const fw = { hono: 'Hono', fastify: 'Fastify', express: 'Express', elysia: 'Elysia (Bun)' };
    tools.push(`- **${fw[backendFramework] || 'Hono'}** — HTTP framework`);
    if (setupZod !== false) {
      tools.push('- **Zod** — environment variable validation');
    }
  }
  if (projectType === 'cli') {
    const fw = { commander: 'Commander.js', inquirer: 'Inquirer.js', clack: '@clack/prompts' };
    tools.push(`- **${fw[cliFramework] || 'Commander.js'}** — CLI framework`);
    tools.push('- **tsup** — build tool');
  }
  if (projectType === 'npm-lib') {
    tools.push('- **tsup** — dual CJS/ESM build');
  }
  if (projectType === 'app') {
    tools.push('- **React Native** + **Expo**');
    tools.push('- **React Navigation** v7');
  }

  tools.push('- **TypeScript** — strict type checking');
  tools.push('- **ESLint** v9 + **Prettier** — code quality and formatting');

  if (lintOption.includes('cspell')) tools.push('- **CSpell** — spell checking');
  if (lintOption.includes('secretlint')) tools.push('- **Secretlint** — secret detection');
  if (lintOption.includes('commitlint')) tools.push('- **Commitlint** — conventional commit enforcement');

  if (projectType === 'app') {
    if (setupAppJest) tools.push('- **Jest** + **React Native Testing Library** — unit tests');
    if (setupAppDetox) tools.push('- **Detox** — E2E testing');
  } else {
    if (vitestPreset) tools.push('- **Vitest** — test runner');
    if (setupPlaywright) tools.push('- **Playwright** — E2E testing');
  }

  if (setupDocker) tools.push('- **Docker** — containerized development');
  if (setupSemanticRelease) tools.push('- **semantic-release** — automated versioning and publishing');

  return tools.join('\n');
}

function getImplementationWorkflow(answers) {
  const { projectType, cliFramework, backendFramework } = answers;

  const sourceHint = {
    frontend: '`src/App.tsx`, `src/Welcome.tsx`, and related components',
    backend: '`src/index.ts` for routes and `src/env.ts` for environment validation',
    cli: '`src/index.ts` and `src/commands/` for command handlers',
    'npm-lib': '`src/main.ts` and exported modules',
    app: '`src/screens/`, `src/navigation/`, and reusable components',
  };

  const testHint = {
    frontend: '`tests/unit/` and `tests/integration/`',
    backend: '`tests/unit/server.unit.test.ts` and focused route tests',
    cli: '`tests/unit/hello.unit.test.ts` plus command-specific tests',
    'npm-lib': '`test/main.test.ts` (or `tests/`) for API behavior',
    app: '`tests/unit/` for Jest and `tests/e2e/` for Detox',
  };

  const sections = [
    '1. **Start with one feature slice**: pick one user-facing capability and implement it end-to-end before moving on.',
    `2. **Write code where it belongs**: keep implementation in ${sourceHint[projectType] || '`src/`'}.`,
    `3. **Pair code with tests immediately**: add or update tests in ${testHint[projectType] || '`tests/`'} for every behavior change.`,
    '4. **Run fast feedback loops**: use framework-specific dev commands while coding and keep functions small and composable.',
    `5. **Run the full quality gate before commit**:\n\n${codeBlock('bash', 'npm run check')}`,
  ];

  if (projectType === 'cli' && cliFramework === 'commander') {
    sections.push(`### CLI Tutorial: add a command with Commander.js

Use this pattern when adding a new command with flags and arguments:

${codeBlock(
  'ts',
  "program\n  .command('release')\n  .description('Build and print release notes')\n  .option('-d, --dry-run', 'Preview without publishing')\n  .action((options) => {\n    if (options.dryRun) {\n      console.log('Dry run release');\n      return;\n    }\n    console.log('Release started');\n  });",
)}`);
  }

  if (projectType === 'backend') {
    const backendTutorial = {
      hono: "app.get('/health', (c) => c.json({ ok: true }));",
      fastify: "app.get('/health', async () => ({ ok: true }));",
      express: "app.get('/health', (_req, res) => res.json({ ok: true }));",
      elysia: "app.get('/health', () => ({ ok: true }));",
    };
    sections.push(`### Backend Tutorial: add a health endpoint

${codeBlock('ts', backendTutorial[backendFramework] || backendTutorial.hono)}

After adding the endpoint, validate runtime config in src/env.ts and add a unit test for the route response.`);
  }

  if (projectType === 'frontend') {
    sections.push(`### Frontend Tutorial: build with isolated components

Create focused UI components, then integrate them in src/App.tsx:

${codeBlock(
  'tsx',
  "export function StatusBadge({ online }: { online: boolean }) {\n  return <span>{online ? 'Online' : 'Offline'}</span>;\n}",
)}`);
  }

  if (projectType === 'npm-lib') {
    sections.push(`### Library Tutorial: evolve public API safely

Keep implementation private and export only stable APIs from your entrypoint:

${codeBlock('ts', "export function createSlug(input: string): string {\n  return input.trim().toLowerCase().replace(/\\s+/g, '-');\n}")}`);
  }

  if (projectType === 'app') {
    sections.push(`### Mobile Tutorial: screen-first feature delivery

Start from one screen in src/screens/, wire it in src/navigation/index.tsx, then add a unit test for screen behavior before adding Detox coverage.`);
  }

  return sections.join('\n\n');
}

function getTestingWorkflow(answers) {
  const { projectType, vitestPreset, setupPlaywright, setupAppJest, setupAppDetox } = answers;
  const sections = [
    '1. **Run tests closest to your change first** (unit > integration > e2e).',
    '2. **Keep tests behavior-focused**: assert outputs, side effects, and user-visible outcomes rather than implementation details.',
  ];

  if (projectType === 'app') {
    if (setupAppJest) {
      sections.push(`3. **Unit tests (Jest)**\n\n${codeBlock('bash', 'npm test')}`);
    }
    if (setupAppDetox) {
      sections.push(`4. **E2E tests (Detox)**\n\n${codeBlock('bash', 'npm run test:e2e:build\nnpm run test:e2e')}`);
    }
  } else {
    if (vitestPreset === 'native' || vitestPreset === 'coverage') {
      sections.push(
        `3. **Core test loop (Vitest)**\n\n${codeBlock('bash', 'npm test\nnpm run test:unit\nnpm run test:integration')}`,
      );
    }

    if (vitestPreset === 'coverage') {
      sections.push(`4. **Coverage checks**\n\n${codeBlock('bash', 'npm run test:coverage')}`);
    }

    if (setupPlaywright) {
      sections.push(`5. **E2E checks (Playwright)**\n\n${codeBlock('bash', 'npm run test:e2e')}`);
    }
  }

  sections.push(`6. **Run the release gate before opening a PR**\n\n${codeBlock('bash', 'npm run check')}`);

  return sections.join('\n\n');
}

function getQualityChecksDescription(answers) {
  const checks = ['formatting', 'linting', 'type checking'];
  if (answers.lintOption?.includes('cspell')) checks.push('spell checking');
  if (answers.lintOption?.includes('secretlint')) checks.push('secret scanning');
  if (hasCheckScriptTests(answers)) checks.push('tests');

  if (checks.length === 1) return checks[0];
  if (checks.length === 2) return `${checks[0]} and ${checks[1]}`;
  return `${checks.slice(0, -1).join(', ')}, and ${checks.at(-1)}`;
}

function getToolPlaybooks(answers) {
  const {
    projectType,
    backendFramework,
    cliFramework,
    lintOption = [],
    vitestPreset,
    setupPlaywright,
    setupAppJest,
    setupAppDetox,
    setupZod,
    setupDocker,
    setupSemanticRelease,
  } = answers;

  const blocks = [];

  blocks.push(`### TypeScript

TypeScript is configured in strict mode so type errors fail fast during development and CI.

Use cases:
- Catch invalid states before runtime
- Build safe refactors with editor hints and compiler feedback

${codeBlock(
  'ts',
  'type User = { id: string; name: string };\n\nexport function formatUser(user: User): string {\n  return `${user.name} (${user.id})`;\n}',
)}`);

  blocks.push(`### ESLint + Prettier

ESLint enforces correctness and consistency; Prettier keeps formatting automatic and low-friction.

Use cases:
- Stop common mistakes before commit
- Keep diffs focused on behavior, not formatting

${codeBlock('bash', 'npm run lint\nnpm run format')}`);

  if (projectType === 'frontend') {
    blocks.push(`### React + Vite + Tailwind CSS

This stack gives fast feedback loops, modern component composition, and utility-first styling.

Use cases:
- Build composable UI with reusable components
- Iterate quickly with Vite hot module replacement

${codeBlock(
  'tsx',
  "import { useState } from 'react';\n\nexport function Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount((n) => n + 1)}>Count: {count}</button>;\n}",
)}`);
  }

  if (projectType === 'backend') {
    const backendExamples = {
      hono: "import { Hono } from 'hono';\n\nconst app = new Hono();\napp.get('/health', (c) => c.json({ ok: true }));",
      fastify:
        "import Fastify from 'fastify';\n\nconst app = Fastify();\napp.get('/health', async () => ({ ok: true }));",
      express:
        "import express from 'express';\n\nconst app = express();\napp.get('/health', (_req, res) => res.json({ ok: true }));",
      elysia:
        "import { Elysia } from 'elysia';\n\nconst app = new Elysia();\napp.get('/health', () => ({ ok: true }));",
    };

    const backendLabels = {
      hono: 'Hono',
      fastify: 'Fastify',
      express: 'Express',
      elysia: 'Elysia',
    };

    blocks.push(`### ${backendLabels[backendFramework] || 'Hono'}

Use this framework block as the starting point for routes, middleware, and handlers.

Use cases:
- Add health and status endpoints
- Group domain routes by feature area

${codeBlock('ts', backendExamples[backendFramework] || backendExamples.hono)}`);

    if (setupZod !== false) {
      blocks.push(
        `### Zod

Use Zod in ` +
          '`src/env.ts`' +
          ` to validate runtime configuration at startup.

Use cases:
- Fail fast when required environment variables are missing
- Keep runtime and compile-time assumptions aligned

${codeBlock(
  'ts',
  "import { z } from 'zod';\n\nconst envSchema = z.object({\n  PORT: z.coerce.number().int().positive().default(3000),\n});\n\nexport const env = envSchema.parse(process.env);",
)}`,
      );
    }
  }

  if (projectType === 'cli') {
    if (cliFramework === 'commander') {
      blocks.push(
        `### Commander.js

Commander is ideal for command + option based CLIs with subcommands.

Use cases:
- Build ` +
          '`my-cli hello <name>`' +
          ` style commands
- Add flags like ` +
          '`--dry-run`' +
          ` or ` +
          '`--json`' +
          `

${codeBlock(
  'ts',
  "program\n  .command('hello')\n  .description('Say hello')\n  .argument('[name]', 'name to greet', 'World')\n  .option('-u, --uppercase', 'uppercase output')\n  .action((name, options) => {\n    const value = options.uppercase ? name.toUpperCase() : name;\n    console.log(`Hello ${value}`);\n  });",
)}`,
      );
    }

    if (cliFramework === 'inquirer') {
      blocks.push(`### Inquirer.js

Inquirer is useful when your CLI is wizard-style and user-input-driven.

Use cases:
- Interactive setup flows
- Multi-step input validation

${codeBlock(
  'ts',
  "const { projectName } = await inquirer.prompt([{\n  type: 'input',\n  name: 'projectName',\n  message: 'Project name?',\n}]);",
)}`);
    }

    if (cliFramework === 'clack') {
      blocks.push(`### @clack/prompts

Clack gives a modern, lightweight interactive CLI experience.

Use cases:
- Friendly scaffolding and onboarding commands
- Input flows with polished terminal output

${codeBlock('ts', "const name = await text({ message: 'What is your name?' });")}`);
    }

    blocks.push(
      `### tsup

tsup builds the CLI into distributable files under ` +
        '`dist/`' +
        `.

Use cases:
- Produce fast production builds
- Keep build config concise while supporting TypeScript

${codeBlock('bash', 'npm run build')}`,
    );
  }

  if (projectType === 'npm-lib') {
    blocks.push(`### tsup

tsup produces dual-format package output for modern and legacy consumers.

Use cases:
- Emit both CJS and ESM builds
- Generate declaration files automatically

${codeBlock(
  'ts',
  "import { defineConfig } from 'tsup';\n\nexport default defineConfig({\n  entry: ['src/main.ts'],\n  format: ['cjs', 'esm'],\n  dts: true,\n});",
)}`);
  }

  if (projectType === 'app') {
    blocks.push(`### React Native + Expo

Expo accelerates mobile development while keeping a path to native customization.

Use cases:
- Build cross-platform UI quickly
- Iterate with fast device preview loops

${codeBlock('bash', 'npm start')}`);
  }

  if (vitestPreset === 'native' || vitestPreset === 'coverage') {
    blocks.push(`### Vitest

Vitest is configured for fast test execution and TypeScript-friendly assertions.

Use cases:
- Unit tests for pure functions
- Integration tests for module boundaries

${codeBlock(
  'ts',
  "import { describe, expect, it } from 'vitest';\n\ndescribe('sum', () => {\n  it('adds two numbers', () => {\n    expect(1 + 2).toBe(3);\n  });\n});",
)}`);
  }

  if (setupPlaywright) {
    blocks.push(`### Playwright

Playwright adds browser-level confidence for critical paths.

Use cases:
- Smoke tests for deployment safety
- End-to-end tests across user flows

${codeBlock(
  'ts',
  "import { test, expect } from '@playwright/test';\n\ntest('home page renders', async ({ page }) => {\n  await page.goto('/');\n  await expect(page.getByRole('heading')).toBeVisible();\n});",
)}`);
  }

  if (setupAppJest) {
    blocks.push(`### Jest

Jest is the default test runner for React Native unit tests.

Use cases:
- Component logic verification
- Rendering and interaction assertions

${codeBlock('bash', 'npm test')}`);
  }

  if (setupAppDetox) {
    blocks.push(`### Detox

Detox provides native-level E2E tests for mobile behavior.

Use cases:
- Screen navigation checks
- Device-level interaction flows

${codeBlock('bash', 'npm run test:e2e:build\nnpm run test:e2e')}`);
  }

  if (lintOption.includes('cspell')) {
    blocks.push(`### CSpell

CSpell keeps docs, identifiers, and messages typo-free.

Use cases:
- Avoid typo churn in code review
- Protect generated docs from false spell failures

${codeBlock('json', '{\n  "words": ["tskickstart", "domainTerm", "productName"]\n}')}`);
  }

  if (lintOption.includes('secretlint')) {
    blocks.push(`### Secretlint

Secretlint scans the repository for API keys, tokens, and other accidental secrets.

Use cases:
- Prevent committing sensitive credentials
- Add a safety net before pushes and PRs

${codeBlock('bash', 'npm run secretlint')}`);
  }

  if (lintOption.includes('commitlint')) {
    blocks.push(`### Commitlint

Commitlint enforces predictable commit messages, which helps changelog and release tooling.

Use cases:
- Keep commit history searchable and structured
- Enable automated release note generation

${codeBlock('bash', 'git commit -m "feat(cli): add doctor command"')}`);
  }

  if (setupDocker) {
    blocks.push(
      `### Docker

Docker gives reproducible local environments and simpler onboarding.

Use cases:
- Share the same runtime between developers
- Validate containerized startup before deployment

Use npm scripts or Make targets so both ` +
        '`docker compose`' +
        ` and ` +
        '`docker-compose`' +
        ` environments are supported.

${codeBlock('bash', 'npm run docker:up\nmake docker-up')}`,
    );
  }

  if (setupSemanticRelease) {
    blocks.push(`### semantic-release

semantic-release automates versioning, changelog generation, and publish steps from commit history.

Use cases:
- Publish reliably without manual version bumps
- Produce consistent release notes from Conventional Commits

${codeBlock('bash', 'git commit -m "feat: add user-facing search command"\ngit commit -m "fix: handle empty input in parser"')}`);
  }

  return blocks.join('\n\n');
}

function getScriptsTable(answers) {
  const {
    projectType,
    vitestPreset,
    setupPlaywright,
    setupAppJest,
    setupAppDetox,
    setupDocker,
    lintOption = [],
  } = answers;
  const rows = [];

  rows.push('| Script | Description |');
  rows.push('| --- | --- |');
  rows.push('| `npm run check` | Run all quality checks |');
  rows.push('| `npm run format` | Format code with Prettier |');
  rows.push('| `npm run lint` | Lint with ESLint |');
  rows.push('| `npm run typecheck` | Type-check with TypeScript |');

  if (lintOption.includes('cspell')) rows.push('| `npm run spellcheck` | Check spelling |');
  if (lintOption.includes('secretlint')) rows.push('| `npm run secretlint` | Scan for secrets |');

  if (projectType === 'app') {
    if (setupAppJest) rows.push('| `npm test` | Run Jest unit tests |');
    if (setupAppDetox) {
      rows.push('| `npm run test:e2e` | Run Detox E2E tests |');
      rows.push('| `npm run test:e2e:build` | Build for E2E testing |');
    }
    rows.push('| `npm start` | Start Expo dev server |');
    rows.push('| `npm run android` | Run on Android |');
    rows.push('| `npm run ios` | Run on iOS |');
  } else {
    if (vitestPreset) {
      rows.push('| `npm test` | Run all tests |');
      rows.push('| `npm run test:unit` | Run unit tests |');
      rows.push('| `npm run test:integration` | Run integration tests |');
    }
    if (vitestPreset === 'coverage') rows.push('| `npm run test:coverage` | Tests with coverage |');
    if (setupPlaywright) {
      rows.push('| `npm run test:e2e` | Run Playwright E2E tests |');
      rows.push('| `npm run test:e2e:ui` | Playwright interactive mode |');
    }
    if (['frontend', 'backend', 'cli'].includes(projectType)) {
      rows.push('| `npm run dev` | Start development server |');
    }
    if (['frontend', 'backend', 'cli', 'npm-lib'].includes(projectType)) {
      rows.push('| `npm run build` | Build for production |');
    }
    if (projectType === 'backend' && setupDocker) {
      rows.push('| `npm run docker:up` | Start Docker services with build |');
      rows.push('| `npm run docker:down` | Stop Docker services |');
      rows.push('| `npm run docker:logs` | Tail Docker service logs |');
      rows.push('| `npm run docker:build` | Build Docker services |');
    }
  }

  return rows.join('\n');
}

export function generateReadme(answers) {
  const pkg = answers._pkgName || 'my-project';
  const title = getProjectTitle(answers);

  const sections = [];

  sections.push(
    `# ${pkg}\n\nA ${title.toLowerCase()} scaffolded with [tskickstart](https://github.com/jeportie/tskickstart).`,
  );

  sections.push(`## Project Snapshot\n\n${getProjectSnapshot(answers)}`);

  sections.push(`## Prerequisites\n\n${getPrerequisites(answers)}`);

  sections.push(`## Quick Start\n\n${getQuickStart(answers)}`);

  sections.push(`## Development\n\n${getDevelopment(answers)}`);

  const build = getBuild(answers);
  if (build) sections.push(`## Build\n\n${build}`);

  sections.push(`## Implementation Workflow\n\n${getImplementationWorkflow(answers)}`);

  sections.push(`## Testing\n\n${getTesting(answers)}`);

  sections.push(`## Testing Workflow\n\n${getTestingWorkflow(answers)}`);

  sections.push(
    `## Quality Checks\n\n${codeBlock('bash', 'npm run check')}\n\nRuns ${getQualityChecksDescription(answers)} in sequence.`,
  );

  sections.push(`## Project Structure\n\n${getProjectStructure(answers)}`);

  sections.push(`## Tools\n\n${getToolsSection(answers)}`);

  sections.push(`## Tool Playbooks\n\n${getToolPlaybooks(answers)}`);

  sections.push(`## Scripts Reference\n\n${getScriptsTable(answers)}`);

  return sections.join('\n\n---\n\n') + '\n';
}

export async function writeReadme(answers, cwd) {
  const readmePath = path.join(cwd, 'README.md');
  if (await fs.pathExists(readmePath)) {
    return false;
  }

  const pkgPath = path.join(cwd, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    answers._pkgName = pkg.name || 'my-project';
  }

  const content = generateReadme(answers);
  await fs.writeFile(readmePath, content);
  return true;
}

async function renderReadmeInTerminal(readmePath) {
  const renderers = [
    { command: 'glow', args: [readmePath] },
    { command: 'mdcat', args: [readmePath] },
    { command: 'bat', args: ['--paging=never', '--style=plain', '--language=markdown', readmePath] },
    { command: 'cat', args: [readmePath] },
  ];

  for (const renderer of renderers) {
    try {
      await execa(renderer.command, renderer.args, { stdio: 'inherit' });
      return renderer.command;
    } catch {
      // Try next renderer.
    }
  }

  return null;
}

export async function offerReadmePreview(cwd) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return;

  const readmePath = path.join(cwd, 'README.md');
  if (!(await fs.pathExists(readmePath))) return;

  const { showReadme } = await prompt([
    {
      type: 'confirm',
      name: 'showReadme',
      message: 'Do you want to preview README.md in the terminal now?',
      default: true,
    },
  ]);

  if (!showReadme) return;

  console.log(pc.cyan('\n📘 README.md preview\n'));
  const renderer = await renderReadmeInTerminal(readmePath);

  if (renderer) {
    console.log(pc.dim(`\n(rendered with ${renderer})\n`));
    return;
  }

  const content = await fs.readFile(readmePath, 'utf-8');
  console.log(content);
}
