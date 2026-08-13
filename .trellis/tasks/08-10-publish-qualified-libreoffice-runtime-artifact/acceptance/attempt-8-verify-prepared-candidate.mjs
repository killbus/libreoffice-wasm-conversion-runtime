import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, readdir, readFile, realpath } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

export const EXPECTED_SCHEMA_VERSION = 1
export const EXPECTED_KIND = 'pdfhow-libreoffice-runtime-candidate'
export const EXPECTED_ASSET_PATHS = [
  'dist/browser.d.ts',
  'dist/browser.js',
  'dist/browser.worker.global.js',
  'wasm/loader.cjs',
  'wasm/soffice.cjs',
  'wasm/soffice.data',
  'wasm/soffice.js',
  'wasm/soffice.wasm',
]
const CONTROL_PATHS = ['LOCAL-CANDIDATE-METADATA.json', 'SHA256SUMS', 'package.json']
const COMMIT_PATTERN = /^[0-9a-f]{40}$/
const SHA256_PATTERN = /^[0-9a-f]{64}$/

function fail(message) {
  throw new Error(message)
}

async function hashFile(path) {
  const hash = createHash('sha256')
  await new Promise((resolveStream, rejectStream) => {
    const stream = createReadStream(path)
    stream.on('data', chunk => hash.update(chunk))
    stream.on('error', rejectStream)
    stream.on('end', resolveStream)
  })
  return hash.digest('hex')
}

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = resolve(current, entry.name)
    const rel = relative(root, path)
    if (!rel || rel === '..' || rel.startsWith(`..${sep}`)) fail(`Inventory escaped candidate root: ${path}`)
    if (entry.isSymbolicLink()) fail(`Symlink is forbidden in local candidate: ${path}`)
    if (entry.isDirectory()) files.push(...await listFiles(root, path))
    else if (entry.isFile()) files.push(rel.split(sep).join('/'))
    else fail(`Non-file entry is forbidden in local candidate: ${path}`)
  }
  return files.sort()
}

function canonicalCandidateIdentity(metadata) {
  return JSON.stringify({
    schemaVersion: EXPECTED_SCHEMA_VERSION,
    kind: EXPECTED_KIND,
    provenance: metadata.provenance,
    runtime: metadata.runtime,
    assets: metadata.assets.map(({ path, role, mimeType, bytes, sha256 }) => ({ path, role, mimeType, bytes, sha256 })),
  })
}

export function deriveCandidateId(metadata) {
  return createHash('sha256').update(canonicalCandidateIdentity(metadata)).digest('hex')
}

function assertExactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`)
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (actual.join('\n') !== wanted.join('\n')) fail(`${label} keys differ: ${actual.join(', ')}`)
}

function parseSums(text) {
  const map = new Map()
  for (const line of text.trimEnd().split(/\r?\n/)) {
    const match = /^([0-9a-f]{64})  (.+)$/.exec(line)
    if (!match) fail(`Invalid SHA256SUMS line: ${line}`)
    if (map.has(match[2])) fail(`Duplicate SHA256SUMS path: ${match[2]}`)
    map.set(match[2], match[1])
  }
  return map
}

export async function verifyPreparedCandidate({
  candidateRoot,
  expectedCandidateId,
  expectedNativeRoot,
  expectedWrapperRoot,
  expectedNativeCommit,
  expectedWrapperCommit,
  expectedRunId,
  expectedAbi,
  expectedNativeSchemaVersion,
  expectedPthreadWorkerMode,
}) {
  const root = await realpath(resolve(candidateRoot))
  const metadataPath = resolve(root, 'LOCAL-CANDIDATE-METADATA.json')
  const sumsPath = resolve(root, 'SHA256SUMS')
  const packagePath = resolve(root, 'package.json')
  const metadata = JSON.parse(await readFile(metadataPath, 'utf8'))

  assertExactKeys(metadata, ['schemaVersion', 'kind', 'candidateId', 'releaseQualified', 'provenance', 'runtime', 'sources', 'assets'], 'metadata')
  if (metadata.schemaVersion !== EXPECTED_SCHEMA_VERSION) fail('metadata.schemaVersion mismatch')
  if (metadata.kind !== EXPECTED_KIND) fail('metadata.kind mismatch')
  if (metadata.releaseQualified !== false) fail('metadata.releaseQualified must be false')
  if (metadata.candidateId !== expectedCandidateId) fail('metadata.candidateId differs from frozen candidate')

  assertExactKeys(metadata.provenance, ['native', 'wrapper'], 'metadata.provenance')
  assertExactKeys(metadata.provenance.native, ['commit', 'githubActionsRunId', 'abi', 'schemaVersion'], 'metadata.provenance.native')
  assertExactKeys(metadata.provenance.wrapper, ['commit'], 'metadata.provenance.wrapper')
  if (!COMMIT_PATTERN.test(metadata.provenance.native.commit) || metadata.provenance.native.commit !== expectedNativeCommit) fail('native provenance commit mismatch')
  if (String(metadata.provenance.native.githubActionsRunId) !== String(expectedRunId)) fail('native workflow run ID mismatch')
  if (metadata.provenance.native.abi !== expectedAbi) fail('native ABI mismatch')
  if (metadata.provenance.native.schemaVersion !== expectedNativeSchemaVersion) fail('native schema version mismatch')
  if (!COMMIT_PATTERN.test(metadata.provenance.wrapper.commit) || metadata.provenance.wrapper.commit !== expectedWrapperCommit) fail('wrapper provenance commit mismatch')

  assertExactKeys(metadata.runtime, ['pthreadWorkerMode', 'externalWorker'], 'metadata.runtime')
  if (metadata.runtime.pthreadWorkerMode !== expectedPthreadWorkerMode) fail('pthread worker mode mismatch')
  if (expectedPthreadWorkerMode === 'main-script' && metadata.runtime.externalWorker !== null) fail('main-script mode requires externalWorker null')

  assertExactKeys(metadata.sources, ['nativeRoot', 'wrapperRoot'], 'metadata.sources')
  const actualNativeRoot = await realpath(metadata.sources.nativeRoot)
  const actualWrapperRoot = await realpath(metadata.sources.wrapperRoot)
  if (actualNativeRoot !== await realpath(expectedNativeRoot)) fail('metadata.sources.nativeRoot mismatch')
  if (actualWrapperRoot !== await realpath(expectedWrapperRoot)) fail('metadata.sources.wrapperRoot mismatch')

  if (!Array.isArray(metadata.assets) || metadata.assets.length !== 8) fail('metadata.assets must contain exactly eight assets')
  const paths = metadata.assets.map(asset => asset.path)
  if (paths.join('\n') !== [...EXPECTED_ASSET_PATHS].sort().join('\n')) fail('metadata asset inventory/order mismatch')
  const actualInventory = await listFiles(root)
  const expectedInventory = [...EXPECTED_ASSET_PATHS, ...CONTROL_PATHS].sort()
  if (actualInventory.join('\n') !== expectedInventory.join('\n')) fail('local candidate inventory differs from eight assets plus three control files')

  const sums = parseSums(await readFile(sumsPath, 'utf8'))
  if (sums.size !== 8) fail('SHA256SUMS must contain exactly eight entries')
  for (const asset of metadata.assets) {
    assertExactKeys(asset, ['path', 'role', 'mimeType', 'bytes', 'sha256'], `asset ${asset.path}`)
    if (!EXPECTED_ASSET_PATHS.includes(asset.path)) fail(`undeclared asset path: ${asset.path}`)
    if (!Number.isSafeInteger(asset.bytes) || asset.bytes < 0) fail(`invalid byte size: ${asset.path}`)
    if (!SHA256_PATTERN.test(asset.sha256)) fail(`invalid SHA-256: ${asset.path}`)
    const path = resolve(root, asset.path)
    const rel = relative(root, path)
    if (!rel || rel === '..' || rel.startsWith(`..${sep}`)) fail(`asset escaped candidate root: ${asset.path}`)
    const info = await lstat(path)
    if (!info.isFile() || info.isSymbolicLink()) fail(`asset is not a regular file: ${asset.path}`)
    if (info.size !== asset.bytes) fail(`asset byte size mismatch: ${asset.path}`)
    const actualHash = await hashFile(path)
    if (actualHash !== asset.sha256) fail(`asset SHA-256 mismatch: ${asset.path}`)
    if (sums.get(asset.path) !== asset.sha256) fail(`SHA256SUMS mismatch: ${asset.path}`)
  }
  if ([...sums.keys()].sort().join('\n') !== [...EXPECTED_ASSET_PATHS].sort().join('\n')) fail('SHA256SUMS inventory mismatch')

  const derivedCandidateId = deriveCandidateId(metadata)
  if (derivedCandidateId !== metadata.candidateId || derivedCandidateId !== expectedCandidateId) fail('derived candidate ID mismatch')

  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
  assertExactKeys(packageJson, ['name', 'version', 'private', 'type', 'types', 'exports', 'pdfhowCandidate'], 'package.json')
  if (packageJson.name !== '@pdfhow/libreoffice-wasm-conversion-runtime-candidate') fail('package name mismatch')
  if (packageJson.version !== `0.0.0-candidate.${expectedCandidateId.slice(0, 16)}`) fail('package version mismatch')
  if (packageJson.private !== true || packageJson.type !== 'module' || packageJson.types !== './dist/browser.d.ts') fail('package module contract mismatch')
  if (packageJson.exports?.['./browser']?.types !== './dist/browser.d.ts' || packageJson.exports?.['./browser']?.import !== './dist/browser.js') fail('package exports contract mismatch')
  assertExactKeys(packageJson.pdfhowCandidate, ['kind', 'candidateId', 'releaseQualified'], 'package.json pdfhowCandidate')
  if (packageJson.pdfhowCandidate.kind !== EXPECTED_KIND || packageJson.pdfhowCandidate.candidateId !== expectedCandidateId || packageJson.pdfhowCandidate.releaseQualified !== false) fail('package candidate identity mismatch')

  return { candidateRoot: root, candidateId: derivedCandidateId, releaseQualified: false, assets: metadata.assets, inventory: actualInventory, metadata }
}

function parseArgs(args) {
  const values = {}
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i]
    const value = args[i + 1]
    if (!flag?.startsWith('--') || value === undefined) fail('Every option requires a value')
    values[flag.slice(2)] = value
  }
  return values
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = parseArgs(process.argv.slice(2))
    const required = ['candidate-root', 'expected-candidate-id', 'expected-native-root', 'expected-wrapper-root', 'expected-native-commit', 'expected-wrapper-commit', 'expected-run-id', 'expected-abi', 'expected-native-schema-version', 'expected-pthread-worker-mode']
    for (const key of required) if (args[key] === undefined) fail(`Missing required option: --${key}`)
    const result = await verifyPreparedCandidate({
      candidateRoot: args['candidate-root'], expectedCandidateId: args['expected-candidate-id'], expectedNativeRoot: args['expected-native-root'], expectedWrapperRoot: args['expected-wrapper-root'], expectedNativeCommit: args['expected-native-commit'], expectedWrapperCommit: args['expected-wrapper-commit'], expectedRunId: args['expected-run-id'], expectedAbi: args['expected-abi'], expectedNativeSchemaVersion: Number(args['expected-native-schema-version']), expectedPthreadWorkerMode: args['expected-pthread-worker-mode'],
    })
    process.stdout.write(`${JSON.stringify({ schemaVersion: 1, kind: 'acceptance-attempt-8-prepared-candidate-verification', passed: true, candidateRoot: result.candidateRoot, candidateId: result.candidateId, releaseQualified: result.releaseQualified, inventory: result.inventory, assets: result.assets }, null, 2)}\n`)
  } catch (error) {
    console.error(`[attempt-8-verify-prepared-candidate] ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}