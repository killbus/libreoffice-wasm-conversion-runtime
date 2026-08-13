import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ATTEMPT,
  NOT_EVIDENCE,
  createNew,
  exists,
  invariant,
  readJson,
  sha256File,
  stableJson,
} from './attempt-8-lib.mjs';

const [outputArg, acceptanceRootArg] = process.argv.slice(2);
invariant(outputArg, 'Usage: node attempt-8-pre-admission-audit.mjs <output-json> [acceptance-root]');
const acceptanceRoot = path.resolve(acceptanceRootArg ?? path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (value) => value.slice(1))));
const output = path.resolve(outputArg);
const protocolPath = path.join(acceptanceRoot, 'attempt-8-protocol.json');
const packagePath = path.join(acceptanceRoot, 'attempt-8-command-package.json');
const formalPath = path.join(acceptanceRoot, 'attempt-8-formal.ps1');
const invokePath = path.join(acceptanceRoot, 'attempt-8-invoke-formal.ps1');
const preparePath = path.join(acceptanceRoot, 'attempt-8-prepare.ps1');
const sealedPath = path.join(acceptanceRoot, 'attempt-8-sealed-inputs.mjs');

const protocol = await readJson(protocolPath);
invariant(protocol.attemptNumber === ATTEMPT, 'protocol attempt mismatch');
invariant(protocol.currentState?.status === 'NOT ADMITTED', 'Attempt 8 must remain NOT ADMITTED');
invariant(protocol.currentState?.eligible === false, 'Attempt 8 must remain ineligible');
invariant(protocol.currentState?.started === false, 'Attempt 8 must remain unstarted');
invariant(protocol.currentState?.formalInvocationCount === 0, 'formal invocation count must remain 0');
invariant(protocol.currentState?.decision === null, 'Attempt 8 must not have a decision');
invariant(protocol.currentState?.preparationExecuted === false, 'preparation must not have been executed');

const packageVerification = spawnSync(
  process.execPath,
  [path.join(acceptanceRoot, 'attempt-8-package.mjs'), 'verify', acceptanceRoot, packagePath],
  { encoding: 'utf8' },
);
invariant(packageVerification.status === 0, `command package verification failed: ${packageVerification.stderr || packageVerification.stdout}`);

const formalSource = await readFile(formalPath, 'utf8');
const invokeSource = await readFile(invokePath, 'utf8');
const prepareSource = await readFile(preparePath, 'utf8');
const sealedSource = await readFile(sealedPath, 'utf8');
const forbiddenFormalPatterns = [
  /\b(?:git|gh)\b\s+['"]?(?:clone|fetch|ls-remote|api)/i,
  /Invoke-WebRequest/i,
  /attempt-8-download-assets/i,
  /prepare-libreoffice-runtime-candidate/i,
  /['"]install['"]/i,
  /https:\/\/(?!127\.0\.0\.1|localhost)/i,
];
for (const pattern of forbiddenFormalPatterns) {
  invariant(!pattern.test(formalSource), `formal source contains forbidden network/preparation surface: ${pattern}`);
}
invariant(formalSource.includes("$env:npm_config_offline = 'true'"), 'formal npm offline mode missing');
invariant(formalSource.includes("$env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'"), 'formal browser download guard missing');
invariant(formalSource.includes("$env:ACCEPTANCE_RETRY_POLICY = 'forbidden'"), 'formal retry prohibition missing');

invariant(prepareSource.includes("schemaVersion = 1; kind = 'acceptance-attempt-8-preparation-manifest'; attemptNumber = 8"), 'preparation manifest schema contract missing');
invariant(prepareSource.includes("phase = 'preparation'; classification = 'preparation'; evidenceStatus = 'not acceptance evidence'"), 'preparation boundary schema contract missing');
invariant(prepareSource.includes("retryPermitted = $true; status = 'passed'"), 'preparation passed/retry contract missing');
invariant(prepareSource.includes("formalAttemptStarted = $false; formalInvocationCount = 0; acceptanceDecision = $null"), 'preparation zero-invocation state contract missing');
invariant(sealedSource.includes("p.schemaVersion===1&&p.attemptNumber===ATTEMPT&&p.phase==='preparation'"), 'sealed verifier preparation schema check missing');
invariant(sealedSource.includes("p.evidenceStatus===NOT_EVIDENCE&&p.status==='passed'&&p.retryPermitted===true"), 'sealed verifier preparation status check missing');

const requiredAdmissionBindings = [
  "commandPackageManifestSha256",
  "preparationManifestSha256",
  "sealedInputsManifestSha256",
];
for (const binding of requiredAdmissionBindings) invariant(invokeSource.includes(`$admission.${binding}`), `admission binding missing: ${binding}`);
invariant(invokeSource.includes("$admission.schemaVersion -ne 1"), 'admission schema version check missing');
invariant(invokeSource.includes("$admission.kind -ne 'acceptance-attempt-8-admission'"), 'admission kind check missing');

const admissionIndex = invokeSource.indexOf("$admission.status -ne 'ADMITTED'");
const packageIndex = invokeSource.indexOf("'attempt-8-package.mjs') verify");
const sealedIndex = invokeSource.indexOf("'attempt-8-sealed-inputs.mjs') verify");
const markerIndex = invokeSource.indexOf('[IO.File]::Open($markerPath');
const formalIndex = invokeSource.indexOf("'attempt-8-formal.ps1')");
invariant(
  admissionIndex >= 0 &&
    admissionIndex < packageIndex &&
    packageIndex < sealedIndex &&
    sealedIndex < markerIndex &&
    markerIndex < formalIndex,
  'admission/verifier/marker/formal ordering mismatch',
);

const defaultRoots = [
  'D:\\tmp\\lo-runtime-acceptance-attempt-8-preparation',
  'D:\\tmp\\lo-runtime-acceptance-attempt-8-formal',
  'D:\\tmp\\lo-runtime-acceptance-attempt-8-invocation',
];
const defaultRootChecks = [];
for (const root of defaultRoots) defaultRootChecks.push({ root, exists: await exists(root) });
invariant(defaultRootChecks.every((item) => item.exists === false), 'an Attempt 8 default execution root already exists');

const admissionCandidates = [
  path.join(acceptanceRoot, 'acceptance-attempt-8-admission.json'),
  path.join(acceptanceRoot, 'acceptance-attempt-8-admission.md'),
];
const admissionRecordsPresent = [];
for (const candidate of admissionCandidates) {
  if (await exists(candidate)) admissionRecordsPresent.push(candidate);
}
invariant(admissionRecordsPresent.length === 0, 'Attempt 8 admission record already exists');

const report = {
  schemaVersion: 1,
  kind: 'acceptance-attempt-8-pre-admission-audit',
  generatedAt: new Date().toISOString(),
  attemptNumber: ATTEMPT,
  classification: 'pre-admission protocol audit',
  evidenceStatus: NOT_EVIDENCE,
  passed: true,
  state: {
    status: 'NOT ADMITTED',
    eligible: false,
    started: false,
    formalInvocationCount: 0,
    decision: null,
    preparationExecuted: false,
  },
  execution: {
    preparationRun: false,
    formalRun: false,
    chromiumGateRun: false,
    coldStartSamplesRun: 0,
    dispositionAuditRun: false,
  },
  checks: {
    protocolSchemaAndState: true,
    preparationManifestSchemaContract: true,
    admissionTripleIdentityBinding: true,
    commandPackageIdentity: true,
    formalStaticOfflineBoundary: true,
    markerOrdering: true,
    defaultExecutionRootsAbsent: defaultRootChecks,
    admissionRecordAbsent: true,
  },
  protocol: { path: protocolPath, sha256: await sha256File(protocolPath) },
  commandPackage: { path: packagePath, sha256: await sha256File(packagePath) },
  packageVerifierOutput: packageVerification.stdout.trim(),
  statement: 'Protocol-only pre-admission audit. Not acceptance evidence. Attempt 8 remains NOT ADMITTED with formal invocation count 0.',
};
await createNew(output, stableJson(report));
process.stdout.write(`${JSON.stringify({ passed: true, output, evidenceStatus: NOT_EVIDENCE })}\n`);
