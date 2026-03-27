import fs from 'fs-extra';
import path from 'node:path';

function ciWorkflow() {
  return `name: CI\n\non:\n  pull_request:\n\njobs:\n  checks:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v5\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: npm\n      - run: npm ci\n      - run: npm run lint\n      - run: npm run typecheck\n      - run: npm test\n`;
}

function deployWorkflow(name, branch, target) {
  return `name: ${name}\n\non:\n  push:\n    branches:\n      - ${branch}\n\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v5\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: npm\n      - run: npm ci\n      - run: npm run build --if-present\n      - run: 'echo "Deploy target: ${target}"'\n`;
}

function secretsDoc(projectType, target) {
  return `# Required GitHub Secrets\n\nGenerated for **${projectType}** / target **${target}**.\n\n## Common\n- NPM_TOKEN (optional, if publishing)\n\n## Deploy\n- DEPLOY_TOKEN\n- DEPLOY_PROJECT_ID\n\n## Notes\n- Staging deploy workflow runs on pushes to dev.\n- Production deploy workflow runs on pushes to main.\n`;
}

export async function generateCicd(answers, cwd) {
  if (!answers.setupCicd) return;

  const workflowsDir = path.join(cwd, '.github/workflows');
  await fs.ensureDir(workflowsDir);

  await fs.writeFile(path.join(workflowsDir, 'ci.yml'), ciWorkflow());
  await fs.writeFile(
    path.join(workflowsDir, 'deploy-staging.yml'),
    deployWorkflow('Deploy Staging', 'dev', answers.cicdTarget),
  );
  await fs.writeFile(
    path.join(workflowsDir, 'deploy-production.yml'),
    deployWorkflow('Deploy Production', 'main', answers.cicdTarget),
  );

  await fs.ensureDir(path.join(cwd, '.github'));
  await fs.writeFile(path.join(cwd, '.github/SECRETS.md'), secretsDoc(answers.projectType, answers.cicdTarget));
}
