# Acceptance Attempt 6 independent closure report

## Decision

**FAIL — CLOSED PERMANENTLY**

Signed by the independent acceptance owner at `2026-08-13T02:34:09.855Z`.

## Terminal formal result

- Formal invocation count: `1`
- Formal retry count: `0`
- Failed command: `22 — pdfhow-full-retry-free-chromium-candidate-gate`
- Child exit code: `1`
- Timeout: `false`
- Browser tests started: `false`
- Cold starts run: `0`
- Completion marker: absent
- Automatic evidence inventory: absent

The pinned PDFHow Vite server failed before Chromium startup because `OFFICE_RUNTIME_ROOT` pointed at the verified Release extraction, which did not contain `LOCAL-CANDIDATE-METADATA.json`. The fixed PDFHow checkout requires its official `scripts/prepare-libreoffice-runtime-candidate.mjs` helper to materialize a local-candidate workspace containing `LOCAL-CANDIDATE-METADATA.json`, `SHA256SUMS`, and `package.json`.

This is a command-package/PDFHow preparation integration defect. It is not evidence that the frozen runtime candidate passed or failed browser conversion behavior, because the browser gate never started.

## Evidence boundary

The formal evidence directory contains 73 files totaling 91558 bytes. Their forensic SHA-256 inventory is persisted in `acceptance-attempt-6-evidence.json`. Commands 1–21 completed; command 22 failed at web-server startup. Commands 23–29 and final evidence generation were not run.

After the terminal failure, a manual diagnostic rerun added `libreoffice-wasm-conversion-runtime-dev/LOCAL-CANDIDATE-METADATA.json` at approximately `2026-08-12T10:38:49Z`, after the command-22 failure at approximately `2026-08-12T10:25:11Z`. The formal root is therefore contaminated after failure. No post-failure file, rerun, or result is admissible, and none is used to backfill a missing gate.

## Independent disposition check

A read-only check on August 13, 2026 confirmed:

- Release `367637128` remains draft and unpublished.
- The fixed tag, target, five asset IDs, names, sizes, and SHA-256 digests remain unchanged.
- Build WASM run `31211473147` remains the latest run, successful, at native commit `71d33678ed74872ebbb1bc37f5778143f8f5e401`.
- PDFHow `main` remains at `b41fde5db9829ede7e6e217de6ac12c2b475b7fc`.

These read-only checks preserve disposition only. They do not backfill the missing formal final gates.

## Binding closure

Attempt 6 may not be retried, continued, reused, repaired in place, supplemented, or backfilled. `D:\tmp\lo-runtime-acceptance-attempt-6` is historical failed/contaminated evidence and must remain unchanged from this closure onward. Any further formal execution requires a new attempt number, a fresh absent root, a committed and pushed handoff, explicit independent admission, and one retry-free invocation.
