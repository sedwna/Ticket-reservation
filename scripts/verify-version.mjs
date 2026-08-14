import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');
const version = (await readFile(resolve(projectRoot, 'VERSION'), 'utf8')).trim();
const frontendPackage = JSON.parse(await readFile(resolve(projectRoot, 'frontend/package.json'), 'utf8'));
const tag = process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME || '';
const errors = [];

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  errors.push(`VERSION must use SemVer, found ${JSON.stringify(version)}`);
}
if (frontendPackage.version !== version) {
  errors.push(`frontend/package.json is ${frontendPackage.version}, expected ${version}`);
}
if (tag && tag.startsWith('v') && tag.slice(1) !== version) {
  errors.push(`release tag ${tag} does not match v${version}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Version metadata is consistent: v${version}`);
