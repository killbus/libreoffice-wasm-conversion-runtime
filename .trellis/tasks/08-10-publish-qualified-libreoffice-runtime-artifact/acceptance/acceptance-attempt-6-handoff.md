# Acceptance Attempt 6 implementation-to-independent-acceptance handoff

## Admission status

- Acceptance Attempt 6: **PENDING ADMISSION**
- eligible: pending independent verification
- started: `false`
- formal invocation count: `0`
- decision: `null`; no PASS or FAIL is predeclared
- admission scope: execution and independent PASS/FAIL signature only
- independent acceptance owner: **OpenAI Codex AI 编程代理（当前验收会话实例）**
- new formal root: `D:\tmp\lo-runtime-acceptance-attempt-6`

TEAM B prepared only the implementation/process remediation and this handoff. TEAM B did not execute or admit Acceptance Attempt 6. The independent owner must verify the committed and pushed handoff against the fixed identities and persist the admission signature.

## Acceptance Attempt 5 failure carried forward

Acceptance Attempt 5 is permanently **CLOSED / FAIL**. It was formally invoked exactly once. Commands 1-21 completed successfully, including the Windows `.cmd`/`.bat` command-launch contract remediation test, confirming the Attempt 4 launcher fix works correctly. Command 22, `pdfhow-full-retry-free-chromium-candidate-gate`, returned child exit code `1` before its 900-second timeout because the Vite dev server failed to start. The PDFHow `vite.config.ts` file's `resolveCandidateRoot()` function requires the runtime root directory basename to exactly match `libreoffice-wasm-conversion-runtime-dev`, but `OFFICE_RUNTIME_ROOT` was set to `D:\tmp\lo-runtime-acceptance-attempt-5\verified-extract`.

The formal closure commit is `8c20abb`. No retry, continuation, rerun, replacement, supplementation, or backfill occurred. Gates after command 22 were NOT RUN. The formal root `D:\tmp\lo-runtime-acceptance-attempt-5` must remain unchanged, may never be reused, and cannot satisfy any Attempt 6 gate.

## Attempt 6 runtime root directory naming remediation

The fresh-checkout, fixed-baseline, timeout, retry-free, and fail-closed requirements remain unchanged. The only normative remediation is the runtime candidate extraction directory naming:

1. All Attempt 5 command package files remain unchanged except for version numbering and path updates;
2. The Windows `.cmd`/`.bat` command-launch contract remediation from Attempt 5 is preserved without modification;
3. The extraction root is renamed from `verified-extract` to `libreoffice-wasm-conversion-runtime-dev` to satisfy PDFHow's `resolveCandidateRoot()` directory basename check;
4. `OFFICE_RUNTIME_ROOT` is set to the conforming extraction root path;
5. All other environment variables, timeouts, command sequences, and assertion logic remain identical to Attempt 5.

The shared production helper remains `acceptance/attempt-6-command-launch.ps1` (unchanged from Attempt 5). The exact same helper is exercised by `acceptance/attempt-6-command-launch.tests.ps1` and by the formal command. TEAM B executed the contract test only as non-acceptance remediation verification on PowerShell `7.6.4` with the same results as Attempt 5.

This remediation is not Attempt 6 execution or evidence. The formal command independently runs the contract test as command 1 with a 120-second timeout after admission.

## Normative package hashes

- `attempt-6-commands.ps1`: `a12bf9894b6154a66dd18a0a2d42be4727ed53b87a930e56da044853505320be`
- `attempt-6-download-assets.mjs`: `c89029017a349b88d29dfc4b799bc710624c4b0559a86e93080674bd870a1806`
- `attempt-6-time-contract.ps1`: `d07788e24e6200928fa9685d0778e7d903cb8c3b32d44fd7d67aadaa685d550e`
- `attempt-6-time-contract.tests.ps1`: `e901328495809eb1a6a0df19ba5001518b02c976277248e3a9bf937647ad131f`
- `attempt-6-command-launch.ps1`: `4e278a03386813c9d48bd4366124403916d0f7c0bd57632cea45d4f1ccc6f11d`
- `attempt-6-command-launch.tests.ps1`: `7be0bb39e8570b1add9afc42e0b4c7274e56b75df7a5e5b78507818e982acae5`

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

The complete verbatim Attempt 6 command package is:

1. `acceptance/attempt-6-commands.ps1`
2. `acceptance/attempt-6-time-contract.ps1`
3. `acceptance/attempt-6-command-launch.ps1`
4. `acceptance/attempt-6-command-launch.tests.ps1`
5. `acceptance/attempt-6-download-assets.mjs`

The formal command invokes `attempt-6-command-launch.tests.ps1` as its first fail-closed external gate. The separate timestamp remediation test is `acceptance/attempt-6-time-contract.tests.ps1`; running either test independently for TEAM B remediation verification does not start Attempt 6.

`attempt-6-commands.ps1` fixes working directories, repository URLs, checkout commits, environment variables, inputs, outputs, per-command timeout boundaries, expected exit code 0, and evidence paths. The only change from Attempt 5 is:

```powershell
# Attempt 5:
$ExtractRoot = Join-Path $AcceptanceRoot 'verified-extract'

# Attempt 6:
$ExtractRoot = Join-Path $AcceptanceRoot 'libreoffice-wasm-conversion-runtime-dev'
```

Every external process is invoked once through `Invoke-FailClosedCommand`, which writes command JSON, stdout and stderr, kills the process tree on timeout, requires the expected exit code, and throws immediately. Retry, continuation, replacement, and backfill are disabled.

### Invocation allowed only after independent admission

From a fresh checkout of the handoff commit, substitute only an absolute DOCX path whose SHA-256 is `a78495545ae41486aa61c9a0e8c4c78f6491a8e7b3cfacbd4185ed0f124f59df`:

```powershell
Set-Location <fresh-handoff-checkout-root>
pwsh -NoProfile -File .trellis/tasks/08-10-publish-qualified-libreoffice-runtime-artifact/acceptance/attempt-6-commands.ps1 -PinnedDocxFixture <absolute-pinned-DOCX-path> -AcceptanceRoot D:\tmp\lo-runtime-acceptance-attempt-6
```

Expected exit code: 0. `D:\tmp\lo-runtime-acceptance-attempt-6` must not already exist. A mismatch found during admission means the attempt remains NOT ADMITTED and the command is not started. Once execution starts, any failure or timeout ends Attempt 6 immediately; the command, failed sample, and missing later gates must not be rerun or backfilled.

### Required environment

```text
CI=1
PLAYWRIGHT_WORKERS=1
PLAYWRIGHT_HTML_OPEN=never
OFFICE_BROWSER_DOCX_FIXTURE=<resolved pinned fixture>
OFFICE_RUNTIME_ROOT=D:\tmp\lo-runtime-acceptance-attempt-6\libreoffice-wasm-conversion-runtime-dev
ACCEPTANCE_RETRY_POLICY=disabled
GIT_TERMINAL_PROMPT=0
npm_config_fetch_retries=0
npm_config_fetch_retry_maxtimeout=0
npm_config_fetch_retry_mintimeout=0
```

Note: `OFFICE_RUNTIME_ROOT` now points to the renamed extraction directory matching PDFHow's expected basename pattern.

### External commands, working directories, timeouts, and evidence

All commands expect exit code 0 and produce `<index>-<name>.command.json`, `.stdout.log`, and `.stderr.log` under `D:\tmp\lo-runtime-acceptance-attempt-6\evidence`, plus the named assertion files. The command sequence and timeouts are identical to Attempt 5.

## Complete gate scope starts from zero

Attempt 6 must execute every gate from the beginning after admission. It may not reuse or backfill Attempt 1/2/3/4/5 results:

1. Windows `.cmd`/`.bat` command-launch contract on the execution host;
2. Release ID, tag, target, draft state, and `published_at` verification;
3. fresh download of all five Release assets;
4. exact names, byte lengths, and SHA-256 verification;
5. archive path safety and exact eight-runtime-file inventory;
6. provenance, ABI/schema, pthread mode, and `soffice.worker.js` absence;
7. Runtime workflow guards;
8. verifier/stage CLI contracts;
9. downloaded-byte Node positive, negative, reuse, recovery, ABI, and cleanup gates;
10. complete retry-free Chromium candidate gate;
11. five consecutive fresh-browser cold starts;
12. final native/WASM-build immutability check;
13. final Release identity, draft state, and asset immutability check.

## Fail-closed rules

1. Admission verification is read-only. Any mismatch keeps Attempt 6 NOT ADMITTED.
2. Do not substitute bytes, paths, assets, checkouts, worktrees, extractions, downloads, samples, or evidence.
3. Once formally started, any nonzero exit, timeout, assertion failure, crash, or missing evidence ends Attempt 6 immediately.
4. Retry, automatic retry, rerun, failed-sample restart, continuation, replacement, supplementation, and backfill are forbidden.
5. Preserve every failed attempt directory unchanged.
6. Release `367637128` must remain draft, `releaseQualified` must remain false, and all assets must remain immutable.
7. Do not trigger a native/WASM build.
8. Command completion is not PASS. Only the independently assigned acceptance owner may review evidence and sign PASS or FAIL.

## TEAM B declaration

TEAM B has preserved the complete Attempt 1/2/3/4/5 history and failure records. TEAM B prepared this directory-naming-remediated Attempt 6 handoff only. TEAM B has not modified or reused any prior attempt roots, has not executed Attempt 6, has not admitted Attempt 6, and has not predeclared its PASS/FAIL conclusion.
