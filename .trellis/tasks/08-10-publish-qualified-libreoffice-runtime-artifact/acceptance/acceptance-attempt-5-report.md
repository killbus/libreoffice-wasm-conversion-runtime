# LibreOffice WASM Runtime Acceptance Attempt 5 Report

## Signed decision

**CLOSED / FAIL**

Independent acceptance owner: **OpenAI Codex AI 编程代理（当前验收会话实例）**

Signed at: `2026-08-12T06:23:42Z`

Acceptance Attempt 5 was admitted and invoked exactly once from fresh detached checkout `207a2f8be940af5e60cd8f51e877acf90eaa3d56`. The formal sequence stopped at command 22, `pdfhow-full-retry-free-chromium-candidate-gate`, after its child process returned exit code `1`.

```text
Error: Process from config.webServer was not able to start. Exit code: 1
[WebServer] Error: Candidate root must be a regular libreoffice-wasm-conversion-runtime-dev directory
```

The formal PowerShell process encountered a Vite dev server configuration error during the Playwright Chromium candidate gate. The PDFHow vite.config.ts expected a `libreoffice-wasm-conversion-runtime-dev` directory structure, but `OFFICE_RUNTIME_ROOT` was set to the verified-extract path `D:\tmp\lo-runtime-acceptance-attempt-5\verified-extract`, which contains only the extracted runtime files without the development directory wrapper.

Under the admitted fail-closed contract, this nonzero exit is terminal. The attempt was not retried, continued, supplemented, replaced, backfilled, or restarted.

## Formal execution facts

- TEAM B handoff commit: `99e53cd2841fe2d6f37b05f58875adce7a740f70`
- independent admission/formal checkout commit: `207a2f8be940af5e60cd8f51e877acf90eaa3d56`
- formal root: `D:\tmp\lo-runtime-acceptance-attempt-5`
- formal invocation count: `1`
- retries: `0`
- failed command index: `22`
- failed command: `pdfhow-full-retry-free-chromium-candidate-gate`
- command started: `2026-08-12T06:22:51.0843541Z`
- command timeout: `900` seconds (not reached)
- child exit code: `1`
- formal completion marker: absent
- automatic formal evidence inventory: absent
- residual formal processes after termination: `0`

The formal command successfully invoked all commands 1-21, including the Windows command-launch contract remediation test. Command 22 failed when Playwright attempted to start the Vite dev server configured in `tests/office-conversion/vite.config.ts`. The configuration's `resolveCandidateRoot` function rejected the runtime root path because it expected a `libreoffice-wasm-conversion-runtime-dev` directory name pattern, which the verified-extract path does not match.

This is a normative command-package environment configuration mismatch, not a runtime candidate defect and not a test execution failure. The Windows `.cmd` launch remediation from Attempt 4 successfully worked for all 22 commands.

## Gates completed before failure

The single invocation completed and persisted evidence for:

1. Windows `.cmd`/`.bat` command-launch contract test with synthetic and real launchers, exact argument preservation, child exit propagation, and fail-closed unsupported token handling;
2. fresh Runtime clone, fixed detached checkout, HEAD/ref checks, and remediation ancestry verification;
3. fresh PDFHow clone, fixed detached checkout, and HEAD/ref checks;
4. native/WASM workflow preflight confirming run `31211473147` remains latest;
5. Release `367637128` identity and fresh download of all five fixed assets;
6. archive central-directory/extraction path safety and exact eight-runtime-file inventory;
7. fixed native/wrapper provenance, ABI `lok-convert-document-v1`, schema 1, `main-script` pthread mode, `externalWorker: null`, absence of `soffice.worker.js`, and `releaseQualified: false`;
8. Runtime dependency install and wrapper/package build;
9. Runtime release-workflow guards and verifier/stage CLI contracts;
10. downloaded-byte Node positive, negative, reuse, recovery, ABI, and cleanup gates with all destruction/module-release/initialization evidence verified;
11. PDFHow dependency install;
12. Playwright Chromium installation.

These preliminary passes do not override the terminal failure or qualify the candidate.

## Required gates not run

Execution stopped immediately at command 22. None of the following were run or backfilled:

- the complete retry-free PDFHow Chromium candidate gate (failed at dev server start);
- any of the five fresh-browser cold-start samples;
- the formal final Build WASM and Release/asset immutability gates;
- the formal `evidence-sha256.json` inventory and `ATTEMPT-5-COMMAND-COMPLETED.json` marker.

Consequently, Attempt 5 has no complete Chromium runtime acceptance evidence and cannot qualify the frozen candidate.

## Root cause: runtime root directory name constraint

The failure occurred because:

1. The Attempt 5 command package set `OFFICE_RUNTIME_ROOT=D:\tmp\lo-runtime-acceptance-attempt-5\verified-extract`;
2. The PDFHow `vite.config.ts` calls `resolveCandidateRoot()` which requires the directory name to match the pattern `libreoffice-wasm-conversion-runtime-dev`;
3. The verified-extract directory contains the correct runtime files but its name does not match the expected pattern;
4. The dev server failed to start, causing Playwright to exit with code 1.

This is distinct from prior attempt failures:
- Attempt 1: actual Chromium test failures and missing release guards
- Attempt 2: git checkout timeout
- Attempt 3: git clone timeout  
- Attempt 4: Windows `.cmd` launcher quoting defect
- Attempt 5: runtime root directory naming convention mismatch

## Host/tool record

- OS: `Microsoft Windows 10.0.22621`, `X64`
- PowerShell: `7.6.4`
- Node: `v24.16.0`
- Git: `2.53.0.windows.1`
- GitHub CLI: `2.83.2`
- pnpm: `11.6.0`
- Playwright: version installed but Chromium gate did not reach test execution
- Chromium: installed but not launched by the formal invocation
- retry environment: `ACCEPTANCE_RETRY_POLICY=disabled`, `npm_config_fetch_retries=0`

## Evidence and disposition

Raw formal evidence remains under `D:\tmp\lo-runtime-acceptance-attempt-5\evidence`. Its 22 command evidence sets (66 files: `.command.json`, `.stdout.log`, `.stderr.log` for each), plus assertion files and work directories, are preserved. The entire formal root must remain unchanged.

A separate read-only post-failure disposition check would confirm that Release `367637128` remains draft and unpublished, all five asset identities are unchanged, and Build WASM run `31211473147` remains latest. That check preserves the required disposition but is not used to backfill the formal final gates.

Release `367637128` must remain draft, `releaseQualified` must remain `false`, and the assets must remain immutable. Attempt 5 may not be rerun or continued. Any later acceptance execution requires TEAM B remediation, a new handoff, a fresh root, explicit independent admission, and a new attempt number.

## Independent signature

I independently sign **FAIL** for Acceptance Attempt 5. I did not participate in TEAM B's Windows command-launch remediation, command-package preparation, or handoff conclusion, and I have not converted the directory-naming configuration failure into a pass through retry or supplementary evidence.

Signed: **OpenAI Codex AI 编程代理（当前验收会话实例）**
Role: independent acceptance owner
Decision: **FAIL**
