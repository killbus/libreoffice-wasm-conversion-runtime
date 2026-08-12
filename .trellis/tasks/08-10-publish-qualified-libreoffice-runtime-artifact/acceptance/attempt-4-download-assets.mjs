#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'

const REPOSITORY = 'killbus/libreoffice-wasm-conversion-runtime'
const RELEASE_ID = 367637128
const TAG = 'runtime-artifact-21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b'
const TARGET = 'df3f73c789e6d2abf71cbcd75186118d2bbc795a'
const CANDIDATE_ID = '21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b'
const EXPECTED_ASSETS = [
  { id: 508126612, name: 'ASSET-SHA256SUMS', bytes: 677, sha256: '83bb7bb697dcf4b8feb59934ad928aa22b8d87c18104ebeed451a3eb7aff9c32' },
  { id: 508126611, name: 'CANDIDATE-MANIFEST.json', bytes: 2365, sha256: 'c33b76b49346b08d0cdcbf1ce64db3025f9ceacd29113664279c56e0dae8dab0' },
  { id: 508126614, name: `libreoffice-wasm-runtime-${CANDIDATE_ID}.zip`, bytes: 248934231, sha256: 'e9aac8dde2fb627251155fc97651c2bd35bec63b01e39f882d342c024a87de9a' },
  { id: 508126610, name: 'SHA256SUMS', bytes: 333, sha256: 'df1e89e0364660c75d00fcaa4cf77fbd80176986812a8009e9a3e176e9bc9dac' },
  { id: 508140311, name: 'STAGING-REPORT.json', bytes: 4571, sha256: '2094842f73c67cd31481741480a27646607f4a18eda3337bf5dfaebc714c7cc6' },
]

function fail(message) { throw new Error(message) }
function runGhJson(args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('gh', args, { stdio: ['ignore', 'pipe', 'pipe'] })
    const stdout = []; const stderr = []
    child.stdout.on('data', (chunk) => stdout.push(chunk)); child.stderr.on('data', (chunk) => stderr.push(chunk)); child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`gh ${args.join(' ')} exited ${code}: ${Buffer.concat(stderr).toString('utf8')}`))
      try { resolvePromise(JSON.parse(Buffer.concat(stdout).toString('utf8'))) } catch (error) { reject(error) }
    })
  })
}
function downloadAsset(assetId, outputPath) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('gh', ['api', '-H', 'Accept: application/octet-stream', `repos/${REPOSITORY}/releases/assets/${assetId}`], { stdio: ['ignore', 'pipe', 'pipe'] })
    const output = createWriteStream(outputPath, { flags: 'wx' }); const stderr = []
    child.stdout.pipe(output); child.stderr.on('data', (chunk) => stderr.push(chunk)); child.on('error', reject); output.on('error', reject)
    child.on('close', (code) => output.end(() => code === 0 ? resolvePromise() : reject(new Error(`asset ${assetId} download exited ${code}: ${Buffer.concat(stderr).toString('utf8')}`))))
  })
}
async function sha256(path) { return createHash('sha256').update(await readFile(path)).digest('hex') }

async function main() {
  const outputRootArg = process.argv[2]
  if (!outputRootArg || process.argv.length !== 3) fail('Usage: node attempt-4-download-assets.mjs <fresh-output-directory>')
  const outputRoot = resolve(outputRootArg); await mkdir(outputRoot, { recursive: false })
  const release = await runGhJson(['api', `repos/${REPOSITORY}/releases/${RELEASE_ID}`])
  if (release.id !== RELEASE_ID || release.tag_name !== TAG || release.target_commitish !== TARGET || release.draft !== true || release.published_at !== null || release.assets?.length !== EXPECTED_ASSETS.length) fail('GitHub Release identity/state differs from the frozen Attempt 4 handoff')
  const actualAssets = [...release.assets].map((asset) => ({ id: asset.id, name: asset.name, bytes: asset.size, sha256: String(asset.digest ?? '').replace(/^sha256:/, ''), createdAt: asset.created_at, updatedAt: asset.updated_at })).sort((a, b) => a.name.localeCompare(b.name))
  const expectedAssets = [...EXPECTED_ASSETS].sort((a, b) => a.name.localeCompare(b.name))
  for (let index = 0; index < expectedAssets.length; index += 1) for (const field of ['id', 'name', 'bytes', 'sha256']) if (actualAssets[index][field] !== expectedAssets[index][field]) fail(`Release asset mismatch for ${expectedAssets[index].name} field ${field}`)
  const downloadedAssets = []
  for (const asset of EXPECTED_ASSETS) {
    const outputPath = resolve(outputRoot, asset.name); await downloadAsset(asset.id, outputPath)
    const bytes = (await readFile(outputPath)).byteLength; const digest = await sha256(outputPath)
    if (bytes !== asset.bytes || digest !== asset.sha256) fail(`Downloaded bytes differ for ${asset.name}`)
    downloadedAssets.push({ ...asset, path: outputPath })
  }
  const manifest = JSON.parse(await readFile(resolve(outputRoot, 'CANDIDATE-MANIFEST.json'), 'utf8'))
  if (manifest.candidateId !== CANDIDATE_ID || manifest.releaseQualified !== false) fail('Candidate manifest identity or releaseQualified state differs')
  const report = { schemaVersion: 1, kind: 'acceptance-attempt-4-release-download', generatedAt: new Date().toISOString(), retryPerformed: false, release: { id: release.id, url: release.html_url, tag: release.tag_name, target: release.target_commitish, draft: release.draft, publishedAt: release.published_at, updatedAt: release.updated_at }, candidateId: CANDIDATE_ID, releaseQualified: false, assets: downloadedAssets }
  await writeFile(resolve(outputRoot, 'attempt-4-release-download.json'), `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' }); process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
}
main().catch((error) => { console.error(`[attempt-4-download-assets] ${error.message}`); process.exitCode = 1 })
