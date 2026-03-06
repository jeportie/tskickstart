#!/usr/bin/env node

import pc from 'picocolors';

import { generateCommon } from './generators/common.js';
import { askCommonQuestions } from './prompts/common.js';
import { askProjectType } from './prompts/project-type.js';

console.log(pc.cyan('\n🔧 tskickstart — setting up the project...\n'));

const projectType = await askProjectType();
const answers = {
  projectType,
  ...(await askCommonQuestions()),
};

if (projectType === 'frontend') {
  const { askFrontendQuestions } = await import('./prompts/frontend.js');
  Object.assign(answers, await askFrontendQuestions());
}

if (projectType === 'frontend' || projectType === 'fullstack') {
  const { askPlaywrightQuestion } = await import('./prompts/playwright.js');
  Object.assign(answers, await askPlaywrightQuestion(projectType));
}

await generateCommon(answers, process.cwd());

if (projectType === 'frontend') {
  const { generateFrontend } = await import('./generators/frontend.js');
  await generateFrontend(answers, process.cwd());
}

if (answers.setupPlaywright) {
  const { generatePlaywright } = await import('./generators/playwright.js');
  await generatePlaywright(answers, process.cwd());
}

console.log(pc.green('\n✅ Done!\n'));
