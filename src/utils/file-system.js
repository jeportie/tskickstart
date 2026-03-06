import fs from 'fs-extra';
import pc from 'picocolors';
import { fileURLToPath } from 'node:url';

export function templatePath(category, filename) {
  return fileURLToPath(new URL(`../templates/${category}/${filename}`, import.meta.url));
}

export async function copyIfMissing(src, dest, label) {
  if (await fs.pathExists(dest)) {
    console.log(pc.dim('–') + `    ${label} (already exists, skipped)`);
    return false;
  }

  await fs.copyFile(src, dest);
  console.log(pc.green('✔') + `    ${label}`);
  return true;
}
