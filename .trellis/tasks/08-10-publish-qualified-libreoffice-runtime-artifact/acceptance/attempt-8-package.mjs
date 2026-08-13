import path from 'node:path';
import {
  FIXED,
  NOT_EVIDENCE,
  invariant,
  readJson,
  sha256File,
  writeJson,
} from './attempt-8-lib.mjs';

const files = [
  'attempt-8-protocol.json',
  'attempt-8-lib.mjs',
  'attempt-8-package.mjs',
  'attempt-8-command-launch.ps1',
  'attempt-8-command-launch.tests.ps1',
  'attempt-8-download-assets.mjs',
  'attempt-8-prepare-candidate.tests.mjs',
  'attempt-8-verify-prepared-candidate.mjs',
  'attempt-8-sealed-inputs.mjs',
  'attempt-8-prepare.ps1',
  'attempt-8-formal.ps1',
  'attempt-8-invoke-formal.ps1',
  'attempt-8-close.mjs',
  'attempt-8-disposition-audit.mjs',
  'attempt-8-pre-admission-audit.mjs',
  'attempt-8-handoff-audit.mjs',
  'attempt-8-protocol.tests.mjs',
];

const [mode, rootArg, outputArg] = process.argv.slice(2);
const root = path.resolve(rootArg ?? '.');
const output = path.resolve(outputArg ?? path.join(root, 'attempt-8-command-package.json'));
invariant(['generate', 'verify'].includes(mode), 'usage: generate|verify acceptance-root [manifest]');

async function inventory() {
  const result = [];
  for (const relativePath of files) {
    result.push({
      path: relativePath,
      sha256: await sha256File(path.join(root, relativePath)),
    });
  }
  return result;
}

if (mode === 'generate') {
  await writeJson(output, {
    schemaVersion: 1,
    kind: 'acceptance-attempt-8-command-package',
    attemptNumber: 8,
    generatedAt: new Date().toISOString(),
    admissionStatus: 'NOT ADMITTED',
    eligible: false,
    started: false,
    formalInvocationCount: 0,
    decision: null,
    evidenceStatus: NOT_EVIDENCE,
    fixedInputs: FIXED,
    hashAlgorithm: 'sha256',
    files: await inventory(),
  });
  process.stdout.write(`${output}\n`);
} else {
  const expected = await readJson(output);
  const actualFiles = await inventory();
  invariant(
    expected.schemaVersion === 1 &&
      expected.kind === 'acceptance-attempt-8-command-package' &&
      expected.attemptNumber === 8,
    'package schema mismatch',
  );
  invariant(
    expected.admissionStatus === 'NOT ADMITTED' &&
      expected.eligible === false &&
      expected.started === false &&
      expected.formalInvocationCount === 0 &&
      expected.decision === null &&
      expected.evidenceStatus === NOT_EVIDENCE &&
      expected.hashAlgorithm === 'sha256' &&
      expected.fixedInputs && typeof expected.fixedInputs === 'object' &&
      Array.isArray(expected.files),
    'package pre-admission schema/state mismatch',
  );
  invariant(expected.files.length === files.length, 'package file inventory mismatch');
  invariant(new Set(expected.files.map((entry) => entry.path)).size === expected.files.length, 'package file inventory contains duplicate paths');
  for (const entry of expected.files) {
    invariant(typeof entry.path === 'string' && /^[a-zA-Z0-9._-]+$/.test(entry.path), 'package file path schema mismatch');
    invariant(typeof entry.sha256 === 'string' && /^[0-9a-f]{64}$/.test(entry.sha256), 'package file SHA-256 schema mismatch');
  }
  invariant(JSON.stringify(actualFiles) === JSON.stringify(expected.files), 'command package identity mismatch');
  process.stdout.write(`${JSON.stringify({ status: 'verified', manifest: output, files: actualFiles.length })}\n`);
}
