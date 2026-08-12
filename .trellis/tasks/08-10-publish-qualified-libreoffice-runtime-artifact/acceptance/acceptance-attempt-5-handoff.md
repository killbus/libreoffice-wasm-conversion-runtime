# Acceptance Attempt 5 implementation-to-independent-acceptance handoff

## Admission status

- Acceptance Attempt 5: **ADMITTED**
- eligible: `true`
- started: `false`
- formal invocation count: `0`
- decision: `null`; no PASS or FAIL is predeclared
- admission scope: execution and independent PASS/FAIL signature only
- independent acceptance owner: **OpenAI Codex AI 编程代理（当前验收会话实例）**
- new formal root: `D:\tmp\lo-runtime-acceptance-attempt-5`

TEAM B prepared only the implementation/process remediation and the original handoff. TEAM B did not execute or admit Acceptance Attempt 5. The independent owner subsequently verified the committed and pushed handoff against the fixed identities and persisted the admission signature below. This admission does not imply PASS and does not start the formal invocation.

## Independent admission signature — 2026-08-12

**Acceptance Attempt 5: ADMITTED**

I, **OpenAI Codex AI 编程代理（当前验收会话实例）**, am the independent acceptance executor for this attempt. I did not participate in TEAM B's Attempt 5 implementation, Windows command-launch remediation, commits, package-test result formulation, or handoff conclusion. I accept responsibility under my actual system identity for the single formal Acceptance Attempt 5 execution and for independently signing its final PASS/FAIL decision.

Before this admission, and without invoking any formal Attempt 5 command, I independently verified:

- the clean admission checkout `D:\tmp\lo-runtime-attempt-5-admission-check-99e53cd` and the remote feature ref resolved to TEAM B handoff commit `99e53cd2841fe2d6f37b05f58875adce7a740f70`;
- Runtime `origin/main` resolved to `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`, which is an ancestor of the feature tip, and PDFHow `origin/main` resolved to `b41fde5db9829ede7e6e217de6ac12c2b475b7fc`;
- the delta from Attempt 4 closure commit `4cfd07117d441f100765de0281296cbd6a7be131` is limited to Attempt 5 handoff/command/helper/test files plus `task.json` and `implement.md`, without changing Attempt 4 evidence;
- the Attempt 5 formal root `D:\tmp\lo-runtime-acceptance-attempt-5` did not exist, while the preserved Attempt 4 root still existed and all 43 formal evidence files plus all 3 external launch artifacts matched their committed names, sizes, and SHA-256 values;
- all five PowerShell files passed parser validation, `attempt-5-download-assets.mjs` passed `node --check`, Trellis task validation and `git diff --check` passed, and the timestamp contract test passed on PowerShell `7.6.4`;
- the production-same launcher contract test independently passed on PowerShell `7.6.4` with git `2.53.0.windows.1`, gh `2.83.2`, Node `v24.16.0`, and pnpm.cmd `11.6.0`, covering `.cmd`/`.bat` argument preservation, exact child exit `23`, native executable launching, and fail-closed quote/CR/LF/percent/exclamation inputs;
- the formal command dot-sources the same launcher helper and executes the same launcher contract test as formal command 1;
- Release `367637128` retained the fixed tag, target `df3f73c789e6d2abf71cbcd75186118d2bbc795a`, `draft: true`, and `published_at: null`;
- the Release exposed exactly the five fixed assets with unchanged IDs, names, sizes, update timestamps, and SHA-256 values recorded below;
- a native-byte admission download of `CANDIDATE-MANIFEST.json` was exactly 2,365 bytes with SHA-256 `c33b76b49346b08d0cdcbf1ce64db3025f9ceacd29113664279c56e0dae8dab0`; it records the frozen candidate, `releaseQualified: false`, fixed native/wrapper provenance, ABI `lok-convert-document-v1`, schema 1, pthread mode `main-script`, `externalWorker: null`, exactly eight runtime files, and no `soffice.worker.js`;
- the latest Build WASM run remained `31211473147`, created `2026-08-07T19:26:24Z`, head SHA `71d33678ed74872ebbb1bc37f5778143f8f5e401`, status `completed`, conclusion `success`, with no newer native/WASM build;
- the pinned DOCX remained 6,693,403 bytes with SHA-256 `a78495545ae41486aa61c9a0e8c4c78f6491a8e7b3cfacbd4185ed0f124f59df`;
- TEAM B did not execute Attempt 5, and the independent formal invocation count remained zero.

This admission binds the immutable formal package hashes:

- `attempt-5-commands.ps1`: `20ab8596fbb93212188ac50d21d56669daac565204684bcf22f4b3da0d1aa475`;
- `attempt-5-download-assets.mjs`: `c89029017a349b88d29dfc4b799bc710624c4b0559a86e93080674bd870a1806`;
- `attempt-5-time-contract.ps1`: `d07788e24e6200928fa9685d0778e7d903cb8c3b32d44fd7d67aadaa685d550e`;
- `attempt-5-time-contract.tests.ps1`: `6641538284bc8ba00b2bbadc661b2f33edd9406b238d445cfb3c48333139442b`;
- `attempt-5-command-launch.ps1`: `4e278a03386813c9d48bd4366124403916d0f7c0bd57632cea45d4f1ccc6f11d`;
- `attempt-5-command-launch.tests.ps1`: `cbcebe59ff763e745189e58a3c1ad28b2818c7503f79059c113ed59eb1842ce5`.

Admission makes Attempt 5 eligible but leaves `started: false`, `decision: null`, and formal invocation count `0`. The formal run must use a different new checkout and the fixed fresh root. Any formal nonzero exit, timeout, assertion failure, crash, or missing evidence closes Attempt 5 immediately with no retry, continuation, failed-sample replacement, supplementation, or backfill. Transport or monitoring disconnections may be retried only as observation operations and never authorize a second formal invocation.
## Acceptance Attempt 4 failure carried forward

Acceptance Attempt 4 is permanently **CLOSED / FAIL**. It was formally invoked exactly once. Commands 1–12 completed; command 13, `runtime-install`, returned child exit code `1` before its 600-second timeout because the command package passed the resolved `pnpm.cmd` through `ProcessStartInfo.ArgumentList` as a `cmd.exe /d /s /c` command string containing literal backslash-escaped quotes. `cmd.exe` rejected the malformed launcher before pnpm started.

The formal closure commit is `4cfd07117d441f100765de0281296cbd6a7be131`. No retry, continuation, rerun, replacement, supplementation, or backfill occurred. Gates after command 13 were NOT RUN. The formal root `D:\tmp\lo-runtime-acceptance-attempt-4` must remain unchanged, may never be reused, and cannot satisfy any Attempt 5 gate.

## Attempt 5 Windows command-launch remediation

The fresh-checkout, fixed-baseline, timeout, retry-free, and fail-closed requirements remain unchanged. The only normative launcher remediation is the Windows `.cmd`/`.bat` contract used by every external command resolved with either extension:

1. native `.exe` commands continue to use `ProcessStartInfo.ArgumentList`;
2. `.cmd` and `.bat` commands use `%ComSpec%` and a raw `ProcessStartInfo.Arguments` string for `/d /s /c` with one conventional raw outer-quoted batch command;
3. the raw command string is supplied exactly once and is never passed through `ArgumentList`, preventing .NET argv escaping from becoming literal backslash-escaped quotes for cmd.exe;
4. embedded double quotes, CR/LF, `%`, and `!` fail closed before process start rather than undergoing ambiguous cmd.exe expansion;
5. each command evidence JSON records the resolved executable and the selected `launchContract`.

The shared production helper is `acceptance/attempt-5-command-launch.ps1`. The exact same helper is exercised by `acceptance/attempt-5-command-launch.tests.ps1` and by the formal command. TEAM B executed the contract test only as non-acceptance remediation verification on PowerShell `7.6.3`:

- synthetic `.cmd`: exit `0`, all arguments preserved;
- synthetic `.bat`: exit `0`, all arguments preserved;
- synthetic `.cmd` exit `23`: exact child exit propagated;
- actual `git.exe`, `gh.exe`, and `node.exe`: native `ArgumentList` branch, exit `0`;
- actual `pnpm.cmd` `11.6.0`: raw cmd.exe branch, exit `0`;
- arguments with spaces, `&`, `|`, `^`, parentheses, long grep text, and Windows paths were preserved exactly;
- quote, newline, percent-expansion, and delayed-expansion tokens failed closed.

This test is not Attempt 5 execution or evidence. The formal command independently runs it as command 1 with a 120-second timeout after admission.

## Normative package hashes

- `attempt-5-commands.ps1`: `20ab8596fbb93212188ac50d21d56669daac565204684bcf22f4b3da0d1aa475`
- `attempt-5-download-assets.mjs`: `c89029017a349b88d29dfc4b799bc710624c4b0559a86e93080674bd870a1806`
- `attempt-5-time-contract.ps1`: `d07788e24e6200928fa9685d0778e7d903cb8c3b32d44fd7d67aadaa685d550e`
- `attempt-5-time-contract.tests.ps1`: `6641538284bc8ba00b2bbadc661b2f33edd9406b238d445cfb3c48333139442b`
- `attempt-5-command-launch.ps1`: `4e278a03386813c9d48bd4366124403916d0f7c0bd57632cea45d4f1ccc6f11d`
- `attempt-5-command-launch.tests.ps1`: `cbcebe59ff763e745189e58a3c1ad28b2818c7503f79059c113ed59eb1842ce5`
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

The complete verbatim Attempt 5 command package is:

1. `acceptance/attempt-5-commands.ps1`
2. `acceptance/attempt-5-time-contract.ps1`
3. `acceptance/attempt-5-command-launch.ps1`
4. `acceptance/attempt-5-command-launch.tests.ps1`
5. `acceptance/attempt-5-download-assets.mjs`

The formal command invokes `attempt-5-command-launch.tests.ps1` as its first fail-closed external gate. The separate timestamp remediation test is `acceptance/attempt-5-time-contract.tests.ps1`; running either test independently for TEAM B remediation verification does not start Attempt 5.

`attempt-5-commands.ps1` fixes working directories, repository URLs, checkout commits, environment variables, inputs, outputs, per-command timeout boundaries, expected exit code 0, and evidence paths. Every external process is invoked once through `Invoke-FailClosedCommand`, which writes command JSON, stdout and stderr, kills the process tree on timeout, requires the expected exit code, and throws immediately. Retry, continuation, replacement, and backfill are disabled.

### Invocation allowed only after independent admission

From a fresh checkout of the handoff commit, substitute only an absolute DOCX path whose SHA-256 is `a78495545ae41486aa61c9a0e8c4c78f6491a8e7b3cfacbd4185ed0f124f59df`:

```powershell
Set-Location <fresh-handoff-checkout-root>
pwsh -NoProfile -File .trellis/tasks/08-10-publish-qualified-libreoffice-runtime-artifact/acceptance/attempt-5-commands.ps1 -PinnedDocxFixture <absolute-pinned-DOCX-path> -AcceptanceRoot D:\tmp\lo-runtime-acceptance-attempt-5
```

Expected exit code: 0. `D:\tmp\lo-runtime-acceptance-attempt-5` must not already exist. A mismatch found during admission means the attempt remains NOT ADMITTED and the command is not started. Once execution starts, any failure or timeout ends Attempt 5 immediately; the command, failed sample, and missing later gates must not be rerun or backfilled.

### Required environment

```text
CI=1
PLAYWRIGHT_WORKERS=1
PLAYWRIGHT_HTML_OPEN=never
OFFICE_BROWSER_DOCX_FIXTURE=<resolved pinned fixture>
OFFICE_RUNTIME_ROOT=D:\tmp\lo-runtime-acceptance-attempt-5\verified-extract
ACCEPTANCE_RETRY_POLICY=disabled
GIT_TERMINAL_PROMPT=0
npm_config_fetch_retries=0
npm_config_fetch_retry_maxtimeout=0
npm_config_fetch_retry_mintimeout=0
```

### External commands, working directories, timeouts, and evidence

All commands expect exit code 0 and produce `<index>-<name>.command.json`, `.stdout.log`, and `.stderr.log` under `D:\tmp\lo-runtime-acceptance-attempt-5\evidence`, plus the named assertion files.
- handoff acceptance directory; 120s: `pwsh -NoLogo -NoProfile -File .trellis/tasks/08-10-publish-qualified-libreoffice-runtime-artifact/acceptance/attempt-5-command-launch.tests.ps1`; verifies synthetic `.cmd` and `.bat`, real `pnpm.cmd`, native git/gh/node, exact argument preservation, child exit propagation, and fail-closed unsupported expansion tokens
- acceptance root; 300s: `git clone --no-checkout https://github.com/killbus/libreoffice-wasm-conversion-runtime.git D:\tmp\lo-runtime-acceptance-attempt-5\runtime-repository`
- Runtime repository; 300s: `git checkout --detach a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`
- Runtime repository; 30s: `git rev-parse HEAD`
- Runtime repository; 60s: `git ls-remote origin refs/heads/main refs/heads/feat/publish-qualified-libreoffice-runtime-artifact`
- Runtime repository; 30s: `git merge-base --is-ancestor a1c3cd6d6d2dd25fab063539e9fe40fbb327b846 origin/feat/publish-qualified-libreoffice-runtime-artifact`
- acceptance root; 900s: `git clone --no-checkout https://github.com/killbus/pdfhow.com-next.git D:\tmp\lo-runtime-acceptance-attempt-5\pdfhow-repository`
- PDFHow repository; 300s: `git checkout --detach b41fde5db9829ede7e6e217de6ac12c2b475b7fc`
- PDFHow repository; 30s: `git rev-parse HEAD`
- PDFHow repository; 60s: `git ls-remote origin refs/heads/main`
- acceptance root; 60s: `gh api repos/killbus/libreoffice-wasm-conversion-runtime/actions/workflows/325462492/runs?per_page=1`; evidence `preflight-native-workflow-assertions.json`
- handoff acceptance directory; 900s: `node attempt-5-download-assets.mjs D:\tmp\lo-runtime-acceptance-attempt-5\release-download`; evidence `attempt-5-release-download.json`
- Runtime repository; 900s: `node scripts/release-runtime/verify.mjs --archive D:\tmp\lo-runtime-acceptance-attempt-5\release-download\libreoffice-wasm-runtime-21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b.zip --extract-root D:\tmp\lo-runtime-acceptance-attempt-5\verified-extract --report-out D:\tmp\lo-runtime-acceptance-attempt-5\evidence\archive-verification-report.json --spec scripts/release-runtime/candidate-spec.json --expected-candidate-id 21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b`
- Runtime repository; 600s: `pnpm install --frozen-lockfile --ignore-scripts`
- Runtime repository; 600s: `pnpm build` (wrapper/package build only; not a native/WASM build)
- Runtime repository; 300s: `pnpm exec vitest run tests/release-runtime/workflow-guard.test.ts tests/release-runtime/cli-contract.test.ts --reporter=verbose`
- Runtime repository; 30s: `node scripts/release-runtime/verify.mjs --help`
- Runtime repository; 30s: `node scripts/release-runtime/stage-draft.mjs --help`
- Runtime repository; 900s: `node scripts/release-runtime/node-smoke-gate.cjs --extract D:\tmp\lo-runtime-acceptance-attempt-5\verified-extract\wasm --input <resolved-pinned-DOCX> --work D:\tmp\lo-runtime-acceptance-attempt-5\evidence\node-gate-work`
- PDFHow repository; 900s: `pnpm install --frozen-lockfile --ignore-scripts`
- PDFHow repository; 900s: `pnpm exec playwright install chromium`
- PDFHow repository; 900s: `pnpm exec playwright test tests/office-conversion/office-browser.playwright.ts --config=playwright.config.ts --reporter=line --workers=1 --retries=0 --repeat-each=1 --trace=retain-on-failure --output=D:\tmp\lo-runtime-acceptance-attempt-5\evidence\pdfhow-full-gate-output`
- acceptance root; 60s: `gh api repos/killbus/libreoffice-wasm-conversion-runtime/actions/workflows/325462492/runs?per_page=1`; evidence `native-workflow-assertions.json`
- acceptance root; 60s: `gh api repos/killbus/libreoffice-wasm-conversion-runtime/releases/367637128`; evidence `final-release-assertions.json`

After `verify.mjs`, in-process assertions require central-directory and extraction path safety, exactly eight runtime files plus two control files, fixed provenance, ABI `lok-convert-document-v1`, schema 1, pthread main-script mode, `externalWorker: null`, absence of `soffice.worker.js`, and `releaseQualified: false`.

The downloaded-byte Node gate requires positive, negative, reuse, recovery, ABI, and cleanup phases. Its evidence files are `node-smoke-result.json` and `node-gate-assertions.json`; `destroyed`, `moduleReleased`, and `initializedFalse` must all be true.

## Five fresh-browser cold-start commands

The normative command contains a loop from sample 1 through sample 5. It starts five separate Playwright CLI processes. For each sample it sets `OFFICE_COLD_START_SAMPLE`, creates a distinct output directory, and runs from the fixed PDFHow checkout with a 900-second timeout:

```text
pnpm exec playwright test tests/office-conversion/office-browser.playwright.ts --config=playwright.config.ts --grep=validates conversion, recovery, assets, and teardown in local-candidate mode --reporter=line --workers=1 --retries=0 --repeat-each=1 --trace=retain-on-failure --output=D:\tmp\lo-runtime-acceptance-attempt-5\evidence\pdfhow-cold-start-<1-through-5>-output
```

The named test covers conversion, cancellation progress, normal recovery, dispose, and command/process exit. A failure or timeout throws before the next sample begins. Failed or missing samples may not be restarted, replaced, supplemented, or backfilled. Five consecutive successful processes produce `five-cold-start-summary.json`.

## Complete gate scope starts from zero

Attempt 5 must execute every gate from the beginning after admission. It may not reuse or backfill Attempt 1/2/3/4 results:

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

1. Admission verification is read-only. Any mismatch keeps Attempt 5 NOT ADMITTED.
2. Do not substitute bytes, paths, assets, checkouts, worktrees, extractions, downloads, samples, or evidence.
3. Once formally started, any nonzero exit, timeout, assertion failure, crash, or missing evidence ends Attempt 5 immediately.
4. Retry, automatic retry, rerun, failed-sample restart, continuation, replacement, supplementation, and backfill are forbidden.
5. Preserve every failed attempt directory unchanged.
6. Release `367637128` must remain draft, `releaseQualified` must remain false, and all assets must remain immutable.
7. Do not trigger a native/WASM build.
8. Command completion is not PASS. Only the independently assigned acceptance owner may review evidence and sign PASS or FAIL.

## TEAM B declaration

TEAM B has preserved the complete Attempt 1/2/3 history and the Attempt 4 CLOSED / FAIL record. TEAM B prepared this command-launch-remediated Attempt 5 handoff only. TEAM B has not modified or reused `D:\tmp\lo-runtime-acceptance-attempt-4`, has not executed Attempt 5, has not admitted Attempt 5, and has not predeclared its PASS/FAIL conclusion.
