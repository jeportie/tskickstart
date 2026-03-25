import fs from 'fs-extra';
import path from 'node:path';

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
  env.ts           # Environment variable validation (zod)
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
    setupDocker,
    setupSemanticRelease,
  } = answers;
  const tools = [];

  // Framework
  if (projectType === 'frontend') tools.push('- **React** + **Vite** + **Tailwind CSS v4**');
  if (projectType === 'backend') {
    const fw = { hono: 'Hono', fastify: 'Fastify', express: 'Express', elysia: 'Elysia (Bun)' };
    tools.push(`- **${fw[backendFramework] || 'Hono'}** — HTTP framework`);
    tools.push('- **Zod** — environment variable validation');
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

  // Quality
  tools.push('- **TypeScript** — strict type checking');
  tools.push('- **ESLint** v9 + **Prettier** — code quality and formatting');

  if (lintOption.includes('cspell')) tools.push('- **CSpell** — spell checking');
  if (lintOption.includes('secretlint')) tools.push('- **Secretlint** — secret detection');
  if (lintOption.includes('commitlint')) tools.push('- **Commitlint** — conventional commit enforcement');

  // Testing
  if (projectType === 'app') {
    if (setupAppJest) tools.push('- **Jest** + **React Native Testing Library** — unit tests');
    if (setupAppDetox) tools.push('- **Detox** — E2E testing');
  } else {
    if (vitestPreset) tools.push('- **Vitest** — test runner');
    if (setupPlaywright) tools.push('- **Playwright** — E2E testing');
  }

  // Infra
  if (setupDocker) tools.push('- **Docker** — containerized development');
  if (setupSemanticRelease) tools.push('- **semantic-release** — automated versioning and publishing');

  return tools.join('\n');
}

function getScriptsTable(answers) {
  const { projectType, vitestPreset, setupPlaywright, setupAppJest, setupAppDetox, lintOption = [] } = answers;
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

  sections.push(`## Prerequisites\n\n${getPrerequisites(answers)}`);

  sections.push(`## Getting Started\n\n\`\`\`bash\nnpm install\n\`\`\``);

  sections.push(`## Development\n\n${getDevelopment(answers)}`);

  const build = getBuild(answers);
  if (build) sections.push(`## Build\n\n${build}`);

  sections.push(`## Testing\n\n${getTesting(answers)}`);

  sections.push(
    `## Quality Checks\n\n\`\`\`bash\nnpm run check\n\`\`\`\n\nRuns formatting, linting, type checking${answers.lintOption?.includes('cspell') ? ', spell checking' : ''}${answers.lintOption?.includes('secretlint') ? ', secret scanning' : ''}, and tests in sequence.`,
  );

  sections.push(`## Project Structure\n\n${getProjectStructure(answers)}`);

  sections.push(`## Tools\n\n${getToolsSection(answers)}`);

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
