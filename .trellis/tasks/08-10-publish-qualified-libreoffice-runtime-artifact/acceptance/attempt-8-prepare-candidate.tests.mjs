import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'
import { verifyPreparedCandidate } from './attempt-8-verify-prepared-candidate.mjs'

const ASSETS = [
  ['wrapper', 'dist/browser.js'],
  ['wrapper', 'dist/browser.d.ts'],
  ['wrapper', 'dist/browser.worker.global.js'],
  ['native', 'loader.cjs'],
  ['native', 'soffice.cjs'],
  ['native', 'soffice.js'],
  ['native', 'soffice.wasm'],
  ['native', 'soffice.data'],
]
const NATIVE_COMMIT = '1111111111111111111111111111111111111111'
const WRAPPER_COMMIT = '2222222222222222222222222222222222222222'
const RUN_ID = '31211473147'
const ABI = 'lok-convert-document-v1'

function fail(message) { throw new Error(message) }
async function expectReject(label, action) {
  try { await action() } catch { return }
  fail(`${label} did not fail closed`)
}
function parseArgs(args) {
  const values = {}
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i]?.startsWith('--') || args[i + 1] === undefined) fail('Every option requires a value')
    values[args[i].slice(2)] = args[i + 1]
  }
  return values
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const pdfHowRepository = resolve(args['pdfhow-repository'] ?? '')
  const helperPath = resolve(pdfHowRepository, 'scripts/prepare-libreoffice-runtime-candidate.mjs')
  const workRoot = args['work-root'] ? resolve(args['work-root']) : await mkdtemp(join(tmpdir(), 'attempt-8-prepare-contract-'))
  const reportOut = args['report-out'] ? resolve(args['report-out']) : undefined
  const nativeRoot = resolve(workRoot, 'native')
  const wrapperRoot = resolve(workRoot, 'wrapper')
  const destinationRoot = resolve(workRoot, 'third_party')
  const destination = resolve(destinationRoot, 'libreoffice-wasm-conversion-runtime-dev')
  await rm(workRoot, { recursive: true, force: true })
  await mkdir(nativeRoot, { recursive: true })
  await mkdir(wrapperRoot, { recursive: true })
  for (const [rootKind, path] of ASSETS) {
    const root = rootKind === 'native' ? nativeRoot : wrapperRoot
    const target = resolve(root, path)
    await mkdir(resolve(target, '..'), { recursive: true })
    await writeFile(target, `attempt-8 contract fixture: ${rootKind}/${path}\n`, 'utf8')
  }

  const helper = await import(`${pathToFileURL(helperPath).href}?attempt7=${Date.now()}`)
  if (typeof helper.prepareLibreOfficeRuntimeCandidate !== 'function') fail('Fixed PDFHow helper does not export prepareLibreOfficeRuntimeCandidate')
  const prepared = await helper.prepareLibreOfficeRuntimeCandidate({
    nativeRoot,
    wrapperRoot,
    destinationRoot,
    destination,
    nativeCommit: NATIVE_COMMIT,
    wrapperCommit: WRAPPER_COMMIT,
    githubActionsRunId: RUN_ID,
    nativeAbi: ABI,
    nativeSchemaVersion: 1,
    pthreadWorkerMode: 'main-script',
  })
  const verifyOptions = {
    candidateRoot: destination,
    expectedCandidateId: prepared.candidateId,
    expectedNativeRoot: nativeRoot,
    expectedWrapperRoot: wrapperRoot,
    expectedNativeCommit: NATIVE_COMMIT,
    expectedWrapperCommit: WRAPPER_COMMIT,
    expectedRunId: RUN_ID,
    expectedAbi: ABI,
    expectedNativeSchemaVersion: 1,
    expectedPthreadWorkerMode: 'main-script',
  }
  const verified = await verifyPreparedCandidate(verifyOptions)
  const metadataPath = resolve(destination, 'LOCAL-CANDIDATE-METADATA.json')
  const originalMetadataText = await readFile(metadataPath, 'utf8')
  const originalMetadata = JSON.parse(originalMetadataText)
  if (Object.keys(originalMetadata.sources).sort().join('\n') !== ['nativeRoot', 'wrapperRoot'].sort().join('\n')) fail('sources contract is not exact')

  await writeFile(metadataPath, `${JSON.stringify({ ...originalMetadata, releaseQualified: true }, null, 2)}\n`)
  await expectReject('releaseQualified mutation', () => verifyPreparedCandidate(verifyOptions))
  await writeFile(metadataPath, `${JSON.stringify({ ...originalMetadata, candidateId: '0'.repeat(64) }, null, 2)}\n`)
  await expectReject('candidate ID mutation', () => verifyPreparedCandidate(verifyOptions))
  const releaseManifestShape = { schemaVersion: 1, candidateId: prepared.candidateId, releaseQualified: false, provenance: originalMetadata.provenance, runtime: originalMetadata.runtime, assets: originalMetadata.assets }
  await writeFile(metadataPath, `${JSON.stringify(releaseManifestShape, null, 2)}\n`)
  await expectReject('release-manifest rename substitution', () => verifyPreparedCandidate(verifyOptions))
  await writeFile(metadataPath, originalMetadataText)
  await verifyPreparedCandidate(verifyOptions)

  const report = {
    schemaVersion: 1,
    kind: 'acceptance-attempt-8-preparation-contract-test',
    passed: true,
    preAdmissionDiagnosticCompatible: true,
    officialHelper: helperPath,
    candidateId: verified.candidateId,
    generatedFiles: ['LOCAL-CANDIDATE-METADATA.json', 'SHA256SUMS', 'package.json'],
    exactSourcesKeys: ['nativeRoot', 'wrapperRoot'],
    negativeCases: ['releaseQualified mutation', 'candidate ID mutation', 'release-manifest rename substitution'],
  }
  if (reportOut) {
    await mkdir(resolve(reportOut, '..'), { recursive: true })
    await writeFile(reportOut, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
}

main().catch(error => {
  console.error(`[attempt-8-prepare-candidate-tests] ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})