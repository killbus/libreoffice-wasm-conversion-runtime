import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ATTEMPT,
  assertOutside,
  createNew,
  exists,
  inventoryTree,
  readJson,
  sha256File,
  stableJson,
} from './attempt-8-lib.mjs';

const [formalArg, controlArg, outputArg] = process.argv.slice(2);
if (!formalArg || !controlArg || !outputArg) {
  throw new Error('Usage: node attempt-8-close.mjs <formal-root> <invocation-control-root> <closure-output-root>');
}
const formalRoot = path.resolve(formalArg);
const controlRoot = path.resolve(controlArg);
const outputRoot = path.resolve(outputArg);
assertOutside(outputRoot, [formalRoot, controlRoot], 'closure output root');

const markerPath = path.join(controlRoot, 'formal-invocation-start.json');
const supervisorPath = path.join(controlRoot, 'formal-invocation-completion.json');
const completionPath = path.join(formalRoot, 'ATTEMPT-8-FORMAL-COMPLETED.json');
const failurePath = path.join(formalRoot, 'ATTEMPT-8-FORMAL-FAILURE.json');
const invoked = await exists(markerPath);
const marker = invoked ? await readJson(markerPath) : null;
const supervisor = (await exists(supervisorPath)) ? await readJson(supervisorPath) : null;
const completion = (await exists(completionPath)) ? await readJson(completionPath) : null;
const failure = (await exists(failurePath)) ? await readJson(failurePath) : null;
const invocationCount = invoked ? 1 : 0;

let decision = null;
let status = 'NOT_INVOKED';
let reason = 'No formal invocation marker exists; Attempt 8 remains unstarted and has no acceptance decision.';
if (invoked) {
  const passed =
    marker?.attemptNumber === ATTEMPT &&
    marker?.formalInvocationCount === 1 &&
    supervisor?.formalProcessExitCode === 0 &&
    completion?.attemptNumber === ATTEMPT &&
    completion?.status === 'passed' &&
    completion?.networkPolicy === 'offline' &&
    completion?.commandsCompleted === 8 &&
    completion?.expectedCommands === 8 &&
    completion?.retryPerformed === false &&
    !failure;
  decision = passed ? 'PASS' : 'FAIL';
  status = 'CLOSED';
  reason = passed
    ? 'All eight retry-free offline formal gates completed and the runner completion contract is present.'
    : 'Fail-closed closure: a marker exists but the process, completion contract, expected gate count, or no-failure invariant is missing.';
}

const formalInventory = (await exists(formalRoot)) ? await inventoryTree(formalRoot) : null;
const controlInventory = (await exists(controlRoot)) ? await inventoryTree(controlRoot) : null;
const evidenceName = 'acceptance-attempt-8-evidence.json';
const receiptName = decision === 'PASS'
  ? 'acceptance-attempt-8-receipt.accepted.json'
  : decision === 'FAIL'
    ? 'acceptance-attempt-8-receipt.rejected.json'
    : 'acceptance-attempt-8-receipt.not-invoked.json';
const evidencePath = path.join(outputRoot, evidenceName);
const receiptPath = path.join(outputRoot, receiptName);
const reportPath = path.join(outputRoot, 'acceptance-attempt-8-report.md');

const existingEvidence = (await exists(evidencePath)) ? await readJson(evidencePath) : null;
const generatedAt = existingEvidence?.generatedAt ?? new Date().toISOString();
const evidence = {
  schemaVersion: 1,
  kind: 'acceptance-attempt-8-automatic-closure-evidence',
  generatedAt,
  attemptNumber: ATTEMPT,
  status,
  decision,
  formalRoot,
  invocationControlRoot: controlRoot,
  formalInvocationCount: invocationCount,
  formalInvocationMarkerPresent: invoked,
  formalProcessExitCode: supervisor?.formalProcessExitCode ?? null,
  runnerCompletionPresent: Boolean(completion),
  runnerFailurePresent: Boolean(failure),
  commandsCompleted: completion?.commandsCompleted ?? failure?.commandIndex ?? 0,
  expectedCommands: 8,
  retryCount: 0,
  networkPolicy: 'offline',
  preparationEvidenceAdmissible: false,
  dispositionAuditIncluded: false,
  dispositionMayChangeDecision: false,
  reason,
  marker,
  supervisor,
  completion,
  failure,
  formalInventory,
  invocationControlInventory: controlInventory,
};

async function createOrVerify(filePath, content, label) {
  await mkdir(path.dirname(filePath), { recursive: true });
  if (await exists(filePath)) {
    const existing = await readFile(filePath, 'utf8');
    if (existing !== content) throw new Error(`${label} already exists with different content`);
    return 'verified-existing';
  }
  await createNew(filePath, content);
  return 'created';
}

const evidenceWrite = await createOrVerify(evidencePath, stableJson(evidence), 'closure evidence');
const receipt = {
  schemaVersion: 1,
  kind: 'acceptance-attempt-8-automatic-receipt',
  generatedAt,
  attemptNumber: ATTEMPT,
  status,
  decision,
  formalInvocationCount: invocationCount,
  formalRoot,
  evidenceFile: evidenceName,
  evidenceSha256: await sha256File(evidencePath),
  formalRetryPerformed: false,
  continuationPermitted: false,
  backfillPermitted: false,
  preparationClassification: 'not acceptance evidence',
  dispositionClassification: 'post-formal remote disposition audit; not acceptance evidence',
  reason,
};
const receiptWrite = await createOrVerify(receiptPath, stableJson(receipt), 'closure receipt');
const report = [
  '# Acceptance Attempt 8 automatic closure report',
  '',
  `- status: **${status}**`,
  `- decision: **${decision ?? 'null'}**`,
  `- formal invocation count: \`${invocationCount}\``,
  '- formal network policy: `offline`',
  '- formal retry performed: `false`',
  `- runner completion marker present: \`${Boolean(completion)}\``,
  `- formal failure marker present: \`${Boolean(failure)}\``,
  '',
  '## Decision basis',
  '',
  reason,
  '',
  '## Evidence boundaries',
  '',
  'Preparation and pre-invocation verification are explicitly **not acceptance evidence**. The post-formal remote disposition audit is separate, read-only, retryable, excluded from this evidence, and cannot change or backfill the formal decision.',
  '',
  `Evidence: \`${evidenceName}\``,
  `Receipt: \`${receiptName}\``,
  '',
].join('\n');
const reportWrite = await createOrVerify(reportPath, report, 'closure report');
process.stdout.write(`${JSON.stringify({
  status,
  decision,
  formalInvocationCount: invocationCount,
  evidencePath,
  receiptPath,
  reportPath,
  writes: { evidence: evidenceWrite, receipt: receiptWrite, report: reportWrite },
})}\n`);
