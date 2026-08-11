# Acceptance Attempt 3 implementation-to-independent-acceptance handoff

## Admission status

- Acceptance Attempt 3: **NOT ADMITTED**
- State: awaiting independent handoff verification and admission signature
- Started: `false`
- Eligible to execute: `false`
- Acceptance owner: not assigned by TEAM B; the independent acceptance session must record its own identity when admitting the attempt
- Decision: none; TEAM B does not predeclare PASS or FAIL

TEAM B has prepared this implementation/process remediation record only. TEAM B must not execute any Attempt 3 command. No command in the normative package may run until an independent acceptance owner verifies this record against the remotes and explicitly persists the correctly spelled statement `Acceptance Attempt 3: ADMITTED`.

This record is additive. It does not edit, delete, replace, or reinterpret any Acceptance Attempt 1 or Attempt 2 evidence, receipt, report, trace, failed sample, external evidence directory, or recorded SHA-256 value.

## Acceptance Attempt 2 failure carried forward

Acceptance Attempt 2 is CLOSED / FAIL. Its admitted `checkout-runtime` command had a fixed 60-second timeout and terminated fail closed:

```text
git checkout --detach a1c3cd6d6d2dd25fab063539e9fe40fbb327b846
TIMEOUT after 60 seconds: checkout-runtime.
Stop immediately; no retry or backfill is permitted.
```

All subsequent Attempt 2 gates were NOT RUN. The formal evidence directory `D:\tmp\lo-runtime-acceptance-attempt-2` must remain unchanged and must not be reused by Attempt 3.

A separately isolated manual diagnostic checkout exited 0 after 108.631 seconds at HEAD `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846` with a clean worktree. That result shows that the commit exists and that the former 60-second timeout was insufficient. It is diagnosis only, not Attempt 2 acceptance evidence, retry, continuation, backfill, or success.

## Process remediation

Attempt 3 raises both fresh-checkout command timeouts to 300 seconds:

- `checkout-runtime`: 300 seconds;
- `checkout-pdfhow`: 300 seconds.

The 300-second Runtime timeout provides material headroom over the independently observed 108.631-second checkout. No checkout content is skipped. Both repositories are still cloned with `--no-checkout` into a new acceptance root and then detached at the fixed commits. The command package does not use a prior worktree, TEAM B staging, an old extraction, Attempt 1/2 downloads, or a local overlay.

No product implementation, frozen candidate byte, Release asset, Release identity, native/WASM output, or acceptance gate was changed by this timeout-only remediation.

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

The complete verbatim Attempt 3 command package is:

1. `acceptance/attempt-3-commands.ps1`
2. `acceptance/attempt-3-download-assets.mjs`

`attempt-3-commands.ps1` fixes working directories, repository URLs, checkout commits, environment variables, inputs, outputs, per-command timeout boundaries, expected exit code 0, and evidence paths. Every external process is invoked once through `Invoke-FailClosedCommand`, which writes command JSON, stdout and stderr, kills the process tree on timeout, requires the expected exit code, and throws immediately. Retry, continuation, replacement, and backfill are disabled.

### Invocation allowed only after independent admission

From a fresh checkout of the handoff commit, substitute only an absolute DOCX path whose SHA-256 is `a78495545ae41486aa61c9a0e8c4c78f6491a8e7b3cfacbd4185ed0f124f59df`:

```powershell
Set-Location <fresh-handoff-checkout-root>
pwsh -NoProfile -File .trellis/tasks/08-10-publish-qualified-libreoffice-runtime-artifact/acceptance/attempt-3-commands.ps1 -PinnedDocxFixture <absolute-pinned-DOCX-path> -AcceptanceRoot D:\tmp\lo-runtime-acceptance-attempt-3
```

Expected exit code: 0. `D:\tmp\lo-runtime-acceptance-attempt-3` must not already exist. A mismatch found during admission means the attempt remains NOT ADMITTED and the command is not started. Once execution starts, any failure or timeout ends Attempt 3 immediately; the command, failed sample, and missing later gates must not be rerun or backfilled.

### Required environment

```text
CI=1
PLAYWRIGHT_WORKERS=1
PLAYWRIGHT_HTML_OPEN=never
OFFICE_BROWSER_DOCX_FIXTURE=<resolved pinned fixture>
OFFICE_RUNTIME_ROOT=D:\tmp\lo-runtime-acceptance-attempt-3\verified-extract
ACCEPTANCE_RETRY_POLICY=disabled
GIT_TERMINAL_PROMPT=0
npm_config_fetch_retries=0
npm_config_fetch_retry_maxtimeout=0
npm_config_fetch_retry_mintimeout=0
```

### External commands, working directories, timeouts, and evidence

All commands expect exit code 0 and produce `<index>-<name>.command.json`, `.stdout.log`, and `.stderr.log` under `D:\tmp\lo-runtime-acceptance-attempt-3\evidence`, plus the named assertion files.

- acceptance root; 300s: `git clone --no-checkout https://github.com/killbus/libreoffice-wasm-conversion-runtime.git D:\tmp\lo-runtime-acceptance-attempt-3\runtime-repository`
- Runtime repository; 300s: `git checkout --detach a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`
- Runtime repository; 30s: `git rev-parse HEAD`
- Runtime repository; 60s: `git ls-remote origin refs/heads/main refs/heads/feat/publish-qualified-libreoffice-runtime-artifact`
- Runtime repository; 30s: `git merge-base --is-ancestor a1c3cd6d6d2dd25fab063539e9fe40fbb327b846 origin/feat/publish-qualified-libreoffice-runtime-artifact`
- acceptance root; 300s: `git clone --no-checkout https://github.com/killbus/pdfhow.com-next.git D:\tmp\lo-runtime-acceptance-attempt-3\pdfhow-repository`
- PDFHow repository; 300s: `git checkout --detach b41fde5db9829ede7e6e217de6ac12c2b475b7fc`
- PDFHow repository; 30s: `git rev-parse HEAD`
- PDFHow repository; 60s: `git ls-remote origin refs/heads/main`
- acceptance root; 60s: `gh api repos/killbus/libreoffice-wasm-conversion-runtime/actions/workflows/325462492/runs?per_page=1`; evidence `preflight-native-workflow-assertions.json`
- handoff acceptance directory; 900s: `node attempt-3-download-assets.mjs D:\tmp\lo-runtime-acceptance-attempt-3\release-download`; evidence `attempt-3-release-download.json`
- Runtime repository; 900s: `node scripts/release-runtime/verify.mjs --archive D:\tmp\lo-runtime-acceptance-attempt-3\release-download\libreoffice-wasm-runtime-21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b.zip --extract-root D:\tmp\lo-runtime-acceptance-attempt-3\verified-extract --report-out D:\tmp\lo-runtime-acceptance-attempt-3\evidence\archive-verification-report.json --spec scripts/release-runtime/candidate-spec.json --expected-candidate-id 21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b`
- Runtime repository; 600s: `pnpm install --frozen-lockfile --ignore-scripts`
- Runtime repository; 600s: `pnpm build` (wrapper/package build only; not a native/WASM build)
- Runtime repository; 300s: `pnpm exec vitest run tests/release-runtime/workflow-guard.test.ts tests/release-runtime/cli-contract.test.ts --reporter=verbose`
- Runtime repository; 30s: `node scripts/release-runtime/verify.mjs --help`
- Runtime repository; 30s: `node scripts/release-runtime/stage-draft.mjs --help`
- Runtime repository; 900s: `node scripts/release-runtime/node-smoke-gate.cjs --extract D:\tmp\lo-runtime-acceptance-attempt-3\verified-extract\wasm --input <resolved-pinned-DOCX> --work D:\tmp\lo-runtime-acceptance-attempt-3\evidence\node-gate-work`
- PDFHow repository; 900s: `pnpm install --frozen-lockfile --ignore-scripts`
- PDFHow repository; 900s: `pnpm exec playwright install chromium`
- PDFHow repository; 900s: `pnpm exec playwright test tests/office-conversion/office-browser.playwright.ts --config=playwright.config.ts --reporter=line --workers=1 --retries=0 --repeat-each=1 --trace=retain-on-failure --output=D:\tmp\lo-runtime-acceptance-attempt-3\evidence\pdfhow-full-gate-output`
- acceptance root; 60s: `gh api repos/killbus/libreoffice-wasm-conversion-runtime/actions/workflows/325462492/runs?per_page=1`; evidence `native-workflow-assertions.json`
- acceptance root; 60s: `gh api repos/killbus/libreoffice-wasm-conversion-runtime/releases/367637128`; evidence `final-release-assertions.json`

After `verify.mjs`, in-process assertions require central-directory and extraction path safety, exactly eight runtime files plus two control files, fixed provenance, ABI `lok-convert-document-v1`, schema 1, pthread main-script mode, `externalWorker: null`, absence of `soffice.worker.js`, and `releaseQualified: false`.

The downloaded-byte Node gate requires positive, negative, reuse, recovery, ABI, and cleanup phases. Its evidence files are `node-smoke-result.json` and `node-gate-assertions.json`; `destroyed`, `moduleReleased`, and `initializedFalse` must all be true.

## Five fresh-browser cold-start commands

The normative command contains a loop from sample 1 through sample 5. It starts five separate Playwright CLI processes. For each sample it sets `OFFICE_COLD_START_SAMPLE`, creates a distinct output directory, and runs from the fixed PDFHow checkout with a 900-second timeout:

```text
pnpm exec playwright test tests/office-conversion/office-browser.playwright.ts --config=playwright.config.ts --grep=validates conversion, recovery, assets, and teardown in local-candidate mode --reporter=line --workers=1 --retries=0 --repeat-each=1 --trace=retain-on-failure --output=D:\tmp\lo-runtime-acceptance-attempt-3\evidence\pdfhow-cold-start-<1-through-5>-output
```

The named test covers conversion, cancellation progress, normal recovery, dispose, and command/process exit. A failure or timeout throws before the next sample begins. Failed or missing samples may not be restarted, replaced, supplemented, or backfilled. Five consecutive successful processes produce `five-cold-start-summary.json`.

## Complete gate scope starts from zero

Attempt 3 must execute every gate from the beginning after admission. It may not reuse or backfill Attempt 1/2 results:

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

1. Admission verification is read-only. Any mismatch keeps Attempt 3 NOT ADMITTED.
2. Do not substitute bytes, paths, assets, checkouts, worktrees, extractions, downloads, samples, or evidence.
3. Once formally started, any nonzero exit, timeout, assertion failure, crash, or missing evidence ends Attempt 3 immediately.
4. Retry, automatic retry, rerun, failed-sample restart, continuation, replacement, supplementation, and backfill are forbidden.
5. Preserve every failed attempt directory unchanged.
6. Release `367637128` must remain draft, `releaseQualified` must remain false, and all assets must remain immutable.
7. Do not trigger a native/WASM build.
8. Command completion is not PASS. Only the independently assigned acceptance owner may review evidence and sign PASS or FAIL.

## TEAM B declaration

TEAM B has persisted the Attempt 2 failure history and prepared this timeout-remediated Attempt 3 handoff only. TEAM B has not executed Attempt 3, has not admitted Attempt 3, and has not predeclared its PASS/FAIL conclusion.
