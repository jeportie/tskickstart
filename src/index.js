#!/usr/bin/env node

import fs from 'fs-extra';
import { execa } from 'execa';
import inquirer from 'inquirer';
import pc from 'picocolors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();
const pkgPath = path.join(cwd, 'package.json');

console.log(pc.cyan('\n🔧 tskickstart — setting up the project...\n'));

/* ---------------- ADDITIONAL LINT PROMPTS ---------------- */
let lintOption = [];

if (process.stdin.isTTY) {
  const result = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'lintOption',
      message: 'Select more lint options',
      choices: ['cspell', 'secretlint', 'commitlint'],
    },
  ]);
  lintOption = result.lintOption;
}

/* ---------------- VITEST PROMPT ---------------- */

// VITEST_PRESET can be set to 'native', 'coverage', or 'none' to bypass the prompt
// (used by tests and CI environments where stdin is not a TTY)
let vitestPreset = process.env.VITEST_PRESET;

if (!vitestPreset && process.stdin.isTTY) {
  const { setupVitest } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'setupVitest',
      message: 'Do you want to set up Vitest for testing?',
      default: true,
    },
  ]);

  if (setupVitest) {
    const { preset } = await inquirer.prompt([
      {
        type: 'list',
        name: 'preset',
        message: 'Which Vitest configuration would you like?',
        choices: [
          {
            name: 'Native — vitest',
            value: 'native',
          },
          {
            name: 'Coverage — vitest + @vitest/coverage-v8',
            value: 'coverage',
          },
        ],
      },
    ]);
    vitestPreset = preset;
  }
}

/* ---------------- PRE COMMIT HOOK PROMPT ---------------- */
let setupPrecommit = true;

if (process.stdin.isTTY) {
  const result = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'setupPrecommit',
      message: 'Do you want to set up pre-commit hook (husky + lint-staged)?',
      default: true,
    },
  ]);
  setupPrecommit = result.setupPrecommit;
}

/* ---------------- AUTHOR NAME ---------------- */

// AUTHOR_NAME env var bypasses git config + prompt (used by tests and CI)
let authorName = '';

if (process.env.AUTHOR_NAME !== undefined) {
  authorName = process.env.AUTHOR_NAME;
} else {
  try {
    const { stdout } = await execa('git', ['config', 'github.user']);
    authorName = stdout.trim();
  } catch {
    // github.user not set
  }

  if (!authorName) {
    try {
      const { stdout } = await execa('git', ['config', 'user.name']);
      authorName = stdout.trim();
    } catch {
      // git not available or user.name not set
    }
  }

  if (!authorName && process.stdin.isTTY) {
    const result = await inquirer.prompt([
      {
        type: 'input',
        name: 'authorName',
        message: 'Your name (added to package.json and spell checker):',
      },
    ]);
    authorName = result.authorName.trim();
  }
}

/* ---------------- ENSURE package.json EXISTS ---------------- */

if (!(await fs.pathExists(pkgPath))) {
  console.log(pc.red('\n⨯'), pc.yellow(' No package.json found — running npm init -y...'));
  await execa('npm', ['init', '-y'], { stdout: 'ignore', stderr: 'inherit' });
  const pkg = await fs.readJson(pkgPath);
  pkg.type = 'module';
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  console.log(pc.green('✔') + '  package.json created with "type": "module"');
} else {
  const pkg = await fs.readJson(pkgPath);
  if (pkg.type !== 'module') {
    pkg.type = 'module';
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    console.log(pc.green('✔') + '  package.json — added "type": "module"');
  }
}

/* ---------------- SPINNER HELPER ---------------- */

function startSpinner(text) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  process.stdout.write(`${frames[0]}  ${text}`);
  const id = setInterval(() => {
    process.stdout.write(`\r${pc.cyan(frames[i++ % frames.length])}  ${text}`);
  }, 80);
  return (doneText) => {
    clearInterval(id);
    process.stdout.write(`\r\x1B[K${pc.green('✔')}  ${doneText}\n`);
  };
}

/* ---------------- INSTALL DEPENDENCIES ---------------- */

if (!process.env.NO_INSTALL) {
  const deps = [
    'eslint@^9',
    '@eslint/js@^9',
    'prettier',
    'eslint-config-prettier@^9.1.0',
    'typescript-eslint',
    '@stylistic/eslint-plugin',
    'eslint-plugin-import',
    'eslint-import-resolver-typescript',
    'typescript',
    '@types/node',
  ];

  if (lintOption.includes('secretlint')) {
    deps.push('secretlint', '@secretlint/secretlint-rule-preset-recommend');
  }

  if (lintOption.includes('cspell')) {
    deps.push('cspell', '@cspell/eslint-plugin');
  }

  if (lintOption.includes('commitlint')) {
    deps.push('@commitlint/cli', '@commitlint/config-conventional');
    if (lintOption.includes('cspell')) {
      deps.push('commitlint-plugin-cspell');
    }
  }

  if (setupPrecommit) {
    deps.push('husky', 'lint-staged');
  }

  if (vitestPreset === 'native' || vitestPreset === 'coverage') {
    deps.push('vitest');
  }
  if (vitestPreset === 'coverage') {
    deps.push('@vitest/coverage-v8');
  }

  const stopSpinner = startSpinner('Installing dev dependencies...');
  await execa('npm', ['install', '-D', ...deps], { stdio: 'ignore' });
  stopSpinner('dev dependencies installed');
}

/* ---------------- COPY TEMPLATE FILES ---------------- */
console.log(pc.green('→') + `  copying config files...`);

// --- regular config files (typescript → formatting → linting → testing → commit hooks) ---

if (!(await fs.pathExists(path.join(cwd, 'tsconfig.base.json')))) {
  await fs.copyFile(path.join(__dirname, 'templates/tsconfig.base.json'), path.join(cwd, 'tsconfig.base.json'));
  console.log(pc.green('✔') + '  tsconfig.base.json');
} else {
  console.log(pc.dim('–') + '    tsconfig.base.json (already exists, skipped)');
}

if (!(await fs.pathExists(path.join(cwd, 'tsconfig.json')))) {
  await fs.copyFile(path.join(__dirname, 'templates/tsconfig.json'), path.join(cwd, 'tsconfig.json'));
  console.log(pc.green('✔') + '    tsconfig.json');
} else {
  console.log(pc.dim('–') + '    tsconfig.json (already exists, skipped)');
}

await fs.copyFile(path.join(__dirname, 'templates/prettier.config.js'), path.join(cwd, 'prettier.config.js'));
console.log(pc.green('✔') + '    prettier.config.js');

const eslintConfig = lintOption.includes('cspell') ? 'templates/eslintCspell.config.js' : 'templates/eslint.config.js';
await fs.copyFile(path.join(__dirname, eslintConfig), path.join(cwd, 'eslint.config.js'));
console.log(pc.green('✔') + '    eslint.config.js');

if (lintOption.includes('cspell')) {
  if (!(await fs.pathExists(path.join(cwd, 'cspell.json')))) {
    await fs.copyFile(path.join(__dirname, 'templates/cspell.json'), path.join(cwd, 'cspell.json'));
    console.log(pc.green('✔') + '    cspell.json');
  } else {
    console.log(pc.dim('–') + '    cspell.json (already exists, skipped)');
  }

  if (authorName) {
    const cspellPath = path.join(cwd, 'cspell.json');
    const cspellJson = await fs.readJson(cspellPath);
    if (!cspellJson.words) cspellJson.words = [];
    for (const word of authorName.split(/\s+/).filter(Boolean)) {
      if (!cspellJson.words.includes(word)) cspellJson.words.push(word);
    }
    await fs.writeJson(cspellPath, cspellJson, { spaces: 2 });
  }
}

if (vitestPreset === 'native' || vitestPreset === 'coverage') {
  await fs.copyFile(
    path.join(__dirname, `templates/vitest.config.${vitestPreset}.ts`),
    path.join(cwd, 'vitest.config.ts'),
  );
  console.log(pc.green('✔') + '    vitest.config.ts');
}

if (lintOption.includes('commitlint')) {
  if (!(await fs.pathExists(path.join(cwd, 'commitlint.config.js')))) {
    await fs.copyFile(path.join(__dirname, 'templates/commitlint.config.js'), path.join(cwd, 'commitlint.config.js'));
    console.log(pc.green('✔') + '    commitlint.config.js');
  } else {
    console.log(pc.dim('–') + '    commitlint.config.js (already exists, skipped)');
  }
}

// --- dotfiles (editor/git → formatting → linting → commit hooks) ---

if (!(await fs.pathExists(path.join(cwd, '.editorconfig')))) {
  await fs.copyFile(path.join(__dirname, 'templates/.editorconfig'), path.join(cwd, '.editorconfig'));
  console.log(pc.green('✔') + '    .editorconfig');
} else {
  console.log(pc.dim('–') + '    .editorconfig (already exists, skipped)');
}

if (!(await fs.pathExists(path.join(cwd, '.gitignore')))) {
  await fs.copyFile(path.join(__dirname, 'templates/_gitignore'), path.join(cwd, '.gitignore'));
  console.log(pc.green('✔') + '    .gitignore');
} else {
  console.log(pc.dim('–') + '    .gitignore (already exists, skipped)');
}

if (!(await fs.pathExists(path.join(cwd, '.prettierignore')))) {
  await fs.copyFile(path.join(__dirname, 'templates/.prettierignore'), path.join(cwd, '.prettierignore'));
  console.log(pc.green('✔') + '    .prettierignore');
} else {
  console.log(pc.dim('–') + '    .prettierignore (already exists, skipped)');
}

if (!(await fs.pathExists(path.join(cwd, '.eslintignore')))) {
  await fs.copyFile(path.join(__dirname, 'templates/.eslintignore'), path.join(cwd, '.eslintignore'));
  console.log(pc.green('✔') + '    .eslintignore');
} else {
  console.log(pc.dim('–') + '    .eslintignore (already exists, skipped)');
}

if (lintOption.includes('secretlint')) {
  if (!(await fs.pathExists(path.join(cwd, '.secretlintrc.json')))) {
    await fs.copyFile(path.join(__dirname, 'templates/.secretlintrc.json'), path.join(cwd, '.secretlintrc.json'));
    console.log(pc.green('✔') + '    .secretlintrc.json');
  } else {
    console.log(pc.dim('–') + '    .secretlintrc.json (already exists, skipped)');
  }
}

if (setupPrecommit) {
  const huskyDir = path.join(cwd, '.husky');
  await fs.ensureDir(huskyDir);

  const preCommitDest = path.join(huskyDir, 'pre-commit');
  if (!(await fs.pathExists(preCommitDest))) {
    const lines = ['npx lint-staged', 'npm run typecheck'];
    if (vitestPreset === 'native' || vitestPreset === 'coverage') lines.push('npm run test');
    await fs.writeFile(preCommitDest, lines.join('\n') + '\n');
    console.log(pc.green('✔') + '    .husky/pre-commit');
  } else {
    console.log(pc.dim('–') + '    .husky/pre-commit (already exists, skipped)');
  }

  if (lintOption.includes('commitlint')) {
    const commitMsgDest = path.join(huskyDir, 'commit-msg');
    if (!(await fs.pathExists(commitMsgDest))) {
      await fs.writeFile(commitMsgDest, 'npx commitlint --edit\n');
      console.log(pc.green('✔') + '    .husky/commit-msg');
    } else {
      console.log(pc.dim('–') + '    .husky/commit-msg (already exists, skipped)');
    }
  }
}

// --- project directories ---

const srcDir = path.join(cwd, 'src');
await fs.ensureDir(srcDir);
const mainTs = path.join(srcDir, 'main.ts');
if (!(await fs.pathExists(mainTs))) {
  await fs.writeFile(mainTs, '');
  console.log(pc.green('✔') + '    src/main.ts');
} else {
  console.log(pc.dim('–') + '    src/main.ts (already exists, skipped)');
}

if (vitestPreset === 'native' || vitestPreset === 'coverage') {
  const testDir = path.join(cwd, 'test');
  await fs.ensureDir(testDir);
  console.log(pc.green('✔') + '    test/');
}

/* ---------------- UPDATE package.json SCRIPTS ---------------- */

const pkg = await fs.readJson(pkgPath);

const checkParts = ['npm run format', 'npm run lint', 'npm run typecheck'];
if (lintOption.includes('cspell')) checkParts.push('npm run spellcheck');
if (lintOption.includes('secretlint')) checkParts.push('npm run secretlint');
if (vitestPreset === 'native' || vitestPreset === 'coverage') checkParts.push('npm run test');

pkg.scripts = {
  ...pkg.scripts,
  check: checkParts.join(' && '),
  format: 'prettier . --write',
  lint: 'eslint .',
  typecheck: 'tsc --noEmit',
};

if (lintOption.includes('cspell')) pkg.scripts.spellcheck = 'cspell lint .';
if (lintOption.includes('secretlint')) pkg.scripts.secretlint = 'secretlint **/*';
if (setupPrecommit) pkg.scripts.prepare = 'husky';

if (vitestPreset === 'native' || vitestPreset === 'coverage') {
  pkg.scripts.test = 'vitest --run';
  pkg.scripts['test:unit'] = 'vitest unit --run';
  pkg.scripts['test:integration'] = 'vitest int --run';
}
if (vitestPreset === 'coverage') {
  pkg.scripts['test:coverage'] = 'vitest --coverage --run';
}

if (setupPrecommit) {
  const lintStagedCmds = ['npm run format', 'npm run lint'];
  if (lintOption.includes('cspell')) lintStagedCmds.push('npm run spellcheck');
  if (lintOption.includes('secretlint')) lintStagedCmds.push('npm run secretlint');
  pkg['lint-staged'] = { '**/*': lintStagedCmds };
}

// Set sensible defaults before writing
if (authorName && !pkg.author) pkg.author = authorName;
if (!pkg.license) pkg.license = 'MIT';
if (!pkg.keywords) pkg.keywords = [];
if (!pkg.main || pkg.main === 'index.js') pkg.main = 'src/main.ts';

// Rebuild scripts in preferred order
const scriptOrder = [
  'test',
  'check',
  'format',
  'lint',
  'typecheck',
  'spellcheck',
  'secretlint',
  'prepare',
  'test:unit',
  'test:integration',
  'test:coverage',
  'build',
  'dev',
  'start',
];
const orderedScripts = {};
for (const key of scriptOrder) {
  if (key in pkg.scripts) orderedScripts[key] = pkg.scripts[key];
}
for (const key of Object.keys(pkg.scripts)) {
  if (!(key in orderedScripts)) orderedScripts[key] = pkg.scripts[key];
}
pkg.scripts = orderedScripts;

// Rebuild top-level keys in preferred order
const topLevelOrder = [
  'name',
  'description',
  'version',
  'author',
  'license',
  'keywords',
  'type',
  'main',
  'scripts',
  'devDependencies',
  'dependencies',
];
const organized = {};
for (const key of topLevelOrder) {
  if (key in pkg) organized[key] = pkg[key];
}
for (const key of Object.keys(pkg)) {
  if (!topLevelOrder.includes(key) && key !== 'lint-staged') organized[key] = pkg[key];
}
if (pkg['lint-staged']) organized['lint-staged'] = pkg['lint-staged'];

await fs.writeJson(pkgPath, organized, { spaces: 2 });

const addedScripts = ['check', 'lint', 'format', 'typecheck'];
if (lintOption.includes('cspell')) addedScripts.push('spellcheck');
if (lintOption.includes('secretlint')) addedScripts.push('secretlint');
if (vitestPreset === 'native' || vitestPreset === 'coverage')
  addedScripts.push('test', 'test:unit', 'test:integration');
if (vitestPreset === 'coverage') addedScripts.push('test:coverage');
console.log(pc.green('→') + '  scripts added in package.json:');
for (const script of addedScripts) {
  console.log(pc.green('✔') + `    ${script}`);
}

console.log(pc.green('\n✅ Done!\n'));
