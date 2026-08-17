# Acceptance Attempt 8 protocol-refactor handoff

- Date: 2026-08-17
- Owner: TEAM B
- Scope: protocol and automation review only
- Acceptance state: **NOT ADMITTED**
- Eligible: `false`
- Started: `false`
- Formal invocation count: `0`
- Decision: `null`
- Preparation executed: `false`
- Evidence classification: **not acceptance evidence**

## Submission boundary

This handoff does **not** prepare or start Acceptance Attempt 8. It submits a replacement acceptance protocol for independent audit. No Attempt 8 Release download, repository clone, dependency install, Chromium install, candidate workspace preparation, candidate behavior gate, cold-start sample, final invariance gate, or post-formal disposition audit was run while producing this handoff.

The default roots remain absent:

- `D:\tmp\lo-runtime-acceptance-attempt-8-preparation`
- `D:\tmp\lo-runtime-acceptance-attempt-8-formal`
- `D:\tmp\lo-runtime-acceptance-attempt-8-invocation`

No `acceptance-attempt-8-admission.*` record exists. Attempt 8 therefore remains **NOT ADMITTED**, and the formal invocation count remains `0`.

## Refactored phase contract

### 1. Retryable preparation — not acceptance evidence

`attempt-8-prepare.ps1` owns every operation that can depend on a remote service, dependency registry, browser distribution, or mutable workspace:

- Runtime/PDFHow clone, checkout, fetch-equivalent remote verification, and `ls-remote`;
- GitHub workflow queries;
- Release query and fresh asset download;
- archive verification and extraction;
- PDFHow preparation-helper contract test;
- `prepare-libreoffice-runtime-candidate.mjs` candidate workspace preparation;
- Runtime/PDFHow dependency installation;
- Runtime build and static contract gates;
- Chromium installation;
- preparation manifest generation and sealed-input inventory creation.

These operations may retry. Every command record carries:

```text
classification: preparation
evidenceStatus: not acceptance evidence
retryPermitted: true
```

A successful preparation creates `attempt-8-preparation-manifest.json` and `attempt-8-sealed-inputs.json` under the preparation root. The sealing contract binds the fixed identities, pinned DOCX, fresh Release archive, extracted archive, prepared Runtime/PDFHow workspaces, Chromium installation, candidate metadata, and exact inventories. Preparation success does not admit or start Attempt 8 and does not increment the formal invocation count.

### 2. One-shot pre-invocation control — not acceptance evidence

`attempt-8-invoke-formal.ps1` refuses to proceed unless all of the following pass:

1. an independent machine-readable admission record says Attempt 8 is `ADMITTED`, eligible, unstarted, invocation count `0`, and decision `null`;
2. that record has schema version `1` and kind `acceptance-attempt-8-admission`;
3. `commandPackageManifestSha256` binds it to the exact SHA-256 of `attempt-8-command-package.json`;
4. `preparationManifestSha256` binds it to the exact verified preparation manifest;
5. `sealedInputsManifestSha256` binds it to the exact verified sealed-input manifest;
6. all three identity fields are canonical lowercase SHA-256 values;
7. the package verifier bootstrap hash matches the package manifest;
8. every command-package file matches its recorded SHA-256;
9. the preparation manifest schema, boundary, status, fixed inputs, and formal-count-zero claims pass;
10. every sealed local input exact inventory and hash remains unchanged;
11. neither manifest changes while verification runs;
12. the formal root and invocation-control root remain fresh and absent.

Only after those checks and the persisted `pre-invocation-verification.json` record does the supervisor atomically create `formal-invocation-start.json` with `FileMode.CreateNew`. A failure before marker creation leaves the formal invocation count at `0` and creates no acceptance decision.

The marker is created before any candidate behavior gate. After marker creation the one-shot supervisor immediately launches the formal runner; it does not perform network, preparation, identity, schema, or admission work after the marker.

### 3. Formal acceptance — offline and retry-free

`attempt-8-formal.ps1` contains only the eight admitted local candidate behavior gates:

1. Node candidate positive/negative/reuse/recovery/ABI/cleanup gate;
2. full retry-free Chromium local-candidate gate;
3–7. five independent cold-start Chromium processes;
8. final prepared-candidate invariance gate.

Formal execution consumes sealed local inputs and sets package-manager offline mode, disables Playwright browser download, disables package-manager retries, points external proxy variables and npm registry fallback to a closed local port, and permits only localhost access needed by Playwright. Static tests reject network/preparation command surfaces in the formal runner.

Formal policy is:

- external network: forbidden;
- retry: forbidden;
- continuation after failure: forbidden;
- failed-root repair or reuse: forbidden;
- replacement, supplementation, and backfill: forbidden;
- any nonzero exit, timeout, crash, missing completion contract, or wrong gate count: fail closed.

### 4. Automatic closure

The supervisor always invokes `attempt-8-close.mjs` after a marker-bearing formal process terminates. The closer creates or byte-verifies:

- `acceptance-attempt-8-evidence.json`;
- the matching accepted/rejected receipt;
- `acceptance-attempt-8-report.md`.

Closure is idempotent for byte-identical artifacts so a transport interruption during report writing can be safely resumed. Any existing artifact with different content fails closed. Preparation and disposition records are excluded from formal evidence.

### 5. Independent post-formal disposition audit

`attempt-8-disposition-audit.mjs` is separate from formal execution and writes outside the formal root. It performs only read-only Release/workflow/ref queries, permits retries, and records:

```text
evidenceStatus: not acceptance evidence
readOnly: true
formalEvidenceBackfilled: false
formalDecisionChanged: false
```

It cannot alter the formal PASS/FAIL decision or backfill formal evidence.

## Command package identity

Command package manifest:

```text
acceptance/attempt-8-command-package.json
SHA-256 f22d5a45000695a0636a983f424f2f2f2315dcd24e42ab52cfef0c7555a6480c
```

The manifest binds 17 protocol and automation files, including the handoff-consistency auditor. The independent admission record must repeat this exact manifest SHA-256. Any change requires regeneration, a new protocol audit, and a new handoff identity; it is not eligible for in-place supplementation after admission.

## TEAM B pre-admission verification

TEAM B ran only local protocol tests and static checks:

- PowerShell parser: five Attempt 8 `.ps1` files passed;
- production-same Windows launcher test: passed on PowerShell `7.6.4`, including `.cmd`/`.bat` argument preservation, child exit propagation, fail-closed unsupported tokens, native executables, and `pnpm.cmd`;
- Node `--check`: all Attempt 8 `.mjs` files passed;
- protocol tests: `16` passed, `0` failed;
- command package generate/verify: passed with 17 files;
- pre-admission audit: passed and explicitly classified `not acceptance evidence`;
- handoff/schema/state consistency audit: passed and explicitly classified `not acceptance evidence`.

Pre-admission audit:

```text
acceptance/acceptance-attempt-8-pre-admission-audit.json
SHA-256 67a727d6092dc5e8ae37c20777a3ad4768eef5867044e7862e80b2315db038c5
```

This audit confirms only protocol readiness and current state. It is not Acceptance Attempt 8 evidence.

Handoff consistency audit:

```text
acceptance/acceptance-attempt-8-handoff-audit.json
```

The handoff audit checks the current command-package identity, pre-admission audit identity, protocol schema/state, Trellis task state, and this handoff's required state/binding declarations. It is also not Acceptance Attempt 8 evidence.

## Required independent next action

The independent acceptance owner should audit this protocol, scripts, package identity, schema, state, and handoff consistency. Until that audit passes and a separate admission record is persisted:

- Attempt 8 remains **NOT ADMITTED**;
- eligible remains `false`;
- started remains `false`;
- formal invocation count remains `0`;
- decision remains `null`;
- neither preparation nor formal may be invoked as Attempt 8 acceptance.

After protocol audit approval, preparation may be run separately and retried as needed, but remains **not acceptance evidence**. A later independent admission must bind both the immutable command-package manifest and the verified sealed local inputs. Only then may the one-shot supervisor create the marker and execute the complete formal command once.
