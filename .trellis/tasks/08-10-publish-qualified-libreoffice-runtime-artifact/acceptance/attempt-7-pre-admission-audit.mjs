#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ACCEPTANCE_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const HANDOFF_NAME = 'acceptance-attempt-7-handoff.md'
const DIAGNOSTIC_REPORT_NAME = 'acceptance-attempt-7-targeted-pre-admission-diagnostic.json'
const DIAGNOSTIC_SCRIPT_NAME = 'targeted-pre-admission-diagnostic-archive-to-pdfhow.mjs'
const AUDIT_REPORT_NAME = 'acceptance-attempt-7-pre-admission-audit.json'
const FORMAL_ROOT = 'D:\\tmp\\lo-runtime-acceptance-attempt-7'
const CANDIDATE_ID = '21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b'
const RUNTIME_COMMIT = 'a1c3cd6d6d2dd25fab063539e9fe40fbb327b846'
const PDFHOW_COMMIT = 'b41fde5db9829ede7e6e217de6ac12c2b475b7fc'
const RELEASE_ID = '367637128'
const ARCHIVE_SHA256 = 'e9aac8dde2fb627251155fc97651c2bd35bec63b01e39f882d342c024a87de9a'
const PACKAGE_FILES = [
  'attempt-7-commands.ps1',
  'attempt-7-download-assets.mjs',
  'attempt-7-time-contract.ps1',
  'attempt-7-time-contract.tests.ps1',
  'attempt-7-command-launch.ps1',
  'attempt-7-command-launch.tests.ps1',
  'attempt-7-prepare-candidate.tests.mjs',
  'attempt-7-verify-prepared-candidate.mjs',
]
const HANDOFF_HASHED_FILES = [
  ...PACKAGE_FILES,
  DIAGNOSTIC_SCRIPT_NAME,
  DIAGNOSTIC_REPORT_NAME,
]

function fail(message) {
  throw new Error(message)
}

async function pathExists(path) {
  return lstat(path).then(() => true, () => false)
}

async function sha256File(path) {
  const hash = createHash('sha256')
  await new Promise((resolveStream, rejectStream) => {
    const stream = createReadStream(path)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', rejectStream)
    stream.on('end', resolveStream)
  })
  return hash.digest('hex')
}

function requireText(text, expected, label) {
  if (!text.includes(expected)) fail(`${label} is missing: ${expected}`)
}

function rejectText(text, rejected, label) {
  if (text.includes(rejected)) fail(`${label} contains stale text: ${rejected}`)
}

async function main() {
  const handoffPath = resolve(ACCEPTANCE_DIRECTORY, HANDOFF_NAME)
  const diagnosticPath = resolve(ACCEPTANCE_DIRECTORY, DIAGNOSTIC_REPORT_NAME)
  const auditPath = resolve(ACCEPTANCE_DIRECTORY, AUDIT_REPORT_NAME)
  const handoff = await readFile(handoffPath, 'utf8')
  const diagnostic = JSON.parse(await readFile(diagnosticPath, 'utf8'))
  const packageHashes = {}
  for (const name of HANDOFF_HASHED_FILES) {
    packageHashes[name] = await sha256File(resolve(ACCEPTANCE_DIRECTORY, name))
  }

  const report = {
    schemaVersion: 1,
    kind: 'acceptance-attempt-7-pre-admission-consistency-audit',
    classification: 'targeted pre-admission diagnostic follow-up',
    evidenceStatus: 'not acceptance evidence',
    acceptanceEvidence: false,
    generatedAt: null,
    passed: false,
    formalAttempt: {
      attempt: 7,
      status: 'NOT ADMITTED',
      eligible: false,
      started: false,
      invocationCount: 0,
      decision: null,
      root: FORMAL_ROOT,
      rootExists: await pathExists(FORMAL_ROOT),
    },
    packageHashes,
    checks: {},
  }

  try {
    if (
      diagnostic.schemaVersion !== 1 ||
      diagnostic.classification !== 'targeted pre-admission diagnostic' ||
      diagnostic.evidenceStatus !== 'not acceptance evidence' ||
      diagnostic.acceptanceEvidence !== false ||
      diagnostic.passed !== true ||
      diagnostic.formalAttemptStarted !== false ||
      diagnostic.formalInvocationCount !== 0 ||
      diagnostic.chromiumGateRun !== false ||
      diagnostic.coldStartsRun !== 0 ||
      diagnostic.conversionRun !== false ||
      diagnostic.finalInvariantGatesRun !== false ||
      diagnostic.checks?.freshReleaseBytes?.passed !== true ||
      diagnostic.checks?.officialPreparationHelper?.passed !== true ||
      diagnostic.checks?.pdfHowResolver?.passed !== true
    ) fail('Targeted diagnostic schema/status is inconsistent')
    if (!String(diagnostic.diagnosticRoot).includes('targeted-pre-admission-diagnostic')) {
      fail('Targeted diagnostic root is not explicitly isolated')
    }
    report.checks.targetedDiagnostic = {
      passed: true,
      root: diagnostic.diagnosticRoot,
      generatedAt: diagnostic.generatedAt,
      candidateId: diagnostic.checks.pdfHowResolver.candidateId,
    }

    if (report.formalAttempt.rootExists) fail(`Formal Attempt 7 root already exists: ${FORMAL_ROOT}`)
    requireText(handoff, 'Acceptance Attempt 7: **NOT ADMITTED**', 'Handoff state')
    requireText(handoff, '- eligible: `false`', 'Handoff state')
    requireText(handoff, '- started: `false`', 'Handoff state')
    requireText(handoff, '- formal invocation count: `0`', 'Handoff state')
    requireText(handoff, '- decision: `null`', 'Handoff state')
    requireText(handoff, `new formal root: \`${FORMAL_ROOT}\``, 'Handoff state')
    requireText(handoff, '**targeted pre-admission diagnostic**', 'Handoff diagnostic classification')
    requireText(handoff, '**not acceptance evidence**', 'Handoff evidence disclaimer')
    requireText(handoff, DIAGNOSTIC_REPORT_NAME, 'Handoff diagnostic report')
    requireText(handoff, AUDIT_REPORT_NAME, 'Handoff audit report')
    rejectText(handoff, 'acceptance-attempt-7-readiness.json', 'Handoff')
    report.checks.state = { passed: true, formalRootAbsent: true }

    for (const [name, hash] of Object.entries(packageHashes)) {
      requireText(handoff, `- \`${name}\`: \`${hash}\``, 'Handoff SHA-256 inventory')
    }
    report.checks.handoffHashes = { passed: true, count: Object.keys(packageHashes).length }

    const packageText = {}
    for (const name of PACKAGE_FILES) {
      packageText[name] = await readFile(resolve(ACCEPTANCE_DIRECTORY, name), 'utf8')
      for (const stale of [
        'Attempt 5',
        'Attempt 6',
        'attempt-5',
        'attempt-6',
        'ATTEMPT-5',
        'ATTEMPT-6',
        'acceptanceAttempt = 5',
        'acceptanceAttempt = 6',
        'Resolve-Attempt5',
        'Resolve-Attempt6',
        'Set-Attempt5',
        'Set-Attempt6',
        'ConvertTo-Attempt5',
        'ConvertTo-Attempt6',
      ]) rejectText(packageText[name], stale, name)
    }
    const commands = packageText['attempt-7-commands.ps1']
    const downloader = packageText['attempt-7-download-assets.mjs']
    const verifier = packageText['attempt-7-verify-prepared-candidate.mjs']
    for (const token of [RUNTIME_COMMIT, PDFHOW_COMMIT, CANDIDATE_ID, RELEASE_ID, ARCHIVE_SHA256]) {
      requireText(commands, token, 'Formal command identity')
    }
    for (const token of [CANDIDATE_ID, RELEASE_ID, ARCHIVE_SHA256]) requireText(downloader, token, 'Download helper identity')
    for (const token of [
      "Join-Path $PdfHowRepository 'third_party\\libreoffice-wasm-conversion-runtime-dev'",
      'prepare-libreoffice-runtime-candidate.mjs',
      'LOCAL-CANDIDATE-METADATA.json',
      'requiredControlFiles',
      'exactRuntimeAssets',
    ]) requireText(commands, token, 'Formal preparation contract')
    for (const token of [
      'LOCAL-CANDIDATE-METADATA.json',
      'SHA256SUMS',
      'package.json',
      'releaseQualified',
      'candidateId',
      'sources',
    ]) requireText(verifier, token, 'Prepared candidate verifier schema')
    report.checks.identityAndSchema = {
      passed: true,
      runtimeCommit: RUNTIME_COMMIT,
      pdfHowCommit: PDFHOW_COMMIT,
      candidateId: CANDIDATE_ID,
      releaseId: Number(RELEASE_ID),
      archiveSha256: ARCHIVE_SHA256,
    }

    requireText(handoff, RUNTIME_COMMIT, 'Handoff runtime identity')
    requireText(handoff, PDFHOW_COMMIT, 'Handoff PDFHow identity')
    requireText(handoff, CANDIDATE_ID, 'Handoff candidate identity')
    requireText(handoff, RELEASE_ID, 'Handoff release identity')
    requireText(handoff, ARCHIVE_SHA256, 'Handoff archive identity')
    requireText(handoff, 'fresh Release bytes', 'Handoff targeted chain')
    requireText(handoff, 'PDFHow resolver success', 'Handoff targeted chain')
    requireText(handoff, 'No Chromium candidate gate, cold-start sample, conversion command, or final invariance gate was run', 'Handoff excluded gates')
    report.checks.handoffConsistency = { passed: true }

    report.passed = true
  } catch (error) {
    report.failure = error instanceof Error ? error.message : String(error)
  }

  report.generatedAt = new Date().toISOString()
  await writeFile(auditPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  if (!report.passed) process.exitCode = 1
}

main().catch((error) => {
  console.error(`[attempt-7-pre-admission-audit] ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})