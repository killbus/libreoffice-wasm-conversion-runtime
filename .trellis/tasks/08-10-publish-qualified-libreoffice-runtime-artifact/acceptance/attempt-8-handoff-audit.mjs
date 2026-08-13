import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ATTEMPT,
  NOT_EVIDENCE,
  createNew,
  invariant,
  readJson,
  sha256File,
  stableJson,
} from './attempt-8-lib.mjs';

const [outputArg, acceptanceRootArg, taskPathArg] = process.argv.slice(2);
invariant(outputArg, 'Usage: node attempt-8-handoff-audit.mjs <output-json> [acceptance-root] [task-json]');
const acceptanceRoot = path.resolve(
  acceptanceRootArg ?? path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (value) => value.slice(1))),
);
const taskPath = path.resolve(taskPathArg ?? path.join(acceptanceRoot, '..', 'task.json'));
const output = path.resolve(outputArg);
const protocolPath = path.join(acceptanceRoot, 'attempt-8-protocol.json');
const packagePath = path.join(acceptanceRoot, 'attempt-8-command-package.json');
const preAuditPath = path.join(acceptanceRoot, 'acceptance-attempt-8-pre-admission-audit.json');
const handoffPath = path.join(acceptanceRoot, 'acceptance-attempt-8-handoff.md');

const [protocol, commandPackage, preAudit, task, handoff] = await Promise.all([
  readJson(protocolPath),
  readJson(packagePath),
  readJson(preAuditPath),
  readJson(taskPath),
  readFile(handoffPath, 'utf8'),
]);
const packageSha256 = await sha256File(packagePath);
const preAuditSha256 = await sha256File(preAuditPath);

invariant(
  protocol.schemaVersion === 1 &&
    protocol.kind === 'acceptance-attempt-8-phase-separated-protocol' &&
    protocol.attemptNumber === ATTEMPT,
  'protocol schema mismatch',
);
invariant(
  protocol.currentState?.status === 'NOT ADMITTED' &&
    protocol.currentState?.eligible === false &&
    protocol.currentState?.started === false &&
    protocol.currentState?.formalInvocationCount === 0 &&
    protocol.currentState?.decision === null &&
    protocol.currentState?.preparationExecuted === false,
  'protocol state mismatch',
);
invariant(
  commandPackage.schemaVersion === 1 &&
    commandPackage.kind === 'acceptance-attempt-8-command-package' &&
    commandPackage.attemptNumber === ATTEMPT &&
    commandPackage.admissionStatus === 'NOT ADMITTED' &&
    commandPackage.eligible === false &&
    commandPackage.started === false &&
    commandPackage.formalInvocationCount === 0 &&
    commandPackage.decision === null &&
    commandPackage.evidenceStatus === NOT_EVIDENCE &&
    commandPackage.hashAlgorithm === 'sha256' &&
    Array.isArray(commandPackage.files),
  'command package schema/state mismatch',
);
invariant(
  preAudit.schemaVersion === 1 &&
    preAudit.kind === 'acceptance-attempt-8-pre-admission-audit' &&
    preAudit.attemptNumber === ATTEMPT &&
    preAudit.classification === 'pre-admission protocol audit' &&
    preAudit.evidenceStatus === NOT_EVIDENCE &&
    preAudit.passed === true,
  'pre-admission audit schema/status mismatch',
);
invariant(preAudit.commandPackage?.sha256 === packageSha256, 'pre-admission audit command-package identity mismatch');

const requiredHandoffFragments = [
  'Acceptance state: **NOT ADMITTED**',
  'Eligible: `false`',
  'Started: `false`',
  'Formal invocation count: `0`',
  'Decision: `null`',
  'Preparation executed: `false`',
  'Evidence classification: **not acceptance evidence**',
  `SHA-256 ${packageSha256}`,
  `SHA-256 ${preAuditSha256}`,
  'acceptance/acceptance-attempt-8-handoff-audit.json',
  'preparationManifestSha256',
  'sealedInputsManifestSha256',
];
for (const fragment of requiredHandoffFragments) invariant(handoff.includes(fragment), `handoff missing required fragment: ${fragment}`);

const meta = task.meta;
invariant(meta && typeof meta === 'object', 'task meta missing');
const expectedTaskState = {
  attempt8AdmissionStatus: 'NOT ADMITTED',
  attempt8Eligible: false,
  attempt8Started: false,
  attempt8Decision: null,
  attempt8FormalInvocationCount: 0,
  teamBPreparedAttempt8: false,
  teamBExecutedAttempt8: false,
  attempt8PreAdmissionAuditPassed: true,
  attempt8PreAdmissionEvidenceClassification: NOT_EVIDENCE,
};
for (const [key, value] of Object.entries(expectedTaskState)) invariant(meta[key] === value, `task meta ${key} mismatch`);
invariant(meta.attempt8CommandPackageSha256 === packageSha256, 'task command-package identity mismatch');
invariant(meta.attempt8PreAdmissionAuditSha256 === preAuditSha256, 'task pre-admission audit identity mismatch');
invariant(meta.attempt8ProtocolTestsFailed === 0, 'task records protocol test failures');
invariant(meta.attempt8HandoffAudit === '.trellis/tasks/08-10-publish-qualified-libreoffice-runtime-artifact/acceptance/acceptance-attempt-8-handoff-audit.json', 'task handoff audit path mismatch');
invariant(meta.attempt8HandoffAuditEvidenceClassification === NOT_EVIDENCE, 'task handoff audit classification mismatch');

const report = {
  schemaVersion: 1,
  kind: 'acceptance-attempt-8-handoff-consistency-audit',
  generatedAt: new Date().toISOString(),
  attemptNumber: ATTEMPT,
  classification: 'pre-admission handoff consistency audit',
  evidenceStatus: NOT_EVIDENCE,
  passed: true,
  state: protocol.currentState,
  checks: {
    protocolSchemaAndState: true,
    commandPackageSchemaStateAndIdentity: true,
    preAdmissionAuditSchemaStatusAndIdentity: true,
    handoffStateIdentityAndBindingContract: true,
    taskStateAndIdentity: true,
  },
  protocol: { path: protocolPath, sha256: await sha256File(protocolPath) },
  commandPackage: { path: packagePath, sha256: packageSha256 },
  preAdmissionAudit: { path: preAuditPath, sha256: preAuditSha256 },
  handoff: { path: handoffPath, sha256: await sha256File(handoffPath) },
  task: { path: taskPath, sha256: await sha256File(taskPath) },
  statement: 'Handoff/schema/state/identity consistency audit only. Not acceptance evidence. Attempt 8 remains NOT ADMITTED with formal invocation count 0.',
};
await createNew(output, stableJson(report));
process.stdout.write(`${JSON.stringify({ passed: true, output, evidenceStatus: NOT_EVIDENCE })}\n`);
