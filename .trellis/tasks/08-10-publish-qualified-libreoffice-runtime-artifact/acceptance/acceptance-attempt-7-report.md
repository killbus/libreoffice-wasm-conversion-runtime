# Acceptance Attempt 7 independent closure report

## Decision

**FAIL — CLOSED PERMANENTLY**

Signed by the independent acceptance owner at `2026-08-13T03:56:27.082Z`.

## Terminal formal result

- Formal invocation count: `1`
- Formal retry count: `0`
- Supervisor start: `2026-08-13T03:36:01.1194931Z`
- Supervisor completion: `2026-08-13T03:39:02.6100988Z`
- Formal process exit code: `1`
- Failed command: `11 — verify-pdfhow-remote-refs`
- Fixed command timeout: `60 seconds`
- Timeout reached: `true`
- Commands completed before failure: `10`
- Total expected commands: `33`
- Chromium/browser tests started: `false`
- Cold starts run: `0`
- Runner completion marker: absent
- Runner automatic evidence inventory: absent

The admitted command `git ls-remote origin refs/heads/main` in the pinned PDFHow checkout produced no stdout or stderr and did not complete within 60 seconds. The fail-closed runner killed that command and stopped immediately. This is a retry-free network-command timeout; it is not evidence that PDFHow `origin/main` differed from the pinned commit, and it is not evidence about the frozen runtime candidate's browser conversion behavior.

## Evidence boundary

Commands 1–10 completed sequentially. Command 11 timed out. No command-12 record exists, so the preflight Build WASM check and every later download, extraction, candidate-preparation, runtime, Chromium, conversion, cold-start, and final invariance gate were not run.

The formal evidence directory contains 34 files totaling 22834 bytes. The invocation-control directory contains 4 files totaling 1467 bytes. Their SHA-256 inventories, together with the one-shot lock, process record, supervisor logs, and wrapper hash, are persisted in `acceptance-attempt-7-evidence.json`.

The one-shot supervisor completion marker records exit code `1`. The runner-level `ATTEMPT-7-COMMAND-COMPLETED.json` and `evidence-sha256.json` are absent because the admitted sequence stopped at command 11. No post-failure manual activity was detected before this signature. From this closure onward, the formal root and invocation-control records must remain unchanged.

All pre-admission audits and targeted diagnostics remain classified as **not acceptance evidence** and cannot backfill any missing formal gate.

## Independent disposition check

A read-only check at `2026-08-13T03:51:37.3887528Z` confirmed:

- Release `367637128` remains draft and unpublished at the fixed tag and target.
- The exact five asset IDs, names, sizes, update timestamps, and SHA-256 digests remain unchanged.
- Build WASM run `31211473147` remains the latest run, completed successfully at native commit `71d33678ed74872ebbb1bc37f5778143f8f5e401`.
- Runtime `main` remains `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`.
- PDFHow `main` remains `b41fde5db9829ede7e6e217de6ac12c2b475b7fc`.

These read-only checks preserve disposition only. They do not supplement or backfill the formal command-11 timeout or any unrun gate.

## Binding closure

Attempt 7 may not be retried, rerun, continued, replaced, supplemented, or backfilled. `D:\tmp\lo-runtime-acceptance-attempt-7` is historical failed evidence and must remain unchanged from this closure onward. Any further formal execution requires a new attempt number, a fresh absent root, a committed and pushed handoff, explicit independent admission, and one retry-free invocation.
