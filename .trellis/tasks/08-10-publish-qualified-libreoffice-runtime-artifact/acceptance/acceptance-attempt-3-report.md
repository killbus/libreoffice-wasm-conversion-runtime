# LibreOffice WASM Runtime Acceptance Attempt 3 Report

## Signed decision

**CLOSED / FAIL**

Independent acceptance owner: **OpenAI Codex AI 编程代理（当前验收会话实例）**

Signed at: `2026-08-11T20:17:29Z`

Acceptance Attempt 3 was admitted and invoked exactly once from fresh detached checkout `027fd8d69f7d02584a97e444180946e61516c687`. The invocation exited `1` after the mandatory `clone-pdfhow` command exceeded its fixed 300-second timeout.

```text
TIMEOUT after 300 seconds: clone-pdfhow. Stop immediately; no retry or backfill is permitted.
```

Under the admitted fail-closed contract, this timeout is terminal. The attempt was not retried, continued, supplemented, replaced, or backfilled.

## Formal execution facts

- TEAM B handoff commit: `d73b72cd38709d4bff94b380cf30439d55516d27`
- independent re-admission/formal checkout commit: `027fd8d69f7d02584a97e444180946e61516c687`
- formal root: `D:\tmp\lo-runtime-acceptance-attempt-3`
- formal invocation count: `1`
- retries: `0`
- failed command index: `6`
- failed command: `clone-pdfhow`
- command started: `2026-08-11T20:12:28.6943643Z`
- command timeout: `300` seconds
- formal exit code: `1`
- completion marker: absent
- active Git processes after termination: `0`

The formal invocation completed these preliminary commands before the terminal failure:

1. fresh Runtime clone;
2. detached Runtime checkout at `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`;
3. Runtime HEAD verification;
4. Runtime remote main/feature ref verification;
5. remediation-commit ancestry verification.

The fresh PDFHow clone began but did not finish inside 300 seconds. Its stderr contains only the initial `Cloning into ...` line; stdout is empty.

## Required gates not run

Execution stopped immediately. None of the following were run or backfilled:

- PDFHow checkout at `b41fde5db9829ede7e6e217de6ac12c2b475b7fc` and PDFHow ref verification;
- formal preflight Build WASM verification;
- GitHub Release asset download and all five asset identity checks;
- archive path safety, exact inventory, provenance, ABI/schema, pthread mode, and worker-absence assertions;
- release workflow guards and verifier/stage CLI contracts;
- downloaded-byte Node positive, negative, reuse, recovery, ABI, and cleanup gates;
- retry-free PDFHow Chromium candidate gate;
- all five fresh-browser cold-start samples;
- final Build WASM and Release immutability checks.

Consequently, Attempt 3 has no complete runtime acceptance evidence and cannot qualify the frozen candidate.

## Host/tool record

- OS: `Microsoft Windows NT 10.0.22621.0`, `X64`
- PowerShell: `7.6.4`
- Node: `v24.16.0`
- Git: `2.53.0.windows.1`
- GitHub CLI: `2.83.2`
- Playwright: not reached; no formal-version observation
- Chromium: not reached; no browser was installed or launched by the formal invocation
- retry environment: `ACCEPTANCE_RETRY_POLICY=disabled`, `npm_config_fetch_retries=0`

## Evidence and disposition

Raw evidence remains under `D:\tmp\lo-runtime-acceptance-attempt-3\evidence`. Its 19 generated files, sizes, and SHA-256 values are recorded in `acceptance-attempt-3-evidence.json`. The formal root must remain unchanged.

Release `367637128` must remain draft and unpublished, and `releaseQualified` must remain `false`. Attempt 3 may not be rerun or continued. Any later acceptance attempt requires a new TEAM B handoff, a fresh root, explicit independent admission, and a new attempt number.

## Independent signature

I independently sign **FAIL** for Acceptance Attempt 3. I did not participate in TEAM B's implementation, remediation, command-package preparation, or handoff conclusion, and I have not converted the timeout into a pass through retry or supplementary evidence.

Signed: **OpenAI Codex AI 编程代理（当前验收会话实例）**  
Role: independent acceptance owner  
Decision: **FAIL**