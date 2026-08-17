import assert from 'node:assert/strict';
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { sameInventory } from './attempt-8-lib.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const text = (name) => readFile(path.join(root, name), 'utf8');
const packageFiles = [
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

test('protocol remains NOT ADMITTED with zero formal invocations', async () => {
  const protocol = JSON.parse(await text('attempt-8-protocol.json'));
  assert.deepEqual(protocol.currentState, {
    status: 'NOT ADMITTED',
    eligible: false,
    started: false,
    formalInvocationCount: 0,
    decision: null,
    preparationExecuted: false,
  });
  assert.equal(protocol.preparation.evidenceStatus, 'not acceptance evidence');
  assert.equal(protocol.preparation.retryPermitted, true);
  assert.equal(protocol.formal.networkPolicy, 'offline');
  assert.equal(protocol.formal.retryPermitted, false);
  assert.equal(protocol.disposition.readOnly, true);
  assert.equal(protocol.disposition.retryPermitted, true);
  assert.equal(protocol.disposition.mayBackfillFormalEvidence, false);
});

test('all network and workspace preparation operations are outside formal', async () => {
  const preparation = await text('attempt-8-prepare.ps1');
  const formal = await text('attempt-8-formal.ps1');
  for (const pattern of [
    /-Executable 'git' -Arguments @\('clone'/,
    /-Executable 'git' -Arguments @\('ls-remote'/,
    /-Executable 'gh' -Arguments @\('api'/,
    /attempt-8-download-assets\.mjs/,
    /-Executable 'pnpm' -Arguments @\('install'/,
    /@\('exec', 'playwright', 'install', 'chromium'\)/,
    /prepare-libreoffice-runtime-candidate\.mjs/,
  ]) assert.match(preparation, pattern);
  for (const pattern of [
    /-Executable '(?:git|gh)'/i,
    /['"](?:clone|fetch|ls-remote|install)['"]/i,
    /download-assets/i,
    /prepare-libreoffice-runtime-candidate/i,
    /Invoke-WebRequest/i,
    /https:\/\/(?!127\.0\.0\.1|localhost)/i,
  ]) assert.doesNotMatch(formal, pattern);
  assert.match(formal, /npm_config_offline = 'true'/);
  assert.match(formal, /PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'/);
  assert.match(formal, /ACCEPTANCE_RETRY_POLICY = 'forbidden'/);
  assert.match(formal, /npm_config_registry = 'http:\/\/127\.0\.0\.1:9\/'/);
});

test('preparation retries reset generated reports as well as work roots', async () => {
  const preparation = await text('attempt-8-prepare.ps1');
  assert.match(preparation, /-ResetPaths @\(\$Extract, \$ArchiveVerification\)/);
  assert.match(preparation, /-ResetPaths @\(\$ContractWork, \$ContractReport\)/);
  assert.match(preparation, /classification = 'preparation'/);
  assert.match(preparation, /evidenceStatus = 'not acceptance evidence'/);
  assert.match(preparation, /retryPermitted = \$true/);
});

test('marker follows every verifier and precedes the formal runner', async () => {
  const source = await text('attempt-8-invoke-formal.ps1');
  const admission = source.indexOf("$admission.status -ne 'ADMITTED'");
  const packageVerify = source.indexOf("'attempt-8-package.mjs') verify");
  const sealedVerify = source.indexOf("'attempt-8-sealed-inputs.mjs') verify");
  const verificationRecord = source.indexOf("'pre-invocation-verification.json'");
  const marker = source.indexOf('[IO.File]::Open($markerPath');
  const formal = source.indexOf("'attempt-8-formal.ps1')");
  assert.ok(
    admission >= 0 &&
      admission < packageVerify &&
      packageVerify < sealedVerify &&
      sealedVerify < verificationRecord &&
      verificationRecord < marker &&
      marker < formal,
  );
  assert.match(source.slice(marker, formal), /\$markerHandle\.Dispose\(\)/);
  assert.doesNotMatch(source.slice(marker, formal), /&\s+(?:node|pnpm|git|gh)\b/i);
});

test('a failed pre-marker admission check creates no marker or formal root', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'attempt8-pre-marker-'));
  try {
    const admission = path.join(temp, 'admission.json');
    const preparation = path.join(temp, 'preparation');
    const formal = path.join(temp, 'formal');
    const control = path.join(temp, 'control');
    const closure = path.join(temp, 'closure');
    await mkdir(preparation);
    await writeFile(admission, JSON.stringify({
      attemptNumber: 8,
      status: 'NOT ADMITTED',
      eligible: false,
      started: false,
      formalInvocationCount: 0,
      decision: null,
    }));
    const result = spawnSync('pwsh', [
      '-NoLogo', '-NoProfile', '-File', path.join(root, 'attempt-8-invoke-formal.ps1'),
      '-PreparationRoot', preparation,
      '-FormalRoot', formal,
      '-InvocationControlRoot', control,
      '-AdmissionRecord', admission,
      '-ClosureOutputRoot', closure,
    ], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Admission record is missing schemaVersion/);
    assert.equal(spawnSync('pwsh', ['-NoProfile', '-Command', `Test-Path -LiteralPath '${control}'`], { encoding: 'utf8' }).stdout.trim(), 'False');
    assert.equal(spawnSync('pwsh', ['-NoProfile', '-Command', `Test-Path -LiteralPath '${formal}'`], { encoding: 'utf8' }).stdout.trim(), 'False');
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('ADMITTED record must bind command package, preparation manifest, and sealed inputs before any marker', async () => {
  const source = await text('attempt-8-invoke-formal.ps1');
  assert.match(source, /\$admission\.schemaVersion -ne 1/);
  assert.match(source, /\$admission\.kind -ne 'acceptance-attempt-8-admission'/);
  assert.match(source, /\$admission\.commandPackageManifestSha256 -cne \$packageHash/);
  assert.match(source, /\$admission\.preparationManifestSha256 -cne \$preparationHashBeforeVerification/);
  assert.match(source, /\$admission\.sealedInputsManifestSha256 -cne \$sealedHashBeforeVerification/);
  assert.match(source, /preparationManifestSha256 = \$preparationHash/);
  assert.match(source, /sealedInputsManifestSha256 = \$sealedHash/);
});

test('ADMITTED record missing sealed-input identity fails before marker and formal-root creation', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'attempt8-missing-sealed-binding-'));
  try {
    const admission = path.join(temp, 'admission.json');
    const preparation = path.join(temp, 'preparation');
    const formal = path.join(temp, 'formal');
    const control = path.join(temp, 'control');
    const closure = path.join(temp, 'closure');
    await mkdir(preparation);
    const preparationManifest = path.join(preparation, 'attempt-8-preparation-manifest.json');
    const sealedManifest = path.join(preparation, 'attempt-8-sealed-inputs.json');
    await writeFile(preparationManifest, '{}\n');
    await writeFile(sealedManifest, '{}\n');
    const packageManifestSha256 = spawnSync('pwsh', ['-NoProfile', '-Command', `(Get-FileHash -Algorithm SHA256 -LiteralPath '${path.join(root, 'attempt-8-command-package.json').replaceAll("'", "''")}').Hash.ToLowerInvariant()`], { encoding: 'utf8' }).stdout.trim();
    const preparationManifestSha256 = spawnSync('pwsh', ['-NoProfile', '-Command', `(Get-FileHash -Algorithm SHA256 -LiteralPath '${preparationManifest.replaceAll("'", "''")}').Hash.ToLowerInvariant()`], { encoding: 'utf8' }).stdout.trim();
    await writeFile(admission, JSON.stringify({
      schemaVersion: 1,
      kind: 'acceptance-attempt-8-admission',
      attemptNumber: 8,
      status: 'ADMITTED',
      eligible: true,
      started: false,
      formalInvocationCount: 0,
      decision: null,
      commandPackageManifestSha256: packageManifestSha256,
      preparationManifestSha256,
    }));
    const result = spawnSync('pwsh', [
      '-NoLogo', '-NoProfile', '-File', path.join(root, 'attempt-8-invoke-formal.ps1'),
      '-PreparationRoot', preparation,
      '-FormalRoot', formal,
      '-InvocationControlRoot', control,
      '-AdmissionRecord', admission,
      '-ClosureOutputRoot', closure,
    ], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing sealedInputsManifestSha256/);
    assert.equal(spawnSync('pwsh', ['-NoProfile', '-Command', `Test-Path -LiteralPath '${control}'`], { encoding: 'utf8' }).stdout.trim(), 'False');
    assert.equal(spawnSync('pwsh', ['-NoProfile', '-Command', `Test-Path -LiteralPath '${formal}'`], { encoding: 'utf8' }).stdout.trim(), 'False');
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('sealed inventory equality is canonical across persisted JSON key order', () => {
  const actual = {
    fileCount: 1,
    totalBytes: 3,
    inventorySha256: 'inventory-hash',
    files: [{ path: 'fixture.bin', bytes: 3, sha256: 'file-hash' }],
  };
  const persisted = {
    fileCount: 1,
    totalBytes: 3,
    inventorySha256: 'inventory-hash',
    files: [{ bytes: 3, path: 'fixture.bin', sha256: 'file-hash' }],
  };
  assert.doesNotThrow(() => sameInventory(actual, persisted, 'fixture'));
  assert.throws(
    () => sameInventory(actual, { ...persisted, files: [{ bytes: 4, path: 'fixture.bin', sha256: 'other' }] }, 'fixture'),
    /fixture exact inventory changed/,
  );
});

test('preparation manifest and command-package schemas are explicit and fail-closed', async () => {
  const preparation = await text('attempt-8-prepare.ps1');
  const sealed = await text('attempt-8-sealed-inputs.mjs');
  const packageSource = await text('attempt-8-package.mjs');
  assert.match(preparation, /kind = 'acceptance-attempt-8-preparation-manifest'/);
  assert.match(preparation, /status = 'passed'/);
  assert.match(preparation, /formalInvocationCount = 0/);
  assert.match(sealed, /preparation schema mismatch/);
  assert.match(sealed, /preparation boundary\/status mismatch/);
  assert.match(packageSource, /expected\.schemaVersion === 1/);
  assert.match(packageSource, /expected\.hashAlgorithm === 'sha256'/);
  assert.match(packageSource, /package file inventory mismatch/);
});

test('handoff audit checks protocol, package, pre-audit, handoff, and task consistency', async () => {
  const source = await text('attempt-8-handoff-audit.mjs');
  for (const fragment of [
    "protocol schema mismatch",
    "command package schema/state mismatch",
    "pre-admission audit schema/status mismatch",
    "handoff missing required fragment",
    "task command-package identity mismatch",
    "task pre-admission audit identity mismatch",
    "not acceptance evidence",
  ]) assert.match(source, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
});

test('formal runner contains exactly eight retry-free local behavior gates', async () => {
  const source = await text('attempt-8-formal.ps1');
  assert.match(source, /node-candidate-positive-negative-reuse-recovery-abi-cleanup/);
  assert.match(source, /pdfhow-full-retry-free-chromium-candidate-gate/);
  assert.match(source, /for \(\$sample = 1; \$sample -le 5; \$sample\+\+\)/);
  assert.match(source, /final-prepared-candidate-invariance/);
  assert.match(source, /expectedCommands = 8/);
  assert.doesNotMatch(source, /Start-Sleep|MaxAttempts|retryPermitted = \$true/);
});

test('command package verification fails after a packaged file is tampered', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'attempt8-package-'));
  try {
    for (const name of packageFiles) await copyFile(path.join(root, name), path.join(temp, name));
    const manifest = path.join(temp, 'attempt-8-command-package.json');
    let result = spawnSync(process.execPath, [path.join(temp, 'attempt-8-package.mjs'), 'generate', temp, manifest], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    result = spawnSync(process.execPath, [path.join(temp, 'attempt-8-package.mjs'), 'verify', temp, manifest], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    await writeFile(path.join(temp, 'attempt-8-protocol.json'), '{}\n');
    result = spawnSync(process.execPath, [path.join(temp, 'attempt-8-package.mjs'), 'verify', temp, manifest], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /command package identity mismatch/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('automatic closure emits PASS evidence, receipt, and report without disposition data', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'attempt8-close-pass-'));
  try {
    const formal = path.join(temp, 'formal');
    const control = path.join(temp, 'control');
    const output = path.join(temp, 'output');
    await mkdir(path.join(formal, 'evidence'), { recursive: true });
    await mkdir(control);
    await writeFile(path.join(formal, 'evidence', 'gate.log'), 'ok');
    await writeFile(path.join(control, 'formal-invocation-start.json'), JSON.stringify({ attemptNumber: 8, formalInvocationCount: 1 }));
    await writeFile(path.join(control, 'formal-invocation-completion.json'), JSON.stringify({ formalProcessExitCode: 0 }));
    await writeFile(path.join(formal, 'ATTEMPT-8-FORMAL-COMPLETED.json'), JSON.stringify({ attemptNumber: 8, status: 'passed', networkPolicy: 'offline', commandsCompleted: 8, expectedCommands: 8, retryPerformed: false }));
    const result = spawnSync(process.execPath, [path.join(root, 'attempt-8-close.mjs'), formal, control, output], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const evidence = JSON.parse(await readFile(path.join(output, 'acceptance-attempt-8-evidence.json'), 'utf8'));
    assert.equal(evidence.decision, 'PASS');
    assert.equal(evidence.formalInvocationCount, 1);
    assert.equal(evidence.dispositionAuditIncluded, false);
    assert.equal(evidence.preparationEvidenceAdmissible, false);
    await readFile(path.join(output, 'acceptance-attempt-8-receipt.accepted.json'));
    await readFile(path.join(output, 'acceptance-attempt-8-report.md'));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('automatic closure is idempotent when prior artifacts are byte-identical', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'attempt8-close-idempotent-'));
  try {
    const formal = path.join(temp, 'formal');
    const control = path.join(temp, 'control');
    const output = path.join(temp, 'output');
    await mkdir(path.join(formal, 'evidence'), { recursive: true });
    await mkdir(control);
    await writeFile(path.join(formal, 'evidence', 'gate.log'), 'ok');
    await writeFile(path.join(control, 'formal-invocation-start.json'), JSON.stringify({ attemptNumber: 8, formalInvocationCount: 1 }));
    await writeFile(path.join(control, 'formal-invocation-completion.json'), JSON.stringify({ formalProcessExitCode: 0 }));
    await writeFile(path.join(formal, 'ATTEMPT-8-FORMAL-COMPLETED.json'), JSON.stringify({ attemptNumber: 8, status: 'passed', networkPolicy: 'offline', commandsCompleted: 8, expectedCommands: 8, retryPerformed: false }));
    const args = [path.join(root, 'attempt-8-close.mjs'), formal, control, output];
    const first = spawnSync(process.execPath, args, { encoding: 'utf8' });
    assert.equal(first.status, 0, first.stderr);
    const second = spawnSync(process.execPath, args, { encoding: 'utf8' });
    assert.equal(second.status, 0, second.stderr);
    assert.deepEqual(JSON.parse(second.stdout).writes, {
      evidence: 'verified-existing',
      receipt: 'verified-existing',
      report: 'verified-existing',
    });
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
test('closure fails closed when a marker exists without a complete runner contract', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'attempt8-close-fail-'));
  try {
    const formal = path.join(temp, 'formal');
    const control = path.join(temp, 'control');
    const output = path.join(temp, 'output');
    await mkdir(control, { recursive: true });
    await writeFile(path.join(control, 'formal-invocation-start.json'), JSON.stringify({ attemptNumber: 8, formalInvocationCount: 1 }));
    const result = spawnSync(process.execPath, [path.join(root, 'attempt-8-close.mjs'), formal, control, output], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const evidence = JSON.parse(await readFile(path.join(output, 'acceptance-attempt-8-evidence.json'), 'utf8'));
    assert.equal(evidence.status, 'CLOSED');
    assert.equal(evidence.decision, 'FAIL');
    assert.equal(evidence.formalInvocationCount, 1);
    await readFile(path.join(output, 'acceptance-attempt-8-receipt.rejected.json'));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('closure without a marker preserves invocation count zero and no decision', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'attempt8-not-invoked-'));
  try {
    const formal = path.join(temp, 'formal');
    const control = path.join(temp, 'control');
    const output = path.join(temp, 'output');
    await mkdir(control);
    const result = spawnSync(process.execPath, [path.join(root, 'attempt-8-close.mjs'), formal, control, output], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const evidence = JSON.parse(await readFile(path.join(output, 'acceptance-attempt-8-evidence.json'), 'utf8'));
    assert.equal(evidence.status, 'NOT_INVOKED');
    assert.equal(evidence.decision, null);
    assert.equal(evidence.formalInvocationCount, 0);
    await readFile(path.join(output, 'acceptance-attempt-8-receipt.not-invoked.json'));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('disposition audit rejects output inside formal evidence before any remote query', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'attempt8-disposition-'));
  try {
    const formal = path.join(temp, 'formal');
    await mkdir(formal);
    const output = path.join(formal, 'disposition.json');
    const result = spawnSync(process.execPath, [path.join(root, 'attempt-8-disposition-audit.mjs'), output, formal], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must be outside/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
