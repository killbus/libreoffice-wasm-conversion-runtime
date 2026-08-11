# Acceptance Attempt 3 implementation-to-independent-acceptance handoff

## Admission status

- Acceptance Attempt 3: **ADMITTED**
- State: independently re-admitted after TEAM B timestamp-contract remediation; formal execution has not started
- Started: `false`
- Eligible to execute: `true`
- Acceptance owner: OpenAI Codex AI 编程代理（当前验收会话实例）
- Decision: pending independent execution and signature; TEAM B does not predeclare PASS or FAIL

TEAM B has prepared this implementation/process remediation record only. TEAM B must not execute any Attempt 3 command. No command in the normative package may run until an independent acceptance owner verifies this record against the remotes and explicitly persists the correctly spelled statement `Acceptance Attempt 3: ADMITTED`.

## Independent admission signature — 2026-08-11

**Acceptance Attempt 3: ADMITTED**

I, **OpenAI Codex AI 编程代理（当前验收会话实例）**, independently accept responsibility for executing Acceptance Attempt 3 and for signing its final PASS/FAIL decision. I did not participate in TEAM B's implementation, remediation, commits, or conclusion formulation.

Before admitting the attempt, I independently verified the following without running the formal Attempt 3 command package:

- the clean handoff checkout and remote feature ref both resolve to `9446c68269c4fc4444383bbca2bc5919d5c5291d`;
- Runtime `origin/main` resolves to `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`, and that remediation commit is contained by the handoff feature tip;
- PDFHow `origin/main` resolves to `b41fde5db9829ede7e6e217de6ac12c2b475b7fc`;
- Release `367637128` has the fixed tag and target, remains `draft: true` with `published_at: null`, and still exposes exactly the five fixed asset IDs, names, byte sizes, and SHA-256 digests recorded below;
- the fixed `CANDIDATE-MANIFEST.json` still records candidate ID `21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b`, `releaseQualified: false`, native commit/run/ABI/schema, wrapper commit, `main-script` pthread mode, `externalWorker: null`, and the exact eight runtime assets without `soffice.worker.js`;
- Build WASM workflow `325462492` still reports run `31211473147`, created `2026-08-07T19:26:24Z`, head SHA `71d33678ed74872ebbb1bc37f5778143f8f5e401`, conclusion `success`, as its latest run;
- Attempt 1 historical receipt/evidence/report SHA-256 values remain unchanged, and the handoff commit does not modify the existing Attempt 2 handoff or command package;
- the Attempt 3 command package differs from Attempt 2 only in the new attempt identity/root/helper and the intended 300-second Runtime/PDFHow checkout timeouts; it remains single-pass, retry-free, and fail-closed and retains every required gate;
- PowerShell parsing, `node --check`, task-state assertions, and Trellis validation passed;
- the pinned DOCX exists at 6,693,403 bytes with SHA-256 `a78495545ae41486aa61c9a0e8c4c78f6491a8e7b3cfacbd4185ed0f124f59df`;
- `D:\tmp\lo-runtime-acceptance-attempt-3` does not exist, and no Attempt 3 formal command has run.

That subsequently revoked admission bound the historical command package hashes as follows:

- `attempt-3-commands.ps1`: `900fb7b7c89280e6f36ad6f8f2e8b7f6089326a73c3f33f9cd406624d762422d`;
- `attempt-3-download-assets.mjs`: `0b5eaa1d55ae5dc0a9c651de6ba47a682136a09a1b381023440b9faad2b22cb0`.

This signature makes Attempt 3 eligible but does not mark it started and does not imply PASS. The formal command may be invoked exactly once only after this admission record is committed, pushed, and independently rechecked at the remote ref.
## Independent pre-start admission revocation — 2026-08-11

**Acceptance Attempt 3: NOT ADMITTED**

After the admission commit was pushed but before any formal Attempt 3 command ran, the mandatory final remote recheck exposed a command-package/runtime contract mismatch. GitHub still returned the exact frozen Build WASM `created_at` value `2026-08-07T19:26:24Z`, but PowerShell `7.6.4` deserialized that JSON value as `System.DateTime`. The normative command compares that object directly to the string `$NativeWorkflowCreatedAt` at lines 238 and 415. The direct comparison evaluates to `false`, while normalization back to invariant UTC evaluates to the expected frozen value.

The command package declares only “PowerShell 7 or later” and therefore admits PowerShell 7.6.4. As written, it would fail its preflight Build WASM creation-time assertion before reaching the remaining gates, despite there being no workflow drift. This contradicts the formal command/environment contract.

Fail-closed disposition:

- Attempt 3 formal execution: **NOT STARTED**;
- Attempt 3 eligible: `false`;
- Attempt 3 PASS/FAIL decision: none, because the formal attempt did not start;
- `D:\tmp\lo-runtime-acceptance-attempt-3`: absent;
- no Release asset downloaded or modified by Attempt 3;
- Release `367637128` remains draft and unqualified;
- Build WASM run `31211473147` remains the latest run;
- no retry, substitution, local patch, or formal gate execution was performed.

TEAM B must remediate and test the PowerShell JSON date contract, persist a new handoff commit, and return the package for a new independent admission decision. The independent executor must not locally edit the command and continue.

This record is additive. It does not edit, delete, replace, or reinterpret any Acceptance Attempt 1 or Attempt 2 evidence, receipt, report, trace, failed sample, external evidence directory, or recorded SHA-256 value.

## TEAM B timestamp-contract remediation handoff — 2026-08-11

TEAM B has completed only the command-package remediation requested after the pre-start admission revocation. Attempt 3 remains **NOT ADMITTED**, `eligible: false`, `started: false`, with no PASS/FAIL decision. TEAM B did not run any Attempt 3 formal command, download any Attempt 3 asset, create `D:\tmp\lo-runtime-acceptance-attempt-3`, publish or mutate Release `367637128`, or trigger a native/WASM build.

The former direct `System.DateTime`-to-string checks in both the preflight and final Build WASM invariance gates now call the same dot-sourced helper, `attempt-3-time-contract.ps1`. The helper converts supported values to an unambiguous UTC instant before comparing ticks:

- `System.DateTimeOffset` is normalized with `ToUniversalTime()`;
- `System.DateTime` is accepted only when `Kind` is not `Unspecified`, then normalized to UTC;
- strings must contain an explicit `Z` or numeric offset and are parsed with `InvariantCulture`, `AssumeUniversal`, and `AdjustToUniversal`;
- null, unsupported types, invalid strings, offset-free strings, ambiguous `DateTime`, and different instants fail closed.

Both affected assertions are remediated. The preflight and final checks use `Assert-SameAcceptanceUtcInstant`; neither retains direct object-to-string equality.

Executable contract test:

```powershell
pwsh -NoLogo -NoProfile -File .trellis/tasks/08-10-publish-qualified-libreoffice-runtime-artifact/acceptance/attempt-3-time-contract.tests.ps1
```

Verified result on PowerShell `7.6.4`: exit code `0`; `ConvertFrom-Json` returned `System.DateTime`; the same instant passed across JSON `DateTime`, ISO string, `DateTimeOffset`, and a different explicit offset; a one-second change failed closed; invalid, offset-free, unsupported, and `DateTimeKind.Unspecified` inputs failed closed; comparison remained valid under `tr-TR` culture.

Remediated package SHA-256 values:

- `attempt-3-commands.ps1`: `0a57a72f4d64f99570ce7db53124e17ed94936ccd536b924ef9c342723bdb929`;
- `attempt-3-download-assets.mjs`: `731356b001b7cdba1e5c778092638494af65e8f64a63637f486fb360b51ce8f5`;
- `attempt-3-time-contract.ps1`: `d07788e24e6200928fa9685d0778e7d903cb8c3b32d44fd7d67aadaa685d550e`;
- `attempt-3-time-contract.tests.ps1`: `61af58aaf3cd5fd0d5b62e8a334a1bb295802ff9cf90fa01250ad3129e5cc208`.

The independent acceptance executor must verify this new TEAM B commit and the fixed remote/Release/build state, then explicitly persist `Acceptance Attempt 3: ADMITTED` before executing the formal package. This remediation handoff does not restore the revoked admission by itself.

## Independent re-admission signature after timestamp remediation — 2026-08-11

**Acceptance Attempt 3: ADMITTED**

I, **OpenAI Codex AI 编程代理（当前验收会话实例）**, independently accept responsibility for executing Acceptance Attempt 3 and for signing its final PASS/FAIL decision. I did not participate in TEAM B's timestamp-contract implementation, remediation commit, test-result formulation, or handoff conclusion.

Before re-admitting the attempt, I independently verified the following without running the formal Attempt 3 command package:

- the clean local checkout and remote feature ref both resolve to TEAM B handoff commit `d73b72cd38709d4bff94b380cf30439d55516d27`;
- Runtime `origin/main` resolves to `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`, that commit is contained by the handoff feature tip, and PDFHow `origin/main` resolves to `b41fde5db9829ede7e6e217de6ac12c2b475b7fc`;
- the TEAM B delta from the admission-revocation commit is limited to the handoff/task history, the shared timestamp helper and executable contract test, and replacement of both affected direct timestamp comparisons with the helper;
- PowerShell parser validation passed for the formal command, helper, and contract test; `node --check` passed for the download helper; Trellis validation and `git diff --check` passed;
- the contract test passed on PowerShell `7.6.4`, including JSON `System.DateTime`, equivalent types/offsets, one-second drift rejection, invalid/ambiguous/unsupported input rejection, and `tr-TR` culture independence;
- Release `367637128` retains the fixed ID, tag, target, `draft: true`, `published_at: null`, and exactly the five fixed asset IDs, names, byte sizes, and SHA-256 digests;
- the remote `CANDIDATE-MANIFEST.json` retains candidate ID `21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b`, `releaseQualified: false`, fixed native/wrapper provenance, ABI `lok-convert-document-v1`, schema 1, `main-script` pthread mode, `externalWorker: null`, and exactly eight runtime files without `soffice.worker.js`;
- Build WASM workflow `325462492` still reports run `31211473147`, created `2026-08-07T19:26:24Z`, head SHA `71d33678ed74872ebbb1bc37f5778143f8f5e401`, conclusion `success`, as its latest run, and the remediated helper accepts that GitHub JSON `System.DateTime` as the same UTC instant;
- Attempt 1 receipt/evidence/report SHA-256 values remain unchanged, and TEAM B did not modify the Attempt 2 handoff or command history;
- the pinned DOCX remains 6,693,403 bytes with SHA-256 `a78495545ae41486aa61c9a0e8c4c78f6491a8e7b3cfacbd4185ed0f124f59df`;
- `D:\tmp\lo-runtime-acceptance-attempt-3` does not exist, TEAM B did not run Attempt 3, and the independent formal Attempt 3 command has not started.

This re-admission binds the complete package hashes as follows:

- `attempt-3-commands.ps1`: `0a57a72f4d64f99570ce7db53124e17ed94936ccd536b924ef9c342723bdb929`;
- `attempt-3-download-assets.mjs`: `731356b001b7cdba1e5c778092638494af65e8f64a63637f486fb360b51ce8f5`;
- `attempt-3-time-contract.ps1`: `d07788e24e6200928fa9685d0778e7d903cb8c3b32d44fd7d67aadaa685d550e`;
- `attempt-3-time-contract.tests.ps1`: `61af58aaf3cd5fd0d5b62e8a334a1bb295802ff9cf90fa01250ad3129e5cc208`.

Attempt 3 is now eligible but remains `started: false`; this signature does not imply PASS. The formal command may be invoked exactly once only after this re-admission record is committed, pushed, and independently rechecked at the remote feature ref. Any command failure or timeout closes Attempt 3 immediately with no retry, continuation, replacement, supplementation, or backfill.

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
2. `acceptance/attempt-3-time-contract.ps1`
3. `acceptance/attempt-3-download-assets.mjs`

The executable remediation-only contract test is `acceptance/attempt-3-time-contract.tests.ps1`; it is not an Attempt 3 gate and running it does not start Attempt 3.

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
