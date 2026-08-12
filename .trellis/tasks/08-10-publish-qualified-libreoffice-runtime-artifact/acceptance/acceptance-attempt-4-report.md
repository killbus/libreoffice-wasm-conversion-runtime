# LibreOffice WASM Runtime Acceptance Attempt 4 Report

## Signed decision

**CLOSED / FAIL**

Independent acceptance owner: **OpenAI Codex AI 编程代理（当前验收会话实例）**

Signed at: `2026-08-12T03:50:13Z`

Acceptance Attempt 4 was admitted and invoked exactly once from fresh detached checkout `3fbb14eba9ad009790f6f5b9ed1ac513096bdb77`. The formal sequence stopped at command 13, `runtime-install`, after its child process returned exit code `1`.

```text
'\"\"D:\Applications\Scoop\apps\nvm\current\nodejs\nodejs\pnpm.cmd\" \"install\" \"--frozen-lockfile\" \"--ignore-scripts\"\"' is not recognized as an internal or external command,
operable program or batch file.
```

The formal PowerShell process then emitted:

```text
Unexpected exit code 1, expected 0: runtime-install. Stop immediately; no retry or backfill is permitted.
```

Under the admitted fail-closed contract, this nonzero exit is terminal. The attempt was not retried, continued, supplemented, replaced, backfilled, or restarted.

## Formal execution facts

- TEAM B handoff commit: `9779ef9412a3572f2a4a0f700e7bdaff57715cf8`
- independent admission/formal checkout commit: `3fbb14eba9ad009790f6f5b9ed1ac513096bdb77`
- formal root: `D:\tmp\lo-runtime-acceptance-attempt-4`
- formal invocation count: `1`
- retries: `0`
- failed command index: `13`
- failed command: `runtime-install`
- command started: `2026-08-12T03:39:35.9292745Z`
- command timeout: `600` seconds (not reached)
- child exit code: `1`
- formal completion marker: absent
- automatic formal evidence inventory: absent
- residual formal processes after termination: `0`

The formal command resolved `pnpm` to `D:\Applications\Scoop\apps\nvm\current\nodejs\nodejs\pnpm.cmd`. Its fixed `.cmd` branch passed `cmd.exe /d /s /c` a command string with an extra outer quoting layer. `cmd.exe` received a leading doubled quote and rejected the command before pnpm started. This is a normative command-package Windows CLI-launch contract failure, not a dependency-install result and not a network timeout.

Because the command was intentionally launched once as a detached monitored process to survive transport disconnects, its disposed OS process exit code was not retained by the launcher. This does not weaken the terminal evidence: command 13 persisted child exit code `1` in the formal exception path, the formal stderr records the unhandled exception, the process is no longer running, and the required completion marker is absent.

## Gates completed before failure

The single invocation completed and persisted evidence for:

1. fresh Runtime clone, fixed detached checkout, HEAD/ref checks, and remediation ancestry;
2. fresh PDFHow clone, fixed detached checkout, and HEAD/ref checks;
3. native/WASM workflow preflight confirming run `31211473147` remains latest;
4. Release `367637128` identity and fresh download of all five fixed assets;
5. archive central-directory/extraction path safety and exact eight-runtime-file inventory;
6. fixed native/wrapper provenance, ABI `lok-convert-document-v1`, schema 1, `main-script` pthread mode, `externalWorker: null`, absence of `soffice.worker.js`, and `releaseQualified: false`.

These preliminary passes do not override the terminal failure or qualify the candidate.

## Required gates not run

Execution stopped immediately. None of the following were run or backfilled:

- Runtime wrapper/package build;
- Runtime release-workflow guards and verifier/stage CLI contracts;
- downloaded-byte Node positive, negative, reuse, recovery, ABI, and cleanup gates;
- PDFHow dependency install and Playwright Chromium installation;
- the complete retry-free PDFHow Chromium candidate gate;
- any of the five fresh-browser cold-start samples;
- the formal final Build WASM and Release/asset immutability gates;
- the formal `evidence-sha256.json` inventory and `ATTEMPT-4-COMMAND-COMPLETED.json` marker.

Consequently, Attempt 4 has no complete runtime acceptance evidence and cannot qualify the frozen candidate.

## Host/tool record

- OS: `Microsoft Windows 10.0.22621`, `X64`
- PowerShell: `7.6.4`
- Node: `v24.16.0`
- Git: `2.53.0.windows.1`
- GitHub CLI: `2.83.2`
- Playwright: not reached; no formal-version observation
- Chromium: not reached; no browser was installed or launched by the formal invocation
- retry environment: `ACCEPTANCE_RETRY_POLICY=disabled`, `npm_config_fetch_retries=0`

## Evidence and disposition

Raw formal evidence remains under `D:\tmp\lo-runtime-acceptance-attempt-4\evidence`. Its 43 generated files, sizes, and SHA-256 values are recorded in `acceptance-attempt-4-evidence.json`, together with the external single-launch record and redirected formal stderr/stdout hashes. The entire formal root must remain unchanged.

A separate read-only post-failure disposition check at `2026-08-12T03:45:03.2529173Z` confirmed that Release `367637128` remains draft and unpublished, all five asset identities are unchanged, and Build WASM run `31211473147` remains latest. That check preserves the required disposition but is not used to backfill the formal final gates.

Release `367637128` must remain draft, `releaseQualified` must remain `false`, and the assets must remain immutable. Attempt 4 may not be rerun or continued. Any later acceptance execution requires TEAM B remediation, a new handoff, a fresh root, explicit independent admission, and a new attempt number.

## Independent signature

I independently sign **FAIL** for Acceptance Attempt 4. I did not participate in TEAM B's implementation, timeout remediation, command-package preparation, or handoff conclusion, and I have not converted the command-package failure into a pass through retry or supplementary evidence.

Signed: **OpenAI Codex AI 编程代理（当前验收会话实例）**
Role: independent acceptance owner
Decision: **FAIL**
