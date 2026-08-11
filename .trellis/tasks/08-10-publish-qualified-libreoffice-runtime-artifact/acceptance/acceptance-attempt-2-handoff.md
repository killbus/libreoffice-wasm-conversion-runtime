# Acceptance Attempt 2 implementation-to-independent-acceptance handoff

## Formal admission

- Acceptance Attempt 2: ADMITTED
- Acceptance owner: OpenAI Codex AI 编程代理（当前验收会话实例）
- Admission scope: execution and independent PASS/FAIL signature
- Decision: pending independent execution; TEAM B has not set PASS or FAIL

The acceptance owner did not participate in TEAM B implementation, remediation, commits, Release asset preparation, or acceptance-conclusion formulation. TEAM B only persists this handoff and does not execute Attempt 2.

This record is additive. It does not edit, delete, replace, or reinterpret Acceptance Attempt 1 evidence. acceptance/acceptance-receipt.rejected.json, acceptance/acceptance-evidence.json, the Attempt 1 report, trace, failed sample, and recorded SHA-256 values remain historical evidence. Attempt 1 remains rejected.

## Fixed baseline

- Runtime repository: https://github.com/killbus/libreoffice-wasm-conversion-runtime
- Runtime remediation checkout: a1c3cd6d6d2dd25fab063539e9fe40fbb327b846
- Runtime remote containment: origin/main and ancestor of origin/feat/publish-qualified-libreoffice-runtime-artifact
- PDFHow repository: https://github.com/killbus/pdfhow.com-next
- PDFHow remediation checkout: b41fde5db9829ede7e6e217de6ac12c2b475b7fc
- PDFHow remote containment: origin/main
- Frozen candidate ID: 21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b
- Draft Release ID: 367637128
- GitHub Release URL: https://github.com/killbus/libreoffice-wasm-conversion-runtime/releases/tag/untagged-dc0c60d518acc26b2117
- Release tag: runtime-artifact-21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b
- Release target: df3f73c789e6d2abf71cbcd75186118d2bbc795a
- Required state: draft true; published_at null; releaseQualified false
- Attempt 1 archive and frozen payload SHA-256: e9aac8dde2fb627251155fc97651c2bd35bec63b01e39f882d342c024a87de9a
- Verifier version: scripts/release-runtime/verify.mjs at Runtime checkout a1c3cd6d6d2dd25fab063539e9fe40fbb327b846
- Stage version: scripts/release-runtime/stage-draft.mjs at Runtime checkout a1c3cd6d6d2dd25fab063539e9fe40fbb327b846
- Native provenance: commit 71d33678ed74872ebbb1bc37f5778143f8f5e401; Build WASM workflow 325462492; run 31211473147; created 2026-08-07T19:26:24Z; success

## Exact immutable Release assets

| Asset | Bytes | SHA-256 |
|---|---:|---|
| ASSET-SHA256SUMS | 677 | 83bb7bb697dcf4b8feb59934ad928aa22b8d87c18104ebeed451a3eb7aff9c32 |
| CANDIDATE-MANIFEST.json | 2365 | c33b76b49346b08d0cdcbf1ce64db3025f9ceacd29113664279c56e0dae8dab0 |
| libreoffice-wasm-runtime-21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b.zip | 248934231 | e9aac8dde2fb627251155fc97651c2bd35bec63b01e39f882d342c024a87de9a |
| SHA256SUMS | 333 | df1e89e0364660c75d00fcaa4cf77fbd80176986812a8009e9a3e176e9bc9dac |
| STAGING-REPORT.json | 4571 | 2094842f73c67cd31481741480a27646607f4a18eda3337bf5dfaebc714c7cc6 |

At persistence time Release 367637128 remains draft, releaseQualified remains false, its five assets have not been replaced, and Build WASM run 31211473147 remains newest. No new native/WASM build has been triggered since the frozen candidate. Existing Release assets must not be replaced, re-uploaded, renamed, removed, or modified.

## Normative command package

These two files form the complete command package and are incorporated into this handoff:

1. acceptance/attempt-2-commands.ps1
2. acceptance/attempt-2-download-assets.mjs

attempt-2-commands.ps1 is the normative verbatim command source. It fixes every working directory, checkout, environment variable, input/output path, timeout, expected exit code, and evidence file. Every external process is invoked once through Invoke-FailClosedCommand. That wrapper persists command JSON, stdout, and stderr, kills the process tree on timeout, requires exit code 0, and throws immediately. No command is retried.

### Permitted invocation

From a fresh checkout of the handoff commit, substitute only an absolute DOCX path whose SHA-256 is a78495545ae41486aa61c9a0e8c4c78f6491a8e7b3cfacbd4185ed0f124f59df:

    Set-Location <fresh handoff checkout root>
    pwsh -NoProfile -File .trellis/tasks/08-10-publish-qualified-libreoffice-runtime-artifact/acceptance/attempt-2-commands.ps1 -PinnedDocxFixture <absolute pinned DOCX path> -AcceptanceRoot D:\tmp\lo-runtime-acceptance-attempt-2

Expected exit code is 0. The acceptance root must not already exist. On failure or timeout, preserve evidence and stop. Do not rerun the command or sample and do not backfill later samples.

### Required environment

    CI=1
    PLAYWRIGHT_WORKERS=1
    PLAYWRIGHT_HTML_OPEN=never
    OFFICE_BROWSER_DOCX_FIXTURE=<resolved pinned fixture>
    OFFICE_RUNTIME_ROOT=D:\tmp\lo-runtime-acceptance-attempt-2\verified-extract
    ACCEPTANCE_RETRY_POLICY=disabled
    GIT_TERMINAL_PROMPT=0
    npm_config_fetch_retries=0
    npm_config_fetch_retry_maxtimeout=0
    npm_config_fetch_retry_mintimeout=0

No formal command uses a TEAM B staging path, old extraction, local overlay, or Attempt 1 download directory.

## Complete verbatim command inventory

Each line records working directory, timeout, exact executable and arguments. Expected exit is 0 and evidence is the generated command JSON plus stdout and stderr unless an additional evidence file is named.

- acceptance root; 300s: git clone --no-checkout https://github.com/killbus/libreoffice-wasm-conversion-runtime.git D:\tmp\lo-runtime-acceptance-attempt-2\runtime-repository
- runtime repository; 60s: git checkout --detach a1c3cd6d6d2dd25fab063539e9fe40fbb327b846
- runtime repository; 30s: git rev-parse HEAD
- runtime repository; 60s: git ls-remote origin refs/heads/main refs/heads/feat/publish-qualified-libreoffice-runtime-artifact
- runtime repository; 30s: git merge-base --is-ancestor a1c3cd6d6d2dd25fab063539e9fe40fbb327b846 origin/feat/publish-qualified-libreoffice-runtime-artifact
- acceptance root; 300s: git clone --no-checkout https://github.com/killbus/pdfhow.com-next.git D:\tmp\lo-runtime-acceptance-attempt-2\pdfhow-repository
- PDFHow repository; 60s: git checkout --detach b41fde5db9829ede7e6e217de6ac12c2b475b7fc
- PDFHow repository; 30s: git rev-parse HEAD
- PDFHow repository; 60s: git ls-remote origin refs/heads/main
- acceptance root; 60s: gh api repos/killbus/libreoffice-wasm-conversion-runtime/actions/workflows/325462492/runs?per_page=1; preflight evidence preflight-native-workflow-assertions.json
- handoff acceptance directory; 900s: node attempt-2-download-assets.mjs D:\tmp\lo-runtime-acceptance-attempt-2\release-download; evidence attempt-2-release-download.json
- runtime repository; 900s: node scripts/release-runtime/verify.mjs --archive D:\tmp\lo-runtime-acceptance-attempt-2\release-download\libreoffice-wasm-runtime-21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b.zip --extract-root D:\tmp\lo-runtime-acceptance-attempt-2\verified-extract --report-out D:\tmp\lo-runtime-acceptance-attempt-2\evidence\archive-verification-report.json --spec scripts/release-runtime/candidate-spec.json --expected-candidate-id 21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b
- runtime repository; 600s: pnpm install --frozen-lockfile --ignore-scripts
- runtime repository; 600s: pnpm build; this is wrapper-only and is not a native/WASM build
- runtime repository; 300s: pnpm exec vitest run tests/release-runtime/workflow-guard.test.ts tests/release-runtime/cli-contract.test.ts --reporter=verbose
- runtime repository; 30s: node scripts/release-runtime/verify.mjs --help
- runtime repository; 30s: node scripts/release-runtime/stage-draft.mjs --help

- runtime repository; 900s: node scripts/release-runtime/node-smoke-gate.cjs --extract D:\tmp\lo-runtime-acceptance-attempt-2\verified-extract\wasm --input <resolved pinned DOCX> --work D:\tmp\lo-runtime-acceptance-attempt-2\evidence\node-gate-work
- PDFHow repository; 900s: pnpm install --frozen-lockfile --ignore-scripts
- PDFHow repository; 900s: pnpm exec playwright install chromium
- PDFHow repository; 900s: pnpm exec playwright test tests/office-conversion/office-browser.playwright.ts --config=playwright.config.ts --reporter=line --workers=1 --retries=0 --repeat-each=1 --trace=retain-on-failure --output=D:\tmp\lo-runtime-acceptance-attempt-2\evidence\pdfhow-full-gate-output
- acceptance root; 60s: gh api repos/killbus/libreoffice-wasm-conversion-runtime/actions/workflows/325462492/runs?per_page=1; final repeat; evidence native-workflow-assertions.json
- acceptance root; 60s: gh api repos/killbus/libreoffice-wasm-conversion-runtime/releases/367637128; evidence final-release-assertions.json

After verify.mjs, in-process assertions require central-directory and extraction path safety, exactly eight runtime files plus two control files, frozen provenance, ABI lok-convert-document-v1, schema 1, pthread main-script, externalWorker null, no soffice.worker.js, and releaseQualified false.

The Node gate requires positive, negative, reuse, recovery, ABI, and cleanup phases. destroyed, moduleReleased, and initializedFalse must all be true. Evidence is node-smoke-result.json and node-gate-assertions.json.

## Five independent cold-start commands

The normative command file contains a formal loop from sample 1 through sample 5. For each sample it sets OFFICE_COLD_START_SAMPLE, creates a distinct output directory, and launches this exact independent process from the PDFHow checkout with a 900-second timeout:

    pnpm exec playwright test tests/office-conversion/office-browser.playwright.ts --config=playwright.config.ts --grep=validates conversion, recovery, assets, and teardown in local-candidate mode --reporter=line --workers=1 --retries=0 --repeat-each=1 --trace=retain-on-failure --output=D:\tmp\lo-runtime-acceptance-attempt-2\evidence\pdfhow-cold-start-<1-through-5>-output

The loop invokes five separate Playwright CLI processes. Invoke-FailClosedCommand throws on the first nonzero exit or timeout, so later samples are not started and failed samples cannot be rerun, replaced, or backfilled. The named test covers conversion, cancellation progress, normal recovery, dispose, and teardown. Successful process exit is separately enforced. Five successful samples produce five-cold-start-summary.json.

## Fail-closed rules

1. Before starting, compare this record with remote refs, both checkouts, Release ID/tag/target/draft state, all asset names/sizes/SHA-256, and the latest Build WASM run.
2. Any preflight mismatch means Attempt 2 is not started. Do not substitute bytes, paths, assets, checkouts, or samples.
3. Any nonzero exit, timeout, assertion failure, crash, or missing evidence ends the attempt immediately.
4. Retry, automatic retry, failed-sample restart, replacement, backfill, and continuation after failure are forbidden.
5. Release 367637128 must remain draft; releaseQualified must remain false; all assets must remain immutable.
6. Do not trigger a native/WASM build.
7. Command completion is not itself PASS. The independent owner reviews evidence and separately signs PASS or FAIL.

## TEAM B declaration

TEAM B has persisted this handoff, command package, and task-state reconciliation only. TEAM B has not executed Acceptance Attempt 2 and has not predeclared its PASS/FAIL conclusion.
