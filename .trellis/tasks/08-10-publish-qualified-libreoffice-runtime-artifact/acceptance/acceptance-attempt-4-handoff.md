# Acceptance Attempt 4 implementation-to-independent-acceptance handoff

## Admission status

- Acceptance Attempt 4: **NOT ADMITTED**
- Eligible: `false`
- Started: `false`
- TEAM B formal invocation count: `0`
- Designated independent acceptance owner: OpenAI Codex AI 编程代理（当前验收会话实例）
- Admission scope after a future independent signature: execution and independent PASS/FAIL signature
- PASS/FAIL conclusion: not set and not predeclared by TEAM B

TEAM B has prepared only the implementation/process remediation and this handoff. TEAM B has not executed Acceptance Attempt 4 and cannot admit it. No command in the normative package may run until the independent acceptance owner verifies this committed and pushed handoff against all fixed remote identities and explicitly persists the correctly spelled statement `Acceptance Attempt 4: ADMITTED` in a later independent record.

## Acceptance Attempt 3 failure carried forward

Acceptance Attempt 3 is permanently **CLOSED / FAIL**. The independent owner invoked it exactly once. Command 6, `clone-pdfhow`, exceeded its fixed `300`-second timeout and the formal command exited `1` with:

```text
TIMEOUT after 300 seconds: clone-pdfhow. Stop immediately; no retry or backfill is permitted.
```

No retry, continuation, supplementation, replacement, backfill, or later-gate execution occurred. The independent failure record is commit `6e5a716cf0287afc5d6b97dfbceb658c19859146`. Its formal root `D:\tmp\lo-runtime-acceptance-attempt-3` must remain unchanged and must never be reused by Attempt 4. Attempt 3 evidence is historical only and cannot satisfy any Attempt 4 gate.

## TEAM B isolated clone diagnosis

TEAM B used only the separate non-acceptance diagnostic directory `D:\tmp\lo-runtime-team-b-pdfhow-clone-diagnostic-20260812`. It did not create or touch the Attempt 4 formal root.

- exact clone: `git clone --no-checkout https://github.com/killbus/pdfhow.com-next.git D:\tmp\lo-runtime-team-b-pdfhow-clone-diagnostic-20260812`
- clone exit code: `0`
- clone elapsed: `20.611` seconds
- checkout: `git checkout --detach b41fde5db9829ede7e6e217de6ac12c2b475b7fc`
- checkout exit code: `0`
- checkout elapsed: `3.842` seconds
- resulting HEAD: `b41fde5db9829ede7e6e217de6ac12c2b475b7fc`
- worktree status output: empty (clean)
- packed repository size reported by `git count-objects -vH`: `17.94 MiB`

This diagnosis proves only that the repository and fixed commit were reachable during the later TEAM B diagnostic. It is not Attempt 3 or Attempt 4 acceptance evidence, does not change the Attempt 3 FAIL decision, and may not be copied into, cited as satisfying, or backfilled into any Attempt 4 gate. The contrast between the formal `>300`-second stall and the later `20.611`-second clone is consistent with a transient clone/network stall; timeout remediation does not authorize retry within an attempt.

## Process remediation for Attempt 4

The Attempt 4 package preserves the full fresh clone and detached checkout contract. It does not use a shallow clone, partial clone, old worktree, TEAM B staging directory, local overlay, Attempt 3 partial clone, or cached acceptance result.

The only process-boundary change from the remediated Attempt 3 package is:

- `clone-pdfhow`: timeout raised from `300` seconds to `900` seconds.

The command remains single-pass and retry-free, expects exit code `0`, records command metadata/stdout/stderr, kills the process tree on timeout, and immediately terminates the attempt on any timeout or nonzero exit. The `900`-second boundary is three times the failed formal boundary and retains substantial margin over the isolated `20.611`-second clone measurement without weakening the fresh-clone requirement.

## Normative package hashes

These hashes bind the exact LF-normalized bytes committed for independent review:

- `attempt-4-commands.ps1`: `c6f52640bc9cd19d0dccf6fc8da91edb4a4251474e56c6db978c842b24e6b8c8`
- `attempt-4-download-assets.mjs`: `eaa675440202c62c848e6628597157ec30f52a751731da643765d67c6b25120e`
- `attempt-4-time-contract.ps1`: `d07788e24e6200928fa9685d0778e7d903cb8c3b32d44fd7d67aadaa685d550e`
- `attempt-4-time-contract.tests.ps1`: `3f42151806763042931aba2aa0b3e3c35c278e4d6919f8fb317d49c6be8c7aa7`

The timestamp helper/test are retained from the independently reviewed PowerShell 7.6.4 remediation. Running the helper contract test is TEAM B package verification only; it is not an acceptance gate and does not start Attempt 4.

## Fixed baseline

- Runtime repository: https://github.com/killbus/libreoffice-wasm-conversion-runtime
- Runtime checkout: `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`
- Required Runtime remote containment: `origin/main` and ancestor of `origin/feat/publish-qualified-libreoffice-runtime-artifact`
- PDFHow repository: https://github.com/killbus/pdfhow.com-next
- PDFHow checkout: `b41fde5db9829ede7e6e217de6ac12c2b475b7fc`
- Required PDFHow remote containment: `origin/main`
- Frozen candidate ID: `21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b`
- Draft Release ID: `367637128`
- GitHub Release URL: https://github.com/killbus/libreoffice-wasm-conversion-runtime/releases/tag/untagged-dc0c60d518acc26b2117
- Release tag: `runtime-artifact-21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b`
- Release target: `df3f73c789e6d2abf71cbcd75186118d2bbc795a`
- Required Release state: `draft: true`; `published_at: null`; `releaseQualified: false`
- Frozen payload / Attempt 1 archive SHA-256: `e9aac8dde2fb627251155fc97651c2bd35bec63b01e39f882d342c024a87de9a`
- Verifier version: `scripts/release-runtime/verify.mjs` at Runtime checkout `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`
- Stage version: `scripts/release-runtime/stage-draft.mjs` at Runtime checkout `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`
- Native provenance: commit `71d33678ed74872ebbb1bc37f5778143f8f5e401`; Build WASM workflow `325462492`; run `31211473147`; created `2026-08-07T19:26:24Z`; conclusion `success`

## Exact immutable Release assets

| GitHub asset ID | Asset | Bytes | SHA-256 |
|---:|---|---:|---|
| 508126612 | `ASSET-SHA256SUMS` | 677 | `83bb7bb697dcf4b8feb59934ad928aa22b8d87c18104ebeed451a3eb7aff9c32` |
| 508126611 | `CANDIDATE-MANIFEST.json` | 2365 | `c33b76b49346b08d0cdcbf1ce64db3025f9ceacd29113664279c56e0dae8dab0` |
| 508126614 | `libreoffice-wasm-runtime-21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b.zip` | 248934231 | `e9aac8dde2fb627251155fc97651c2bd35bec63b01e39f882d342c024a87de9a` |
| 508126610 | `SHA256SUMS` | 333 | `df1e89e0364660c75d00fcaa4cf77fbd80176986812a8009e9a3e176e9bc9dac` |
| 508140311 | `STAGING-REPORT.json` | 4571 | `2094842f73c67cd31481741480a27646607f4a18eda3337bf5dfaebc714c7cc6` |

Release `367637128` must remain draft and `releaseQualified` must remain false. Existing assets must not be replaced, re-uploaded, renamed, removed, or modified. No unnecessary native/WASM build may be triggered.

## Normative command package

The complete verbatim Attempt 4 command package is:

1. `acceptance/attempt-4-commands.ps1`
2. `acceptance/attempt-4-time-contract.ps1`
3. `acceptance/attempt-4-download-assets.mjs`

The executable remediation-only contract test is `acceptance/attempt-4-time-contract.tests.ps1`; it is not an Attempt 4 gate and running it does not start Attempt 4.

`attempt-4-commands.ps1` fixes working directories, repository URLs, checkout commits, environment variables, inputs, outputs, per-command timeout boundaries, expected exit code 0, and evidence paths. Every external process is invoked once through `Invoke-FailClosedCommand`, which writes command JSON, stdout and stderr, kills the process tree on timeout, requires the expected exit code, and throws immediately. Retry, continuation, replacement, and backfill are disabled.

### Invocation allowed only after independent admission

From a fresh checkout of the handoff commit, substitute only an absolute DOCX path whose SHA-256 is `a78495545ae41486aa61c9a0e8c4c78f6491a8e7b3cfacbd4185ed0f124f59df`:

```powershell
Set-Location <fresh-handoff-checkout-root>
pwsh -NoProfile -File .trellis/tasks/08-10-publish-qualified-libreoffice-runtime-artifact/acceptance/attempt-4-commands.ps1 -PinnedDocxFixture <absolute-pinned-DOCX-path> -AcceptanceRoot D:\tmp\lo-runtime-acceptance-attempt-4
```

Expected exit code: 0. `D:\tmp\lo-runtime-acceptance-attempt-4` must not already exist. A mismatch found during admission means the attempt remains NOT ADMITTED and the command is not started. Once execution starts, any failure or timeout ends Attempt 4 immediately; the command, failed sample, and missing later gates must not be rerun or backfilled.

### Required environment

```text
CI=1
PLAYWRIGHT_WORKERS=1
PLAYWRIGHT_HTML_OPEN=never
OFFICE_BROWSER_DOCX_FIXTURE=<resolved pinned fixture>
OFFICE_RUNTIME_ROOT=D:\tmp\lo-runtime-acceptance-attempt-4\verified-extract
ACCEPTANCE_RETRY_POLICY=disabled
GIT_TERMINAL_PROMPT=0
npm_config_fetch_retries=0
npm_config_fetch_retry_maxtimeout=0
npm_config_fetch_retry_mintimeout=0
```

### External commands, working directories, timeouts, and evidence

All commands expect exit code 0 and produce `<index>-<name>.command.json`, `.stdout.log`, and `.stderr.log` under `D:\tmp\lo-runtime-acceptance-attempt-4\evidence`, plus the named assertion files.

- acceptance root; 300s: `git clone --no-checkout https://github.com/killbus/libreoffice-wasm-conversion-runtime.git D:\tmp\lo-runtime-acceptance-attempt-4\runtime-repository`
- Runtime repository; 300s: `git checkout --detach a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`
- Runtime repository; 30s: `git rev-parse HEAD`
- Runtime repository; 60s: `git ls-remote origin refs/heads/main refs/heads/feat/publish-qualified-libreoffice-runtime-artifact`
- Runtime repository; 30s: `git merge-base --is-ancestor a1c3cd6d6d2dd25fab063539e9fe40fbb327b846 origin/feat/publish-qualified-libreoffice-runtime-artifact`
- acceptance root; 900s: `git clone --no-checkout https://github.com/killbus/pdfhow.com-next.git D:\tmp\lo-runtime-acceptance-attempt-4\pdfhow-repository`
- PDFHow repository; 300s: `git checkout --detach b41fde5db9829ede7e6e217de6ac12c2b475b7fc`
- PDFHow repository; 30s: `git rev-parse HEAD`
- PDFHow repository; 60s: `git ls-remote origin refs/heads/main`
- acceptance root; 60s: `gh api repos/killbus/libreoffice-wasm-conversion-runtime/actions/workflows/325462492/runs?per_page=1`; evidence `preflight-native-workflow-assertions.json`
- handoff acceptance directory; 900s: `node attempt-4-download-assets.mjs D:\tmp\lo-runtime-acceptance-attempt-4\release-download`; evidence `attempt-4-release-download.json`
- Runtime repository; 900s: `node scripts/release-runtime/verify.mjs --archive D:\tmp\lo-runtime-acceptance-attempt-4\release-download\libreoffice-wasm-runtime-21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b.zip --extract-root D:\tmp\lo-runtime-acceptance-attempt-4\verified-extract --report-out D:\tmp\lo-runtime-acceptance-attempt-4\evidence\archive-verification-report.json --spec scripts/release-runtime/candidate-spec.json --expected-candidate-id 21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b`
- Runtime repository; 600s: `pnpm install --frozen-lockfile --ignore-scripts`
- Runtime repository; 600s: `pnpm build` (wrapper/package build only; not a native/WASM build)
- Runtime repository; 300s: `pnpm exec vitest run tests/release-runtime/workflow-guard.test.ts tests/release-runtime/cli-contract.test.ts --reporter=verbose`
- Runtime repository; 30s: `node scripts/release-runtime/verify.mjs --help`
- Runtime repository; 30s: `node scripts/release-runtime/stage-draft.mjs --help`
- Runtime repository; 900s: `node scripts/release-runtime/node-smoke-gate.cjs --extract D:\tmp\lo-runtime-acceptance-attempt-4\verified-extract\wasm --input <resolved-pinned-DOCX> --work D:\tmp\lo-runtime-acceptance-attempt-4\evidence\node-gate-work`
- PDFHow repository; 900s: `pnpm install --frozen-lockfile --ignore-scripts`
- PDFHow repository; 900s: `pnpm exec playwright install chromium`
- PDFHow repository; 900s: `pnpm exec playwright test tests/office-conversion/office-browser.playwright.ts --config=playwright.config.ts --reporter=line --workers=1 --retries=0 --repeat-each=1 --trace=retain-on-failure --output=D:\tmp\lo-runtime-acceptance-attempt-4\evidence\pdfhow-full-gate-output`
- acceptance root; 60s: `gh api repos/killbus/libreoffice-wasm-conversion-runtime/actions/workflows/325462492/runs?per_page=1`; evidence `native-workflow-assertions.json`
- acceptance root; 60s: `gh api repos/killbus/libreoffice-wasm-conversion-runtime/releases/367637128`; evidence `final-release-assertions.json`

After `verify.mjs`, in-process assertions require central-directory and extraction path safety, exactly eight runtime files plus two control files, fixed provenance, ABI `lok-convert-document-v1`, schema 1, pthread main-script mode, `externalWorker: null`, absence of `soffice.worker.js`, and `releaseQualified: false`.

The downloaded-byte Node gate requires positive, negative, reuse, recovery, ABI, and cleanup phases. Its evidence files are `node-smoke-result.json` and `node-gate-assertions.json`; `destroyed`, `moduleReleased`, and `initializedFalse` must all be true.

## Five fresh-browser cold-start commands

The normative command contains a loop from sample 1 through sample 5. It starts five separate Playwright CLI processes. For each sample it sets `OFFICE_COLD_START_SAMPLE`, creates a distinct output directory, and runs from the fixed PDFHow checkout with a 900-second timeout:

```text
pnpm exec playwright test tests/office-conversion/office-browser.playwright.ts --config=playwright.config.ts --grep=validates conversion, recovery, assets, and teardown in local-candidate mode --reporter=line --workers=1 --retries=0 --repeat-each=1 --trace=retain-on-failure --output=D:\tmp\lo-runtime-acceptance-attempt-4\evidence\pdfhow-cold-start-<1-through-5>-output
```

The named test covers conversion, cancellation progress, normal recovery, dispose, and command/process exit. A failure or timeout throws before the next sample begins. Failed or missing samples may not be restarted, replaced, supplemented, or backfilled. Five consecutive successful processes produce `five-cold-start-summary.json`.

## Complete gate scope starts from zero

Attempt 4 must execute every gate from the beginning after admission. It may not reuse or backfill Attempt 1/2/3 results:

1. Release ID, tag, target, draft state, and `published_at` verification;
2. fresh download of all five Release assets;
3. exact names, byte lengths, and SHA-256 verification;
4. archive path safety and exact eight-runtime-file inventory;
5. provenance, ABI/schema, pthread mode, and `soffice.worker.js` absence;
6. Runtime workflow guards;
7. verifier/stage CLI contracts;
8. downloaded-byte Node positive, negative, reuse, recovery, ABI, and cleanup gates;
9. complete retry-free Chromium candidate gate;
10. five consecutive fresh-browser cold starts;
11. final native/WASM-build immutability check;
12. final Release identity, draft state, and asset immutability check.

## Fail-closed rules

1. Admission verification is read-only. Any mismatch keeps Attempt 4 NOT ADMITTED.
2. Do not substitute bytes, paths, assets, checkouts, worktrees, extractions, downloads, samples, or evidence.
3. Once formally started, any nonzero exit, timeout, assertion failure, crash, or missing evidence ends Attempt 4 immediately.
4. Retry, automatic retry, rerun, failed-sample restart, continuation, replacement, supplementation, and backfill are forbidden.
5. Preserve every failed attempt directory unchanged.
6. Release `367637128` must remain draft, `releaseQualified` must remain false, and all assets must remain immutable.
7. Do not trigger a native/WASM build.
8. Command completion is not PASS. Only the independently assigned acceptance owner may review evidence and sign PASS or FAIL.

## TEAM B declaration

TEAM B has preserved the complete Attempt 1/2 history and the Attempt 3 CLOSED / FAIL record, and has prepared this timeout-remediated Attempt 4 handoff only. TEAM B has not executed Attempt 4, has not admitted Attempt 4, and has not predeclared its PASS/FAIL conclusion.

