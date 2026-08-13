#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'

const CLASSIFICATION = 'targeted pre-admission diagnostic'
const EVIDENCE_DISCLAIMER = 'not acceptance evidence'
const REPOSITORY = 'killbus/libreoffice-wasm-conversion-runtime'
const RELEASE_ID = 367637128
const CANDIDATE_ID =
  '21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b'
const ARCHIVE_NAME = `libreoffice-wasm-runtime-${CANDIDATE_ID}.zip`
const ARCHIVE_ASSET_ID = 508126614
const ARCHIVE_BYTES = 248_934_231
const ARCHIVE_SHA256 =
  'e9aac8dde2fb627251155fc97651c2bd35bec63b01e39f882d342c024a87de9a'
const PDFHOW_REPOSITORY = 'https://github.com/killbus/pdfhow.com-next.git'
const PDFHOW_COMMIT = 'b41fde5db9829ede7e6e217de6ac12c2b475b7fc'
const CANDIDATE_DIRECTORY = 'libreoffice-wasm-conversion-runtime-dev'
const REQUIRED_CONTROL_FILES = [
  'LOCAL-CANDIDATE-METADATA.json',
  'SHA256SUMS',
  'package.json',
]
const EXPECTED_ARCHIVE_FILES = [
  'ASSET-SHA256SUMS',
  'CANDIDATE-MANIFEST.json',
  'dist/browser.d.ts',
  'dist/browser.js',
  'dist/browser.worker.global.js',
  'wasm/loader.cjs',
  'wasm/soffice.cjs',
  'wasm/soffice.data',
  'wasm/soffice.js',
  'wasm/soffice.wasm',
].sort()
const EXPECTED_CANDIDATE_FILES = [
  ...EXPECTED_ARCHIVE_FILES.filter(
    (path) => path !== 'ASSET-SHA256SUMS' && path !== 'CANDIDATE-MANIFEST.json'
  ),
  ...REQUIRED_CONTROL_FILES,
].sort()
const EXPECTED_RUNTIME_ASSETS = [
  { path: 'dist/browser.d.ts', bytes: 71_783, sha256: '73d0f6ab719d0f643d38fc1839be295f0aed4cb09a8c8cb8f054d65a224f63fb' },
  { path: 'dist/browser.js', bytes: 87_881, sha256: '9fa0fef0b7554bef5c5a59c4fc85a325d77b0a218129be38febf4a6d02a4518c' },
  { path: 'dist/browser.worker.global.js', bytes: 122_735, sha256: '9cababb37ce81ca8d60158cd6ffe1b5e218cbcb33c5d87bc74f08ec8e3804741' },
  { path: 'wasm/loader.cjs', bytes: 10_513, sha256: '7cebd863dcd071a5eb02bc26fa7701e7dc5c865d1e130e5595672e56a34934cf' },
  { path: 'wasm/soffice.cjs', bytes: 439_517, sha256: '0c18483bdf23a83e9ab1d180fc8d3c850f6cd57a42e4e1cda545e25c512940a5' },
  { path: 'wasm/soffice.data', bytes: 99_735_790, sha256: 'c4b8a92b566d4e0d4723d321ef926e1b9fbeb575d28cdd6466d27fd2c17c5514' },
  { path: 'wasm/soffice.js', bytes: 439_517, sha256: '0c18483bdf23a83e9ab1d180fc8d3c850f6cd57a42e4e1cda545e25c512940a5' },
  { path: 'wasm/soffice.wasm', bytes: 148_022_311, sha256: 'b24a888550d27d2942ff9c8c9a84e20cd0c852db154e8558647cb9c5294ff291' },
]

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '../../../..')

function fail(message) {
  throw new Error(message)
}

function parseArguments(args) {
  const values = {}
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index]
    const value = args[index + 1]
    if (!flag?.startsWith('--') || value === undefined) {
      fail('Usage: node targeted-pre-admission-diagnostic-archive-to-pdfhow.mjs --root <fresh-directory> --report-out <path>')
    }
    values[flag.slice(2)] = value
  }
  if (!values.root || !values['report-out']) fail('Both --root and --report-out are required')
  return {
    root: resolve(values.root),
    reportOut: resolve(values['report-out']),
    pdfHowSource: values['pdfhow-source'] ? resolve(values['pdfhow-source']) : null,
  }
}

function assertStrictDescendant(parentPath, childPath, label) {
  const relativePath = relative(resolve(parentPath), resolve(childPath))
  if (relativePath === '' || relativePath === '..' || relativePath.startsWith(`..${sep}`)) {
    fail(`${label} must stay inside ${resolve(parentPath)}`)
  }
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

function runCommand(executable, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(executable, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
    const stdout = []
    const stderr = []
    child.stdout.on('data', (chunk) => stdout.push(chunk))
    child.stderr.on('data', (chunk) => stderr.push(chunk))
    child.on('error', rejectPromise)
    child.on('close', (code) => {
      const result = {
        code,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
      }
      if (code !== 0) {
        rejectPromise(new Error(`${executable} ${args.join(' ')} exited ${code}: ${result.stderr || result.stdout}`))
        return
      }
      resolvePromise(result)
    })
  })
}

async function withNetworkRetry(label, action, retryRecord, attempts = 3) {
  const failures = []
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await action(attempt)
      retryRecord.push({ label, attempts: attempt, failures })
      return result
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error))
      if (attempt === attempts) {
        retryRecord.push({ label, attempts: attempt, failures })
        throw error
      }
    }
  }
  fail(`${label} exhausted retries`)
}

async function downloadArchive(outputPath, retryRecord) {
  return withNetworkRetry('fresh Release archive download', async () => {
    await rm(outputPath, { force: true })
    await new Promise((resolvePromise, rejectPromise) => {
      const child = spawn('gh', [
        'api',
        '-H',
        'Accept: application/octet-stream',
        `repos/${REPOSITORY}/releases/assets/${ARCHIVE_ASSET_ID}`,
      ], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
      const output = createWriteStream(outputPath, { flags: 'wx' })
      const stderr = []
      let settled = false
      const rejectOnce = (error) => {
        if (settled) return
        settled = true
        rejectPromise(error)
      }
      child.stdout.pipe(output)
      child.stderr.on('data', (chunk) => stderr.push(chunk))
      child.on('error', rejectOnce)
      output.on('error', rejectOnce)
      child.on('close', (code) => {
        output.end(() => {
          if (settled) return
          settled = true
          if (code === 0) resolvePromise()
          else rejectPromise(new Error(`Release archive download exited ${code}: ${Buffer.concat(stderr).toString('utf8')}`))
        })
      })
    })
  }, retryRecord)
}

async function listFiles(rootPath) {
  const files = []
  async function visit(currentPath, prefix) {
    const entries = await readdir(currentPath, { withFileTypes: true })
    entries.sort((left, right) => left.name.localeCompare(right.name))
    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
      const absolutePath = resolve(currentPath, entry.name)
      if (entry.isDirectory()) await visit(absolutePath, relativePath)
      else if (entry.isFile()) files.push(relativePath)
      else fail(`Unexpected non-file archive entry: ${relativePath}`)
    }
  }
  await visit(rootPath, '')
  return files.sort()
}

function assertExactList(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label} differs\nexpected=${JSON.stringify(expected)}\nactual=${JSON.stringify(actual)}`)
  }
}

function parseSha256Sums(text, label) {
  return text.trimEnd().split('\n').map((line) => {
    const match = /^([0-9a-f]{64})  (.+)$/.exec(line.replace(/\r$/, ''))
    if (!match) fail(`${label} contains an invalid line: ${line}`)
    return { path: match[2], sha256: match[1] }
  })
}

async function writeReport(reportPath, report) {
  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

async function main() {
  const { root, reportOut, pdfHowSource } = parseArguments(process.argv.slice(2))
  if (await pathExists(root)) fail(`Diagnostic root must be fresh: ${root}`)
  await mkdir(root, { recursive: false })
  assertStrictDescendant(dirname(root), root, 'Diagnostic root')

  const localReportPath = resolve(root, 'targeted-pre-admission-diagnostic.json')
  const retryRecord = []
  const report = {
    schemaVersion: 1,
    kind: 'release-archive-to-pdfhow-local-candidate-diagnostic',
    classification: CLASSIFICATION,
    evidenceStatus: EVIDENCE_DISCLAIMER,
    acceptanceEvidence: false,
    passed: false,
    generatedAt: null,
    diagnosticRoot: root,
    formalAcceptanceRoot: false,
    formalAttemptStarted: false,
    formalInvocationCount: 0,
    chromiumGateRun: false,
    coldStartsRun: 0,
    conversionRun: false,
    finalInvariantGatesRun: false,
    scope: [
      'fresh Release bytes',
      'prepare-libreoffice-runtime-candidate.mjs',
      'LOCAL-CANDIDATE-METADATA.json',
      'SHA256SUMS',
      'package.json',
      'exact inventory',
      'PDFHow resolver success',
    ],
    networkRetries: retryRecord,
    checks: {},
  }

  await writeFile(resolve(root, 'CLASSIFICATION.txt'), `${CLASSIFICATION}\n${EVIDENCE_DISCLAIMER}\n`, 'utf8')

  try {
    const releaseResult = await withNetworkRetry(
      'Release identity query',
      () => runCommand('gh', ['api', `repos/${REPOSITORY}/releases/${RELEASE_ID}`]),
      retryRecord
    )
    const release = JSON.parse(releaseResult.stdout)
    const archiveAsset = release.assets?.find((asset) => asset.id === ARCHIVE_ASSET_ID && asset.name === ARCHIVE_NAME)
    if (
      release.id !== RELEASE_ID ||
      !archiveAsset ||
      archiveAsset.size !== ARCHIVE_BYTES ||
      String(archiveAsset.digest ?? '').replace(/^sha256:/, '') !== ARCHIVE_SHA256
    ) fail('Frozen Release archive identity differs')

    const downloadRoot = resolve(root, 'release-download')
    const archivePath = resolve(downloadRoot, ARCHIVE_NAME)
    await mkdir(downloadRoot)
    await downloadArchive(archivePath, retryRecord)
    const archiveStat = await stat(archivePath)
    const archiveSha256 = await sha256File(archivePath)
    if (archiveStat.size !== ARCHIVE_BYTES || archiveSha256 !== ARCHIVE_SHA256) fail('Fresh Release archive bytes differ')
    report.checks.freshReleaseBytes = {
      passed: true,
      releaseId: RELEASE_ID,
      assetId: ARCHIVE_ASSET_ID,
      name: ARCHIVE_NAME,
      bytes: archiveStat.size,
      sha256: archiveSha256,
      path: archivePath,
    }

    const archiveListResult = await runCommand('tar', ['-tf', archivePath])
    const archiveEntries = archiveListResult.stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .map((path) => path.replace(/\\/g, '/').replace(/^\.\//, ''))
    for (const entry of archiveEntries) {
      if (entry.startsWith('/') || /^[A-Za-z]:/.test(entry) || entry.split('/').includes('..')) fail(`Unsafe archive entry: ${entry}`)
    }
    assertExactList([...archiveEntries].sort(), EXPECTED_ARCHIVE_FILES, 'Archive inventory')

    const extractRoot = resolve(root, 'release-extract')
    await mkdir(extractRoot)
    await runCommand('tar', ['-xf', archivePath, '-C', extractRoot])
    const extractedFiles = await listFiles(extractRoot)
    assertExactList(extractedFiles, EXPECTED_ARCHIVE_FILES, 'Extracted archive inventory')

    const manifest = JSON.parse(await readFile(resolve(extractRoot, 'CANDIDATE-MANIFEST.json'), 'utf8'))
    if (
      manifest.schemaVersion !== 1 ||
      manifest.kind !== 'pdfhow-libreoffice-runtime-candidate' ||
      manifest.candidateId !== CANDIDATE_ID ||
      manifest.releaseQualified !== false ||
      manifest.provenance?.native?.commit !== '71d33678ed74872ebbb1bc37f5778143f8f5e401' ||
      String(manifest.provenance?.native?.githubActionsRunId) !== '31211473147' ||
      manifest.provenance?.native?.abi !== 'lok-convert-document-v1' ||
      manifest.provenance?.native?.schemaVersion !== 1 ||
      manifest.provenance?.wrapper?.commit !== 'df3f73c789e6d2abf71cbcd75186118d2bbc795a' ||
      manifest.runtime?.pthreadWorkerMode !== 'main-script' ||
      manifest.runtime?.externalWorker !== null
    ) fail('Embedded candidate manifest identity/schema differs')

    const actualManifestAssets = [...manifest.assets]
      .map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 }))
      .sort((left, right) => left.path.localeCompare(right.path))
    const expectedManifestAssets = [...EXPECTED_RUNTIME_ASSETS].sort((left, right) => left.path.localeCompare(right.path))
    if (JSON.stringify(actualManifestAssets) !== JSON.stringify(expectedManifestAssets)) fail('Embedded candidate manifest asset identity differs')
    for (const asset of EXPECTED_RUNTIME_ASSETS) {
      const assetPath = resolve(extractRoot, ...asset.path.split('/'))
      const assetStat = await stat(assetPath)
      const assetSha256 = await sha256File(assetPath)
      if (assetStat.size !== asset.bytes || assetSha256 !== asset.sha256) fail(`Extracted runtime asset differs: ${asset.path}`)
    }
    const embeddedSums = parseSha256Sums(await readFile(resolve(extractRoot, 'ASSET-SHA256SUMS'), 'utf8'), 'ASSET-SHA256SUMS')
      .sort((left, right) => left.path.localeCompare(right.path))
    const expectedSums = EXPECTED_RUNTIME_ASSETS.map(({ path, sha256 }) => ({ path, sha256 }))
      .sort((left, right) => left.path.localeCompare(right.path))
    if (JSON.stringify(embeddedSums) !== JSON.stringify(expectedSums)) fail('Embedded ASSET-SHA256SUMS differs from exact runtime inventory')
    report.checks.archiveExtraction = {
      passed: true,
      inventory: extractedFiles,
      candidateId: manifest.candidateId,
      runtimeAssetCount: manifest.assets.length,
    }

    const pdfHowRepository = resolve(root, 'pdfhow-repository')
    if (pdfHowSource) {
      const sourceHead = (await runCommand('git', ['rev-parse', 'HEAD'], { cwd: pdfHowSource })).stdout.trim()
      const sourceStatus = (await runCommand('git', ['status', '--short'], { cwd: pdfHowSource })).stdout.trim()
      if (sourceHead !== PDFHOW_COMMIT || sourceStatus !== '') {
        fail('Local PDFHow source must be a clean checkout of the fixed commit')
      }
      await runCommand('git', ['clone', '--no-checkout', '--no-hardlinks', pdfHowSource, pdfHowRepository])
      report.checks.pdfHowSource = {
        kind: 'fresh isolated clone from verified local fixed checkout',
        source: pdfHowSource,
        sourceCommit: sourceHead,
      }
    } else {
      await withNetworkRetry('fresh PDFHow fixed-checkout clone', async () => {
        await rm(pdfHowRepository, { recursive: true, force: true })
        await runCommand('git', ['clone', '--no-checkout', '--filter=blob:none', PDFHOW_REPOSITORY, pdfHowRepository])
      }, retryRecord)
      report.checks.pdfHowSource = {
        kind: 'fresh isolated clone from remote',
        source: PDFHOW_REPOSITORY,
      }
    }
    await withNetworkRetry(
      'PDFHow fixed commit checkout',
      () => runCommand('git', ['checkout', '--detach', PDFHOW_COMMIT], { cwd: pdfHowRepository }),
      retryRecord
    )
    const head = (await runCommand('git', ['rev-parse', 'HEAD'], { cwd: pdfHowRepository })).stdout.trim()
    if (head !== PDFHOW_COMMIT) fail(`PDFHow checkout differs: ${head}`)

    const helperPath = resolve(pdfHowRepository, 'scripts/prepare-libreoffice-runtime-candidate.mjs')
    const candidateRoot = resolve(pdfHowRepository, 'third_party', CANDIDATE_DIRECTORY)
    await runCommand(process.execPath, [
      helperPath,
      '--native-root', resolve(extractRoot, 'wasm'),
      '--wrapper-root', extractRoot,
      '--destination', candidateRoot,
      '--native-commit', manifest.provenance.native.commit,
      '--wrapper-commit', manifest.provenance.wrapper.commit,
      '--github-actions-run-id', String(manifest.provenance.native.githubActionsRunId),
      '--native-abi', manifest.provenance.native.abi,
      '--native-schema-version', String(manifest.provenance.native.schemaVersion),
      '--pthread-worker-mode', manifest.runtime.pthreadWorkerMode,
    ], { cwd: pdfHowRepository })

    const candidateInventory = await listFiles(candidateRoot)
    assertExactList(candidateInventory, EXPECTED_CANDIDATE_FILES, 'Prepared candidate inventory')
    const metadataPath = resolve(candidateRoot, 'LOCAL-CANDIDATE-METADATA.json')
    const sumsPath = resolve(candidateRoot, 'SHA256SUMS')
    const packagePath = resolve(candidateRoot, 'package.json')
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'))
    const packageDescriptor = JSON.parse(await readFile(packagePath, 'utf8'))
    assertExactList(
      Object.keys(metadata).sort(),
      ['assets', 'candidateId', 'kind', 'provenance', 'releaseQualified', 'runtime', 'schemaVersion', 'sources'].sort(),
      'LOCAL-CANDIDATE-METADATA.json keys'
    )
    if (
      metadata.candidateId !== CANDIDATE_ID ||
      metadata.schemaVersion !== 1 ||
      metadata.releaseQualified !== false ||
      packageDescriptor.pdfhowCandidate?.candidateId !== CANDIDATE_ID ||
      packageDescriptor.pdfhowCandidate?.releaseQualified !== false
    ) fail('Prepared candidate metadata/package identity differs')
    const nativeRoot = await realpath(resolve(extractRoot, 'wasm'))
    const wrapperRoot = await realpath(extractRoot)
    if (metadata.sources?.nativeRoot !== nativeRoot || metadata.sources?.wrapperRoot !== wrapperRoot) fail('Prepared candidate source roots differ')
    report.checks.officialPreparationHelper = {
      passed: true,
      helper: helperPath,
      pdfHowCommit: head,
      destination: candidateRoot,
      controlFiles: {
        'LOCAL-CANDIDATE-METADATA.json': await sha256File(metadataPath),
        SHA256SUMS: await sha256File(sumsPath),
        'package.json': await sha256File(packagePath),
      },
      inventory: candidateInventory,
    }

    const resolverRunnerPath = resolve(root, 'invoke-pdfhow-resolver.mts')
    const runtimeCandidateUrl = pathToFileURL(resolve(pdfHowRepository, 'tests/office-conversion/runtime-candidate.ts')).href
    await writeFile(
      resolverRunnerPath,
      `import { resolveLibreOfficeRuntimeCandidate } from ${JSON.stringify(runtimeCandidateUrl)}\n` +
        `async function main() {\n` +
        `  const resolved = await resolveLibreOfficeRuntimeCandidate(${JSON.stringify(candidateRoot)})\n` +
        `  process.stdout.write(JSON.stringify(resolved))\n` +
        `}\n` +
        `main().catch((error) => { console.error(error); process.exitCode = 1 })\n`,
      'utf8'
    )
    const tsxCli = resolve(REPOSITORY_ROOT, 'node_modules/tsx/dist/cli.mjs')
    if (!(await pathExists(tsxCli))) fail(`Repository-local tsx runner is missing: ${tsxCli}`)
    const resolverResult = await runCommand(process.execPath, [tsxCli, resolverRunnerPath], { cwd: pdfHowRepository })
    const resolvedCandidate = JSON.parse(resolverResult.stdout)
    if (
      resolvedCandidate.root !== (await realpath(candidateRoot)) ||
      resolvedCandidate.candidateId !== CANDIDATE_ID ||
      resolvedCandidate.manifest?.identity?.kind !== 'local-candidate' ||
      resolvedCandidate.manifest?.identity?.candidateId !== CANDIDATE_ID ||
      resolvedCandidate.manifest?.identity?.releaseQualified !== false ||
      resolvedCandidate.staticAssets?.length !== 4
    ) fail('PDFHow resolver returned an unexpected candidate')
    report.checks.pdfHowResolver = {
      passed: true,
      module: runtimeCandidateUrl,
      root: resolvedCandidate.root,
      candidateId: resolvedCandidate.candidateId,
      browserModulePath: resolvedCandidate.browserModulePath,
      staticAssetRoles: resolvedCandidate.staticAssets.map((asset) => asset.role),
    }

    report.passed = true
    report.generatedAt = new Date().toISOString()
    await writeReport(localReportPath, report)
    await writeReport(reportOut, report)
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  } catch (error) {
    report.generatedAt = new Date().toISOString()
    report.failure = error instanceof Error ? error.message : String(error)
    await writeReport(localReportPath, report)
    await writeReport(reportOut, report)
    throw error
  }
}

main().catch((error) => {
  console.error(`[targeted-pre-admission-diagnostic] ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})