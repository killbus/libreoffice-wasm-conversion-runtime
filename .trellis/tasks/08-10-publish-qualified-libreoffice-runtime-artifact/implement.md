# Implementation plan: publish qualified LibreOffice runtime artifact

## Ownership convention

- **`[TEAM B]`** items are implemented and evidenced by TEAM B.
- **`[ACCEPTANCE]`** items are executed and signed by `killbus`; TEAM B must not
  check them on the acceptance owner's behalf.
- **`[HANDOFF]`** is a mandatory stop point. A draft must not be published while
  waiting for acceptance.

## Preconditions

- [ ] **[TEAM B]** Read `prd.md`, `design.md`, and all files under `research/`.
- [ ] **[TEAM B]** Run `task.py start` only after accepting the handoff and
      confirming branch ownership; this planning session intentionally does not
      start the task.
- [ ] **[TEAM B]** Work from `main` at or after
      `df3f73c789e6d2abf71cbcd75186118d2bbc795a` on
      `feat/publish-qualified-libreoffice-runtime-artifact` (or record an
      explicitly reviewed replacement branch).
- [ ] **[TEAM B]** Confirm the repository/worktree status and preserve unrelated
      work. Do not reset or absorb another worktree's WIP.
- [ ] **[TEAM B]** Record the frozen candidate ID, native/wrapper commits, run ID,
      exact eight-file table, and original native archive hash before editing.
- [ ] **[TEAM B]** Confirm in writing that no native/WASM build command or
      workflow will be invoked by this task.

## 1. Guard existing release-event workflows

- [ ] **[TEAM B]** Map every workflow triggered by `release.published`, including
      permissions, default-branch behavior, and asset mutation/deployment.
- [ ] **[TEAM B]** Add an explicit semantic-package tag/manual-dispatch decision
      gate to `.github/workflows/pages.yml`.
- [ ] **[TEAM B]** Add the equivalent gate to
      `.github/workflows/font-bundles.yml` so runtime tags cannot reach its
      `--clobber` upload loop.
- [ ] **[TEAM B]** Preserve valid `v<semver>` release behavior and intentional
      `workflow_dispatch` behavior.
- [ ] **[TEAM B]** Add an executable test/check for allowed `v<semver>`, denied
      `runtime-artifact-*`, denied malformed/empty release tags, and allowed
      explicit manual dispatch.
- [ ] **[TEAM B]** Document that these guards must be merged to the default branch
      before final runtime release publication.

## 2. Define the frozen candidate and schemas

- [ ] **[TEAM B]** Add one machine-readable frozen candidate specification for
      `21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b`.
- [ ] **[TEAM B]** Include native/wrapper provenance, ABI/schema, pthread mode,
      external worker `null`, and the exact sorted asset table.
- [ ] **[TEAM B]** Model source provenance by asset so `loader.cjs` is not
      misrepresented as a GHA native output.
- [ ] **[TEAM B]** Define and validate separate schemas/kinds for candidate
      manifest, staging report, acceptance receipt, and qualified release
      manifest.
- [ ] **[TEAM B]** Make `releaseQualified: true` invalid in candidate/local
      metadata and valid only in a release manifest bound to a passing receipt.
- [ ] **[TEAM B]** Add canonical JSON serialization and candidate-ID derivation
      tests that reproduce the existing candidate ID exactly.

## 3. Implement deterministic assembly and verification

Suggested ownership is a small release module plus CLI scripts and focused
Vitest tests; TEAM B may choose names that fit existing repository conventions.

- [ ] **[TEAM B]** Implement assembly from explicit native/wrapper roots or
      immutable downloaded roots; no developer path may be hard-coded.
- [ ] **[TEAM B]** Resolve staging/destination boundaries before replacing any
      directory and limit cleanup to the declared fresh staging root.
- [ ] **[TEAM B]** Verify expected file type, byte length, and full SHA-256 before
      every file enters staging.
- [ ] **[TEAM B]** Reject undeclared files and any `soffice.worker.js`; never copy
      an older worker as a compatibility shim.
- [ ] **[TEAM B]** Emit the canonical candidate manifest,
      `ASSET-SHA256SUMS`, deterministic payload archive, external
      `SHA256SUMS`, and a machine-readable assembly report.
- [ ] **[TEAM B]** Normalize archive paths, order, timestamps, permissions,
      ownership metadata, compression settings, line endings, and JSON bytes.
- [ ] **[TEAM B]** Implement inspect/verify/extract mode that checks the complete
      archive before extraction and extracts only into a fresh safe root.
- [ ] **[TEAM B]** Verify candidate ID from immutable provenance plus the
      canonical asset table rather than trusting a supplied ID string.
- [ ] **[TEAM B]** Run assembly twice from separate roots and assert identical
      archive bytes, hashes, manifests, and sums.

### Negative tests

- [ ] **[TEAM B]** Missing expected asset.
- [ ] **[TEAM B]** Extra/renamed asset or forbidden standalone worker.
- [ ] **[TEAM B]** One-byte content change, size drift, or wrong expected hash.
- [ ] **[TEAM B]** Wrong native/wrapper commit, run ID, ABI/schema, or pthread
      mode.
- [ ] **[TEAM B]** Malformed/unknown manifest schema or invalid qualification
      state.
- [ ] **[TEAM B]** Absolute/drive-qualified path, `..` traversal, separator
      confusion, duplicate normalized entry, and case-fold collision.
- [ ] **[TEAM B]** Symlink, hardlink, directory/device entry, or extraction target
      escaping the fresh root.
- [ ] **[TEAM B]** Non-deterministic timestamp/order/metadata regression.
- [ ] **[TEAM B]** Attempt to reuse the same candidate ID with changed bytes.

## 4. Add controlled draft-release automation

- [ ] **[TEAM B]** Add a manual, fail-closed draft staging command/workflow. It
      must not be coupled to semantic-release or a push to `main`.
- [ ] **[TEAM B]** Pin/record all third-party Actions used and grant only required
      permissions (`contents: write` only where release creation needs it).
- [ ] **[TEAM B]** Acquire the exact native run artifact and wrapper inputs, or
      accept explicitly supplied roots, then verify the frozen hashes before
      packaging.
- [ ] **[TEAM B]** If wrapper JS is rebuilt as a check, compare it to all three
      frozen `dist/*` hashes and fail on any difference. Never publish newly
      differing wrapper output as this candidate.
- [ ] **[TEAM B]** Use tag namespace
      `runtime-artifact-<full-candidate-id>` and create a **draft** release.
- [ ] **[TEAM B]** Upload each unqualified payload/control asset exactly once.
      Do not use `--clobber`, deletion/re-upload, or a mutable `latest` name.
- [ ] **[TEAM B]** Record release database ID, draft URL, tag, target commit,
      asset IDs/names/lengths/hashes, workflow run ID, and uploader commit in the
      staging report.
- [ ] **[TEAM B]** Download the draft into a fresh CI/local path and run the
      verifier as TEAM B preflight without claiming independent acceptance.
- [ ] **[TEAM B]** Prove no `build-wasm`/native build workflow was dispatched and
      no npm/Pages/font publication occurred during draft staging.

## 5. Run inexpensive implementation gates

Finalize exact commands from repository scripts, but the expected minimum is:

```powershell
npm ci
npm run typecheck
npm run lint
npm run build
npx vitest run --exclude 'tests/*converter*.test.ts'
git diff --check
python ./.trellis/scripts/task.py validate .trellis/tasks/08-10-publish-qualified-libreoffice-runtime-artifact
```

- [ ] **[TEAM B]** Run focused manifest/archive/workflow tests, including every
      negative case above.
- [ ] **[TEAM B]** Run repository type-check, lint, JS/TS build, and appropriate
      non-native tests.
- [ ] **[TEAM B]** Review the final diff for accidental build, LFS, generated
      binary, package-version, and post-baseline trimming changes.
- [ ] **[TEAM B]** Record command versions and results. Existing warnings must be
      distinguished from new failures.
- [ ] **[TEAM B]** Confirm no command equivalent to `npm run build:wasm` ran.

## 6. Mandatory acceptance handoff

- [ ] **[TEAM B]** Prepare one handoff record containing:
  - draft release ID and URL;
  - expected tag and target commit;
  - candidate ID and all provenance fields;
  - release asset names, GitHub asset IDs, byte lengths, and SHA-256 values;
  - verifier command/version;
  - workflow-guard commit and event/tag test result;
  - deterministic assembly comparison result;
  - explicit no-native-build evidence;
  - known prior cold-start timeout disclosure.
- [ ] **[TEAM B]** Confirm the release is still draft and no
      `RELEASE-MANIFEST.json` claims qualification.
- [ ] **[HANDOFF]** Stop. Notify `killbus`. Do not publish or self-author a
      passing acceptance receipt.

## 7. Independent acceptance

These boxes belong to `killbus`, not TEAM B.

- [ ] **[ACCEPTANCE]** Check the draft release identity and asset inventory
      through GitHub API/CLI.
- [ ] **[ACCEPTANCE]** Download all draft assets through GitHub into a new
      acceptance directory, not TEAM B's staging path.
- [ ] **[ACCEPTANCE]** Run archive preflight and safe extraction; independently
      recompute archive/control/runtime hashes and sizes.
- [ ] **[ACCEPTANCE]** Verify the exact eight runtime paths, provenance,
      candidate ID, ABI/schema, `main-script`/`null` worker state, and absence of
      `soffice.worker.js`.
- [ ] **[ACCEPTANCE]** Run a fresh downloaded-byte Node DOCX-to-PDF smoke and
      assert `%PDF-`, hidden path, no visible frame, and clean cleanup.
- [ ] **[ACCEPTANCE]** Run or bind exact-byte equivalence to the existing
      negative/reuse/recovery gates; verify no unsafe-runtime reuse.
- [ ] **[ACCEPTANCE]** Materialize a fresh PDFHow candidate test root using only
      downloaded runtime bytes and generated non-runtime control metadata.
- [ ] **[ACCEPTANCE]** Run PDFHow's full retry-free Chromium candidate gate and
      verify conversion, network/MIME, COOP/COEP, SAB, reuse, recovery,
      cancellation/restart/disposal, and Worker termination evidence.
- [ ] **[ACCEPTANCE]** Run at least five consecutive fresh browser/profile
      cold-start conversions with retries disabled; record each duration and
      result separately.
- [ ] **[ACCEPTANCE]** Reject on any failure or timeout; do not rerun until green
      and hide the failed sample.
- [ ] **[ACCEPTANCE]** Verify release-trigger guards are on default branch and
      verify no new native build run exists.
- [ ] **[ACCEPTANCE]** Produce a schema-valid accepted or rejected receipt bound
      to the exact draft, target commit, candidate, and archive hash.

## 8. Finalize only after acceptance

- [ ] **[TEAM B]** Validate that the receipt is from the declared acceptance
      owner, says accepted, and exactly matches the current draft release ID,
      target, candidate ID, and payload hash.
- [ ] **[TEAM B]** On rejection or mismatch, leave the release draft/unqualified
      and return to analysis; do not mutate the payload or trigger a build.
- [ ] **[TEAM B]** Generate `RELEASE-MANIFEST.json` with
      `releaseQualified: true`, binding all payload/control/receipt hashes and
      the final release identity.
- [ ] **[TEAM B]** Anchor the final manifest/digest through the evidenced
      immutable-release or protected tag/commit policy.
- [ ] **[TEAM B]** Add the receipt/final manifest once without replacing any
      accepted asset and regenerate only non-circular final inventory evidence.
- [ ] **[ACCEPTANCE]** Perform the final pre-publication inventory/hash review.
- [ ] **[TEAM B]** Publish the draft through the explicit finalize action.

## 9. Post-publication verification

- [ ] **[TEAM B]** Record the published release ID/URL/tag/target and all public
      asset IDs.
- [ ] **[ACCEPTANCE]** Download public assets into another fresh directory and
      verify they are byte-identical to the accepted draft.
- [ ] **[TEAM B]** Verify Pages and font-bundle jobs were skipped/absent for the
      runtime tag and no tracked-LFS deployment occurred.
- [ ] **[TEAM B]** Exercise the immutable/fail-closed policy: a changed byte or
      manifest must be rejected under the same candidate/tag.
- [ ] **[TEAM B]** Record any release-triggered runs and their final conclusions.
- [ ] **[TEAM B]** Update task evidence and request final acceptance-owner review.

## 10. Completion gate

The task is complete only when:

- [ ] all TEAM B implementation and finalization boxes are evidenced;
- [ ] all independent acceptance boxes are checked by `killbus`;
- [ ] the public re-download matches the accepted draft;
- [ ] no native build, npm cutover, PDFHow production change, Pages deployment,
      or font upload occurred as a side effect;
- [ ] the runtime artifact has a content-addressed, fail-closed public identity;
- [ ] task validation and final diff/repository checks pass.

## Risk and rollback points

- **Hash drift:** stop and create a separately validated candidate; never reuse
  this ID.
- **Archive ambiguity:** reject before extraction/upload.
- **Cold-start timeout:** reject qualification and preserve diagnostics; no
  automatic retry or native build.
- **Workflow guard not merged:** final publication is blocked.
- **Receipt mismatch:** final publication is blocked.
- **Draft error:** remove the draft only after explicit review; recreate rather
  than clobbering assets.
- **Published error:** preserve the original release evidence and issue an
  explicit revocation/new release; never replace assets in place.

## Acceptance attempt 1 — rejected (2026-08-10)

Independent acceptance owner `killbus` rejects qualification of draft release
`367637128`. The decision is bound to candidate
`21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b`,
target `df3f73c789e6d2abf71cbcd75186118d2bbc795a`, and payload archive
SHA-256 `e9aac8dde2fb627251155fc97651c2bd35bec63b01e39f882d342c024a87de9a`.

The independent download, safe extraction, archive/runtime identity checks,
ABI and pthread-mode checks passed. The downloaded-byte Node functional gate
passed conversion, reuse, negative, recovery, and ABI checks, but did not
explicitly record converter cleanup and is therefore partial.

Qualification is blocked by all of the following:

- the retry-free Chromium candidate gate failed at
  `tests/office-conversion/office-browser.playwright.ts:501:58`, receiving
  cancellation progress phase `finalizing` instead of `converting`, and its
  command boundary later timed out with exit code `124`;
- cold-start sample 1 failed, so samples 2–5 were intentionally not run and no
  retry was performed;
- the required release-event guards are absent from default branch `main`, and
  the feature-branch guard incorrectly allows malformed tags including
  `vfoo.bar`, `v1.x`, `v1..2`, and `v1.2`;
- the verifier help and parser disagree about `--spec`,
  `--expected-candidate-id`, and the undocumented required `--report-out`.

The rejected receipt and supporting records are:

- `acceptance/acceptance-receipt.rejected.json`;
- `acceptance/acceptance-evidence.json`;
- `acceptance/acceptance-report.md`.

The failed Chromium diagnostics remain preserved under
`D:\tmp\lo-runtime-acceptance-367637128-20260810-1251\browser-gate-failure`.
TEAM B retains implementation ownership and must remediate the blockers before
a distinct acceptance attempt. Release `367637128` must remain draft and
unqualified; do not publish it, replace its payload, trigger a native build, or
represent a later run as erasing this failed sample. No completion checkbox is
advanced by this rejected attempt.

### Post-rejection readiness check 1 — Attempt 2 not admitted

At `2026-08-10T08:04:49Z`, the acceptance owner performed a read-only
readiness refresh without rerunning any browser or cold-start gate:

- local branch `feat/publish-qualified-libreoffice-runtime-artifact` remains at
  rejected-attempt HEAD `0b2bf1654994db0dd524ce8f6ca32ab5dce7c348` with no
  tracked implementation delta;
- GitHub `main` remains at the pre-guard commit
  `df3f73c789e6d2abf71cbcd75186118d2bbc795a`;
- GitHub has no branch named
  `feat/publish-qualified-libreoffice-runtime-artifact` and no PR for that
  head;
- release `367637128` remains an unpublished draft with the same five asset
  IDs, sizes, and SHA-256 digests recorded by Attempt 1;
- Build WASM run `31211473147` remains the newest native-build run.

There is therefore no distinct TEAM B remediation commit or handoff to admit
into Acceptance Attempt 2. The strict-semver guards and verifier CLI defects
remain unchanged, while no remediation evidence exists for the Chromium
cancellation/command-hang failure or the Node cleanup coverage gap. Attempt 2
was not started, and the no-retry record for Attempt 1 remains intact.

Machine-readable readiness evidence:

- `acceptance/readiness-check-1.json`;
- SHA-256
  `3d4a73847b1186f9b5b8db4353f65f5f893b63fd01995c0bfa9db4e8844957ed`.

### Post-rejection readiness check 2 — acceptance waiting blocked

At `2026-08-10T08:12:15Z`, a second post-rejection read-only refresh again
found exactly the state captured by readiness check 1:

- local implementation HEAD remains
  `0b2bf1654994db0dd524ce8f6ca32ab5dce7c348`;
- GitHub `main` remains
  `df3f73c789e6d2abf71cbcd75186118d2bbc795a`;
- the TEAM B feature branch and every PR for that head remain absent;
- release `367637128` remains the same unpublished five-asset draft;
- Build WASM run `31211473147` remains newest.

This is the third consecutive observation of the same external blocking
condition: Attempt 1 required remediation, readiness check 1 found no delta,
and readiness check 2 again found no delta. The acceptance workflow is now
blocked waiting for a distinct TEAM B remediation commit and handoff. Attempt 2
remains ineligible and unstarted; no Chromium, cold-start, native-build,
publication, or asset-mutation action was performed.

Machine-readable blocked-state evidence:

- `acceptance/readiness-check-2.json`;
- SHA-256
  `ed9171ccf32b7a0bba30466b3ba1beba529fd03b400cb43aa18786ea0bae8c95`.

### Post-rejection remediation evidence (TEAM B, in progress)

The working tree on
`feat/publish-qualified-libreoffice-runtime-artifact` now carries the code
remediation for the guard and verifier CLI contract blockers and, separately,
explicit Node converter cleanup evidence:

- Strict semantic-version release gating:
  - `scripts/release-runtime/lib/workflow-decision.mjs` uses a strict
    `v<major>.<minor>.<patch>` (optionally `-pre`/`+build`) pattern; the
    malformed probe tags `vfoo.bar`, `v1.x`, `v1..2`, `v1.2` are now denied.
  - `scripts/release-runtime/guard-release-tag.mjs` provides the fail-closed
    first job step; `pages.yml` and `font-bundles.yml` invoke it for
    `release` events before any build/deploy/`--clobber` upload.
  - Covered by `tests/release-runtime/workflow-guard.test.ts` and
    `tests/release-runtime/cli-contract.test.ts` (guard CLI matrix).
- Verifier CLI contract:
  - `parseOptions` now supports `optional` and `bool` option sets;
    `verify.mjs`/`pack.mjs`/`stage-draft.mjs` declare `--spec` and
    `--expected-candidate-id` optional, and `verify.mjs` documents the required
    `--report-out` and writes the report file.
  - Covered by `tests/release-runtime/cli-contract.test.ts`.
- Node converter cleanup evidence (acceptance remediation item 4):
  - `scripts/release-runtime/node-smoke-gate.cjs` extends the rejected attempt's
    gate with an explicit `converter.destroy()` and records disposal state.
  - Executed against the downloaded-byte extraction at
    `temp/2026-08-10-runtime-artifact-acceptance/extract/wasm` with fixture
    `tests/sample_large.docx`. Result PASSED; evidence
    `temp/2026-08-10-runtime-artifact-acceptance/cleanup-gate-work/node-smoke-result.json`,
    SHA-256 `1da71d14c9c548831d72fc574b73456ff1a553f5a6e2e5d430fd101ffb39bb97`,
    records `phase: cleanup` with `destroyed: true`, `moduleReleased: true`,
    `initializedFalse: true`.

Implementation gates re-run after these changes: `tsc --noEmit` clean;
`vitest run` 215 passed / 1 skipped (converter tests excluded per plan);
`npm run lint` 0 errors; `npm run build` success; `git diff --check` clean.

Still open outside this repo/tree: the retained PDFHow Chromium cancellation
progress-state mismatch and the cold-start sample 1 failure (diagnosis only —
the cancellation assertion lives in PDFHow's `office-browser.playwright.ts`,
not in this repository), and merging the two guard workflows to default branch
`main` via a distinct remediation commit before any acceptance attempt 2.

### Independent remediation review 1 — Attempt 2 still ineligible

At `2026-08-10T13:03:05.602Z`, `killbus` independently reviewed TEAM B's
uncommitted post-rejection remediation. This review did not start Acceptance
Attempt 2 and did not rerun the retained Chromium failure or cold-start samples.

Confirmed remediation:

- the strict-semver executable oracle itself allows valid `v<semver>` tags and
  denies `vfoo.bar`, `v1.x`, `v1..2`, and `v1.2`;
- the verifier now documents required `--report-out`, keeps `--spec` and
  `--expected-candidate-id` optional, writes its report, and fails closed when
  the required output path is absent;
- the Node cleanup gap is closed for the reviewed successful execution. An
  independent rerun against the Attempt 1 downloaded-byte extraction passed
  positive, reuse, negative, recovery, ABI, and cleanup phases. Its result is
  `temp/2026-08-10-runtime-artifact-acceptance/acceptance-remediation-review/node-smoke-result.json`,
  SHA-256
  `9c70dcca89b0c95374afed2b9518cfd7c1860858066cc1c5e670761ce904d518`,
  with `destroyed`, `moduleReleased`, and `initializedFalse` all `true`;
- the archive and extracted runtime hashes were recomputed and match Attempt 1,
  binding that cleanup run to payload archive
  `e9aac8dde2fb627251155fc97651c2bd35bec63b01e39f882d342c024a87de9a`.

Independent validation passed: `npm run typecheck`; the planned
`vitest run --exclude "tests/*converter*.test.ts"` gate with 215 passed and 1
skipped; the two focused remediation files with 21 passed; `npm run lint` with
0 errors and 22 existing warnings; `npm run build`; and `git diff --check`.
An unfiltered Vitest invocation exceeded its 184-second command boundary, but
the task plan explicitly excludes `tests/*converter*.test.ts`; this timeout is
not treated as a remediation regression.

Two repository-local blockers remain:

1. In both `pages.yml` and `font-bundles.yml`, the first step executes
   `scripts/release-runtime/guard-release-tag.mjs` before `actions/checkout`.
   A clean-runner probe for valid tag `v2.7.3` therefore fails with
   `MODULE_NOT_FOUND`; the workflows do not preserve required semantic-package
   release behavior. Existing tests assert only that the guard text exists and
   do not assert checkout/guard execution order.
2. `stage-draft.mjs` documents `[--dry-run]` and declares it boolean, but omits
   it from `OPTIONAL_FLAGS`. Running the documented command without that flag
   fails with `Missing required option: --dry-run`. Existing parser tests do not
   cover an absent boolean option through this caller.

The external blockers are also unchanged: PDFHow still retains the
`converting` versus `finalizing` cancellation mismatch and failed cold-start
sample 1, while samples 2-5 remain intentionally unrun. GitHub `main` remains
at `df3f73c789e6d2abf71cbcd75186118d2bbc795a`; no remediation branch or PR
exists; release `367637128` remains the same unpublished five-asset draft.

Machine-readable review evidence:

- `acceptance/remediation-review-1.json`;
- SHA-256
  `991c5a869f92c36a674ec4c5d13a53dec06e75b23d1fda13dfbcc1a788872fc3`.

Decision: remediation is not ready. Attempt 2 remains `eligible: false` and
`started: false`. TEAM B retains implementation ownership; no release asset,
qualified manifest, native build, PDFHow file, or completion state was changed.

### Post-remediation readiness check 3 — announced handoff not received

At `2026-08-10T13:22:22.861Z`, acceptance intake resumed after a new TEAM B
report was announced. No report body, persisted handoff record, new task
evidence, distinct remediation commit, remote feature branch, or PR was present.
Local HEAD remained `0b2bf1654994db0dd524ce8f6ca32ab5dce7c348` with the
same uncommitted remediation reviewed previously.

The mandatory handoff described by PRD R5.1 and implementation section 6 is
therefore missing. Independent probes also reconfirmed both repository-local
failures:

- from a clean runner directory, valid semantic tag `v2.7.3` still fails with
  `MODULE_NOT_FOUND` because both workflows execute the repository-local guard
  before `actions/checkout`;
- the documented `stage-draft.mjs` invocation without `[--dry-run]` still fails
  with `Missing required option: --dry-run` because the boolean flag is not in
  `OPTIONAL_FLAGS`.

The focused workflow/CLI test files still report 21 passed tests. That green
result is insufficient for admission because both direct execution probes fail;
the tests do not cover workflow checkout order or the absent boolean through
the real `stage-draft.mjs` caller.

PDFHow remains at `a307a616b8f39a86c268b322bcd73bb93d229576`; the three
reviewed cancellation-path files are unchanged, including the `converting`
assertion and subsequent `finalizing` progress update. GitHub `main` remains at
`df3f73c789e6d2abf71cbcd75186118d2bbc795a`, the feature branch returns 404,
the PR query is empty, release `367637128` remains the unchanged unpublished
five-asset draft, and Build WASM run `31211473147` remains newest.

Machine-readable readiness evidence:

- `acceptance/readiness-check-3.json`;
- SHA-256
  `b2f65181e21a0285bf74f51f1053d90e0a6bfb2f0c2ed13fcce34b6ffbd85206`.

Decision: the handoff is incomplete and Acceptance Attempt 2 was not admitted.
No Chromium/cold-start retry, native build, release mutation, qualified
manifest, PDFHow edit, implementation commit, or completion-state change was
performed by the acceptance owner.

### TEAM B remediation implementation handoff — 2026-08-10 22:34 +08:00

The user authorized the current operator to finish the remaining implementation
work. Because this operator has now changed implementation code, it is no longer
eligible to own Acceptance Attempt 2. A different independent acceptance owner
must be assigned before that attempt is admitted. The task remains
status: `in_progress`, assigned to `team-b`; no completion or acceptance box is
advanced by this handoff.

The two repository-local defects identified by independent remediation review 1
are now closed in the uncommitted runtime working tree:

- .github/workflows/pages.yml and .github/workflows/font-bundles.yml now
  check out the repository before invoking the repository-local release-tag
  guard;
- scripts/release-runtime/stage-draft.mjs now treats the documented
  --dry-run boolean as optional;
- `tests/release-runtime/workflow-guard.test.ts` now asserts checkout-before-guard
  order and executes the copied guard from a clean temporary runner using valid
  tag `v2.7.3`;
- `tests/release-runtime/cli-contract.test.ts` now invokes the real
  stage-draft.mjs process with all mandatory options but no --dry-run, and
  asserts dryRun: false without a missing-option failure.

Runtime-repository validation for this exact working tree passed:

- focused release-runtime tests: 23 passed;
- planned full Vitest gate: 217 passed and 1 skipped;
- pnpm typecheck: passed;
- pnpm lint: 0 errors and 22 pre-existing warnings;
- pnpm build: passed;
- Trellis task validation and git diff --check: passed.

During the final pre-commit rerun, the combined validation shell completed
type-check, all 217 planned tests (1 skipped), and lint, then one concurrent
`tsup` process exited with Windows status `3221226356` (`0xC0000374`) after
partial build output. An immediate isolated `pnpm build` rerun, without any code
change, completed all ESM/CJS/IIFE/declaration outputs successfully. The
transient process failure is retained here rather than hidden as a clean first
attempt.

After the handoff review, the two non-blocking Node helper follow-ups were also
closed before commit. `node-smoke-gate.cjs` now destroys the converter from a
`finally` block after intermediate failures, fails when the unsupported-format
case unexpectedly succeeds, and fails when a required ABI export is absent.
The hardened helper was rerun against the retained Attempt 1 downloaded-byte
extraction without starting Chromium or Acceptance Attempt 2. It passed the
positive, reuse, negative, recovery, ABI, and cleanup phases; cleanup recorded
`destroyed`, `moduleReleased`, and `initializedFalse` as `true`. The persisted
result is `research/node-smoke-result.post-hardening.json`, SHA-256
`b925c50209cb87cb12751bde002c9cd9aafa633106e9a49c8a6b888c55944dce`.

The PDFHow cancellation mismatch was traced to a synchronous progress callback
race. OfficeConversionRuntime rejected and detached the active engine when its
consumer aborted on converting, but the engine continued and later published
`finalizing`, overwriting the browser gate's retained progress. The uncommitted
PDFHow remediation is limited to:

- `app/lib/office-conversion/runtime/office-conversion-runtime.ts`, which wraps
  every forwarded engine progress event with active-operation assertions both
  before and after invoking the consumer listener;
- `app/lib/office-conversion/runtime/office-conversion-runtime.test.ts`, which
  aborts synchronously on converting and verifies a CANCELLED result, exactly
  `checking-capabilities` then `converting`, no late `finalizing`, and one engine
  disposal.

PDFHow validation passed for the focused runtime test (11 of 11) and targeted
Biome check. A no-emit TypeScript run remains globally red because of unrelated
existing i18n and route-type errors in the dirty PDFHow worktree; filtering that
same compiler output found no diagnostic for either changed runtime file. No
type escape, generated file, or unrelated PDFHow file was changed.

The retained Attempt 1 trace also changes the interpretation of the cold-start
blocker without changing its rejected status. Sample 1 successfully advanced
through the initial, pinned-fixture, and profile-restart conversions, then failed
at the later cancellation assertion (office-browser.playwright.ts:501). Its
Playwright trace records context close and Worker Cleanup completion at about
202 seconds. The recorded 604.1-second exit-124 condition therefore occurred at
the outer command boundary after the browser test worker cleaned up; it is not
evidence of a LibreOffice cold-initialization timeout. Because the assertion
short-circuited the test before its explicit recovery and gate.dispose() path,
the progress fix should allow that normal teardown path to run, but this remains
an implementation hypothesis until a distinct independent retry-free gate.

This is a persisted implementation handoff, not an acceptance-admission record.
The following conditions still block Attempt 2:

1. Commit the runtime remediation as a distinct implementation commit and merge
   the two guarded workflows to default branch main.
2. Commit or otherwise materialize the PDFHow runtime fix for the independent
   acceptance checkout without including unrelated PDFHow worktree changes.
3. Assign a new independent acceptance owner, who must run the full Chromium
   candidate gate and five fresh-browser samples without retries, preserving any
   new failure.
4. Keep release `367637128` draft and `releaseQualified: false`; do not replace
   assets, publish, trigger a native build, or start Attempt 2 beforehand.

### Acceptance Attempt 2 formal admission handoff — 2026-08-11

The preceding implementation-handoff section remains an accurate historical record of the state at that time: it was not then an acceptance-admission record and Attempt 2 was then blocked. This new additive section records the later remediation commits, independent-owner assignment, formal command package, and current admission state without changing that historical meaning.

Current formal state:

- Acceptance Attempt 2: ADMITTED;
- acceptance owner: OpenAI Codex AI 编程代理（当前验收会话实例）;
- admission scope: execution and independent PASS/FAIL signature;
- Runtime checkout: a1c3cd6d6d2dd25fab063539e9fe40fbb327b846;
- PDFHow checkout: b41fde5db9829ede7e6e217de6ac12c2b475b7fc;
- Release ID: 367637128;
- required Release state: draft;
- required manifest state: releaseQualified false;
- current acceptance decision: pending independent execution;
- Attempt 2 started: false.

The Runtime remediation commit is present on origin/main and is contained by origin/feat/publish-qualified-libreoffice-runtime-artifact. The PDFHow remediation commit is present on origin/main. The independent owner did not participate in TEAM B implementation, remediation, commits, or conclusion formulation. TEAM B does not predeclare PASS or FAIL.

The formal handoff is acceptance/acceptance-attempt-2-handoff.md. The complete verbatim command package is acceptance/attempt-2-commands.ps1 plus acceptance/attempt-2-download-assets.mjs. It fixes fresh paths, checkouts, environment, inputs and outputs, per-command timeout, retry disabled, expected exit 0, evidence files, five independent cold-start commands, and immediate stop with no rerun or backfill after failure. TEAM B has not executed those commands as Attempt 2.

Release 367637128 remains draft with releaseQualified false. Existing Release assets have not been replaced or modified. Build WASM run 31211473147 remains the newest native/WASM build, so no new native/WASM build has occurred since the frozen candidate. Any drift discovered by the independent owner fails closed before execution.

Attempt 1 evidence and the rejected receipt remain unchanged and continue to be the authoritative history for Attempt 1.

### Acceptance Attempt 2 formal failure and Attempt 3 timeout remediation — 2026-08-11

The independent execution phase for Acceptance Attempt 2 has ended. The formal decision is `FAIL`; the attempt is CLOSED and continuation is prohibited. The failure occurred at `checkout-runtime`, whose one permitted invocation exceeded the admitted 60-second timeout. The command package stopped immediately with `TIMEOUT after 60 seconds: checkout-runtime. Stop immediately; no retry or backfill is permitted.` Every later gate was NOT RUN, and Release qualification remains false.

The independent owner persisted the machine-readable records `acceptance/acceptance-attempt-2-evidence.json` and `acceptance/acceptance-attempt-2-receipt.rejected.json`. The additive narrative report is `acceptance/acceptance-attempt-2-report.md`. The external evidence root `D:\tmp\lo-runtime-acceptance-attempt-2` must remain unchanged. Nothing in this section modifies or supersedes Attempt 1 history or the previously admitted Attempt 2 handoff.

A separate diagnostic clone, isolated from Attempt 2 evidence, completed the same detached checkout with exit code 0 after 108.631 seconds, at HEAD `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846` with a clean worktree. This confirms that the fixed commit exists and that the formal 60-second boundary was insufficient. The diagnostic is not Attempt 2 acceptance evidence, is not a retry or backfill, and cannot change the FAIL decision.

TEAM B has made a process-only remediation for a possible later attempt. The new `acceptance/attempt-3-commands.ps1` retains fresh `--no-checkout` clones and fixed detached checkouts, but gives both `checkout-runtime` and `checkout-pdfhow` a 300-second timeout. It uses the new root `D:\tmp\lo-runtime-acceptance-attempt-3` and the independent helper `acceptance/attempt-3-download-assets.mjs`. It does not use an old worktree, TEAM B staging, a prior extraction, Attempt 1/2 downloads, or a local overlay. No frozen candidate byte, Release asset, product implementation, native/WASM artifact, or acceptance gate was changed or executed by this remediation.

The formal next-attempt record is `acceptance/acceptance-attempt-3-handoff.md`. Current state:

- Acceptance Attempt 2: CLOSED / FAIL;
- Attempt 2 failure stage: `checkout-runtime`;
- Attempt 2 retry, continuation, and backfill: NOT PERMITTED;
- Attempt 2 subsequent gates: NOT RUN;
- current next-action owner: TEAM B, for handoff persistence only;
- Acceptance Attempt 3: NOT ADMITTED;
- Attempt 3 eligible: false;
- Attempt 3 started: false;
- Attempt 3 PASS/FAIL decision: none;
- Runtime checkout: `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`;
- PDFHow checkout: `b41fde5db9829ede7e6e217de6ac12c2b475b7fc`;
- Release ID: `367637128`;
- required Release state: `draft: true`;
- required manifest state: `releaseQualified: false`.

TEAM B has not admitted or executed Attempt 3 and does not predeclare PASS or FAIL. Before any Attempt 3 command may run, a newly independent acceptance owner must verify the handoff, remote refs, fixed commits, Release identity, all asset names/sizes/SHA-256 values, and latest native/WASM workflow run, then explicitly persist the correctly spelled statement `Acceptance Attempt 3: ADMITTED`. Any mismatch keeps the attempt NOT ADMITTED.

After admission, Attempt 3 must start every gate from zero: fresh Release downloads; archive safety and exact inventory; provenance, ABI/schema, pthread and worker-absence assertions; workflow and CLI contracts; downloaded-byte Node gates and cleanup; the full retry-free Chromium candidate gate; five consecutive fresh-browser cold starts; and final Release/native-build immutability checks. Attempt 1/2 results cannot be reused or backfilled.

Release `367637128` remains prohibited from publication until a new attempt independently passes. Assets must not be replaced or re-uploaded, the candidate must not be represented as qualified, and no unnecessary native/WASM build may be triggered.
### Acceptance Attempt 3 formal admission — 2026-08-11

The independent acceptance owner **OpenAI Codex AI 编程代理（当前验收会话实例）** verified the Attempt 3 handoff against the local clean checkout, the Runtime and PDFHow remote refs, Draft Release `367637128`, all five fixed asset identities, the candidate manifest, the latest Build WASM run, the pinned DOCX, the command package, and the preserved Attempt 1/2 history. No mismatch was found.

Current formal state:

- Acceptance Attempt 3: ADMITTED;
- admission scope: execution and independent PASS/FAIL signature;
- Attempt 3 eligible: true;
- Attempt 3 started: false;
- Attempt 3 decision: pending independent execution;
- acceptance root: `D:\tmp\lo-runtime-acceptance-attempt-3`, confirmed absent at admission;
- Runtime checkout: `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846` with a 300-second checkout timeout;
- PDFHow checkout: `b41fde5db9829ede7e6e217de6ac12c2b475b7fc` with a 300-second checkout timeout;
- Release `367637128`: `draft: true`, `published_at: null`, and `releaseQualified: false`;
- latest Build WASM run: `31211473147`, with no later native/WASM build.

The exact independent admission signature and verification inventory are persisted in `acceptance/acceptance-attempt-3-handoff.md`. The formal Attempt 3 command package has not run. It may be invoked exactly once only after this admission commit is pushed and the remote ref is reverified. Any later command failure or timeout closes Attempt 3 immediately with no retry, continuation, replacement, or backfill.
### Acceptance Attempt 3 pre-start admission revocation — 2026-08-11

The admission commit was pushed and the remote ref matched, but the independent owner did not start the formal command. During the mandatory final pre-start recheck, PowerShell `7.6.4` deserialized GitHub's fixed ISO `created_at` field as `System.DateTime`. The normative script directly compares that value to the string `2026-08-07T19:26:24Z` at lines 238 and 415, and the comparison evaluates false even though invariant UTC normalization proves the remote value is unchanged.

Because the command declares compatibility with PowerShell 7 or later, this is a formal command/environment contract defect rather than Build WASM drift. The independent owner did not edit the script or substitute a command. Attempt 3 is therefore **NOT ADMITTED**, eligible false, started false, and has no PASS/FAIL decision. `D:\tmp\lo-runtime-acceptance-attempt-3` remains absent. Release `367637128` remains draft/unpublished/unqualified, its five assets remain unchanged, and Build WASM run `31211473147` remains latest.

The machine-readable revocation record is `acceptance/acceptance-attempt-3-admission-revoked.json`. TEAM B owns the next action: remediate and test the PowerShell JSON-date comparison contract, persist a new handoff commit without running Attempt 3, and request independent re-admission.

### Acceptance Attempt 3 timestamp-contract remediation handoff — 2026-08-11

Following the independent pre-start revocation at commit `d342e25640f703bee5d2099213ab2d195b5319b0`, TEAM B remediated only the normative PowerShell timestamp-comparison contract. Attempt 3 was not executed, continued, retried, or backfilled. Its formal state remains **NOT ADMITTED**, `eligible: false`, `started: false`, with no PASS/FAIL decision and no assigned execution owner.

The new shared helper `acceptance/attempt-3-time-contract.ps1` normalizes supported timestamp values to UTC instants before comparing ticks. It handles `DateTimeOffset`, rejects `DateTimeKind.Unspecified`, requires explicit timezone information for strings, parses strings with invariant culture and UTC adjustment, and fails closed on null, invalid, ambiguous, unsupported, or genuinely changed values. Both the preflight and final Build WASM `created_at` assertions in `acceptance/attempt-3-commands.ps1` now call this helper; neither direct object-to-string comparison remains.

The executable contract test `acceptance/attempt-3-time-contract.tests.ps1` was run with PowerShell `7.6.4` and exited `0`. It confirmed that `ConvertFrom-Json` returns `System.DateTime` for the GitHub-style timestamp, that the same instant passes across different supported object types and explicit offsets, that a one-second change fails closed, that invalid/offset-free/unsupported/unspecified inputs fail closed, and that comparison is independent of a `tr-TR` current culture. PowerShell parser validation passed for the formal command, helper, and test.

Remediated package SHA-256 values:

- `attempt-3-commands.ps1`: `0a57a72f4d64f99570ce7db53124e17ed94936ccd536b924ef9c342723bdb929`;
- `attempt-3-download-assets.mjs`: `731356b001b7cdba1e5c778092638494af65e8f64a63637f486fb360b51ce8f5`;
- `attempt-3-time-contract.ps1`: `d07788e24e6200928fa9685d0778e7d903cb8c3b32d44fd7d67aadaa685d550e`;
- `attempt-3-time-contract.tests.ps1`: `61af58aaf3cd5fd0d5b62e8a334a1bb295802ff9cf90fa01250ad3129e5cc208`.

The fixed Runtime/PDFHow commits, candidate, Release identity, five asset identities, 300-second checkout limits, retry-free/fail-closed rules, and every previously required gate remain unchanged. Release `367637128` must remain `draft: true`, `published_at: null`, and `releaseQualified: false`; no asset may be replaced and no native/WASM build may be triggered.

TEAM B has prepared this remediation/handoff commit only. Before any Attempt 3 formal command runs, an independent acceptance owner must verify the new remote commit and all fixed external state, then explicitly persist the correctly spelled statement `Acceptance Attempt 3: ADMITTED`. The revoked admission is not restored by this TEAM B change.

### Acceptance Attempt 3 independent re-admission after timestamp remediation — 2026-08-11

The independent acceptance owner verified TEAM B handoff commit `d73b72cd38709d4bff94b380cf30439d55516d27` against the remote feature ref and independently reran the timestamp contract test on PowerShell `7.6.4`. Parser validation, `node --check`, task assertions, Trellis validation, package SHA-256 checks, fixed Runtime/PDFHow remote refs, Release identity/assets, candidate manifest, latest Build WASM identity, historical evidence hashes, pinned DOCX identity, and absence of `D:\tmp\lo-runtime-acceptance-attempt-3` all passed.

The independent owner did not participate in TEAM B's timestamp-contract implementation, remediation commit, test-result formulation, or handoff conclusion. The exact re-admission signature and verification inventory are persisted in `acceptance/acceptance-attempt-3-handoff.md`.

Current formal state:

- Acceptance Attempt 3: **ADMITTED**;
- admission scope: execution and independent final PASS/FAIL signature;
- eligible: true;
- started: false;
- decision: pending independent execution;
- acceptance owner: OpenAI Codex AI 编程代理（当前验收会话实例）;
- TEAM B executed Attempt 3: false;
- formal acceptance root: `D:\tmp\lo-runtime-acceptance-attempt-3`, confirmed absent at re-admission;
- Release `367637128`: `draft: true`, `published_at: null`, and `releaseQualified: false`;
- latest Build WASM run: `31211473147`, with no later native/WASM build.

The formal Attempt 3 command package has not run. It may be invoked exactly once only after this re-admission commit is pushed and the remote feature ref is reverified. Any formal failure or timeout closes Attempt 3 immediately and prohibits retry, continuation, replacement, supplementation, or backfill.

### Acceptance Attempt 3 independent execution closure — 2026-08-11

The independently admitted command package was invoked exactly once from fresh detached checkout `027fd8d69f7d02584a97e444180946e61516c687`, using `D:\tmp\lo-runtime-acceptance-attempt-3` as the new formal root. Runtime clone, fixed detached checkout, HEAD/ref verification, and remediation ancestry verification completed.

Formal command 6, `clone-pdfhow`, started at `2026-08-11T20:12:28.6943643Z` and exceeded its fixed 300-second timeout. The command package exited `1` with `TIMEOUT after 300 seconds: clone-pdfhow. Stop immediately; no retry or backfill is permitted.` No retry, continuation, replacement, supplementation, or backfill occurred. The completion marker is absent and no Git process remained after termination.

Acceptance Attempt 3 is therefore **CLOSED / FAIL**. PDFHow checkout/ref verification and every later gate were NOT RUN: Build WASM preflight, Release download/verification, archive assertions, workflow/CLI checks, Node gates, Chromium candidate gate, five cold-start samples, and final Build WASM/Release immutability checks.

The independent records are:

- `acceptance/acceptance-attempt-3-receipt.rejected.json`;
- `acceptance/acceptance-attempt-3-evidence.json`;
- `acceptance/acceptance-attempt-3-report.md`.

Raw evidence remains preserved under `D:\tmp\lo-runtime-acceptance-attempt-3`. Release `367637128` must remain draft/unpublished, `releaseQualified` must remain `false`, assets must remain immutable, and Attempt 3 may not be rerun or continued. Any later execution requires a separately documented TEAM B remediation/handoff and explicit independent admission as a new acceptance attempt.


### Acceptance Attempt 4 clone-timeout remediation handoff — 2026-08-12

Attempt 3 remains **CLOSED / FAIL** at independent record commit `6e5a716cf0287afc5d6b97dfbceb658c19859146`. Its sole formal invocation timed out at command 6 `clone-pdfhow` after 300 seconds; exit code was `1`, no retry/continuation/backfill occurred, and all subsequent gates were NOT RUN. `D:\tmp\lo-runtime-acceptance-attempt-3` must remain unchanged and Attempt 3 must never run again.

TEAM B performed a separate non-acceptance diagnosis in `D:\tmp\lo-runtime-team-b-pdfhow-clone-diagnostic-20260812`: the full no-checkout clone exited `0` in `20.611` seconds, and detached checkout `b41fde5db9829ede7e6e217de6ac12c2b475b7fc` exited `0` in `3.842` seconds with the fixed HEAD and a clean worktree. This diagnosis is not acceptance evidence and cannot satisfy any later gate.

TEAM B prepared `acceptance/acceptance-attempt-4-handoff.md` and separately named Attempt 4 command/helper/test files. `clone-pdfhow` remains a full fresh clone, single-pass, retry-free and fail-closed, with timeout raised from `300` to `900` seconds.

Current formal state: Acceptance Attempt 4 is **NOT ADMITTED**; eligible `false`; started `false`; formal invocation count `0`; TEAM B has not executed it or predeclared PASS/FAIL. The new formal root is `D:\tmp\lo-runtime-acceptance-attempt-4`.

Runtime/PDFHow commits, frozen candidate, Release `367637128`, asset identities and Build WASM baseline remain fixed. Release publication, asset replacement and unnecessary native/WASM builds remain prohibited. Independent verification and an explicit persisted `Acceptance Attempt 4: ADMITTED` are required before any formal command may run.

### Acceptance Attempt 4 independent admission — 2026-08-12

**Acceptance Attempt 4: ADMITTED**

The independent acceptance owner, OpenAI Codex AI 编程代理（当前验收会话实例）, verified TEAM B handoff commit `9779ef9412a3572f2a4a0f700e7bdaff57715cf8` from a new clean detached checkout and confirmed that the remote feature ref pointed to the same commit. Runtime `origin/main` remained `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846` and was contained by the handoff feature tip; PDFHow `origin/main` remained `b41fde5db9829ede7e6e217de6ac12c2b475b7fc`.

The independent review confirmed the exact four Attempt 4 package hashes, PowerShell parsing, download-helper `node --check`, the timestamp contract on PowerShell `7.6.4`, Trellis validation, and `git diff --check`. The delta from Attempt 3 closure is limited to the separately named Attempt 4 materials and task history, with the formal PDFHow clone timeout raised from 300 to 900 seconds while retaining one invocation, no retry, and fail-closed termination.

Release `367637128` still has the fixed tag and target, remains `draft: true` with `published_at: null`, and retains exactly five assets with the fixed IDs, names, sizes, and SHA-256 digests. The candidate manifest still records candidate `21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b`, `releaseQualified: false`, fixed provenance, ABI `lok-convert-document-v1`, schema 1, `main-script` pthread mode, `externalWorker: null`, and exactly eight runtime files without `soffice.worker.js`. Build WASM run `31211473147`, created `2026-08-07T19:26:24Z` at `71d33678ed74872ebbb1bc37f5778143f8f5e401`, remains the latest successful run.

The pinned DOCX remains 6,693,403 bytes with SHA-256 `a78495545ae41486aa61c9a0e8c4c78f6491a8e7b3cfacbd4185ed0f124f59df`. All 19 preserved Attempt 3 raw evidence files still match the committed rejected evidence inventory. `D:\tmp\lo-runtime-acceptance-attempt-4` was absent at admission. TEAM B did not execute Attempt 4, and the independent owner did not run any formal Attempt 4 command before admission.

Current formal state:

- Acceptance Attempt 4: **ADMITTED**;
- admission scope: execution and independent final PASS/FAIL signature;
- eligible: true;
- started: false;
- decision: pending independent execution;
- formal invocation count: 0;
- acceptance owner: OpenAI Codex AI 编程代理（当前验收会话实例）;
- formal root: `D:\tmp\lo-runtime-acceptance-attempt-4`, confirmed absent at admission;
- Release `367637128`: `draft: true`, `published_at: null`, `releaseQualified: false`;
- latest Build WASM run: `31211473147`, with no later native/WASM build.

The exact signature and verification inventory are persisted in `acceptance/acceptance-attempt-4-handoff.md`. This admission does not imply PASS. The formal command may be invoked exactly once only after this admission commit is pushed and the remote feature ref is reverified. Any nonzero exit, timeout, assertion failure, crash, or missing evidence closes Attempt 4 immediately and prohibits retry, continuation, failed-sample restart, replacement, supplementation, or backfill.

### Acceptance Attempt 4 independent closure — 2026-08-12

**Acceptance Attempt 4: CLOSED / FAIL**

The independently admitted command package was invoked exactly once from fresh detached checkout `3fbb14eba9ad009790f6f5b9ed1ac513096bdb77`, with formal root `D:\tmp\lo-runtime-acceptance-attempt-4`. Commands 1–12 completed. Command 13, `runtime-install`, returned child exit code `1` before the 600-second timeout.

The formal helper resolved pnpm to `D:\Applications\Scoop\apps\nvm\current\nodejs\nodejs\pnpm.cmd`, but the fixed Windows `.cmd` branch supplied `cmd.exe /d /s /c` an extra-outer-quoted command string. `cmd.exe` rejected the resulting leading doubled quote before pnpm started. The formal exception was `Unexpected exit code 1, expected 0: runtime-install. Stop immediately; no retry or backfill is permitted.` This is a normative command-package Windows `.cmd` launch/quoting defect, not a dependency-install result, network fluctuation, or timeout.

The single invocation was terminated fail-closed. Retry, continuation, failed-sample restart, replacement, supplementation, and backfill were not performed. Runtime build, workflow/CLI contracts, Node gates and cleanup assertions, PDFHow install, Chromium candidate gate, all five cold-start samples, and formal final Build WASM/Release immutability checks are **NOT RUN**. The formal completion marker and automatic evidence inventory are absent. No formal residual processes remain.

Pre-failure evidence passed fresh Runtime/PDFHow checkout and ref checks, remediation ancestry, Build WASM preflight, Release identity, all-five-asset fresh download, archive path safety, exact eight-file inventory, provenance, ABI/schema, pthread mode, forbidden-worker absence, and `releaseQualified: false`. These preliminary results cannot qualify the candidate or override FAIL.

The independent owner signed and persisted:

- `acceptance/acceptance-attempt-4-receipt.rejected.json`;
- `acceptance/acceptance-attempt-4-evidence.json`;
- `acceptance/acceptance-attempt-4-report.md`.

Preserve `D:\tmp\lo-runtime-acceptance-attempt-4` unchanged. Release `367637128` must remain draft/unpublished, `releaseQualified` must remain `false`, and all five assets must remain immutable. Attempt 4 may not be rerun or continued. Any later acceptance requires TEAM B remediation, a new Attempt 5 handoff and formal root, and explicit independent admission before execution.
### Acceptance Attempt 5 Windows command-launch remediation handoff — 2026-08-12

Acceptance Attempt 4 remains permanently **CLOSED / FAIL** under independent closure commit `4cfd07117d441f100765de0281296cbd6a7be131`. Its sole formal invocation stopped fail closed at command 13, `runtime-install`, because the normative launcher supplied the resolved `pnpm.cmd` command through `ProcessStartInfo.ArgumentList`; .NET argv escaping produced leading literal backslash-escaped/doubled quotes that `cmd.exe /d /s /c` rejected before pnpm started. There was no retry, continuation, rerun, replacement, supplementation, or backfill, and all subsequent gates were NOT RUN. `D:\tmp\lo-runtime-acceptance-attempt-4` must remain unchanged and cannot satisfy any later gate.

TEAM B prepared a separate Attempt 5 command package and handoff. The shared production helper `acceptance/attempt-5-command-launch.ps1` keeps native executables on `ProcessStartInfo.ArgumentList`, but launches every resolved `.cmd` or `.bat` through `%ComSpec%` using one raw `ProcessStartInfo.Arguments` value for the conventional `/d /s /c ""<executable>" "<argument>" ..."` contract. The complete cmd.exe command string is never passed through `ArgumentList`. Embedded double quotes, CR/LF, `%`, and `!` fail closed before process start, and command metadata records the resolved executable and selected launch contract.

The production-same-helper executable test `acceptance/attempt-5-command-launch.tests.ps1` passed as TEAM B remediation verification on PowerShell `7.6.3`. It covered synthetic `.cmd` and `.bat` wrappers in paths containing spaces, exact preservation of arguments containing spaces, `&`, `|`, `^`, parentheses, long grep text, and Windows paths, exact propagation of child exit `23`, fail-closed unsupported expansion/quote tokens, native `git.exe`/`gh.exe`/`node.exe`, and actual `pnpm.cmd` `11.6.0`. This verification is not Attempt 5 execution or acceptance evidence. The formal Attempt 5 command independently runs the same test as command 1 after admission.

The immutable Attempt 5 package is:

- `acceptance/attempt-5-commands.ps1` — SHA-256 `20ab8596fbb93212188ac50d21d56669daac565204684bcf22f4b3da0d1aa475`
- `acceptance/attempt-5-download-assets.mjs` — SHA-256 `c89029017a349b88d29dfc4b799bc710624c4b0559a86e93080674bd870a1806`
- `acceptance/attempt-5-time-contract.ps1` — SHA-256 `d07788e24e6200928fa9685d0778e7d903cb8c3b32d44fd7d67aadaa685d550e`
- `acceptance/attempt-5-time-contract.tests.ps1` — SHA-256 `6641538284bc8ba00b2bbadc661b2f33edd9406b238d445cfb3c48333139442b`
- `acceptance/attempt-5-command-launch.ps1` — SHA-256 `4e278a03386813c9d48bd4366124403916d0f7c0bd57632cea45d4f1ccc6f11d`
- `acceptance/attempt-5-command-launch.tests.ps1` — SHA-256 `cbcebe59ff763e745189e58a3c1ad28b2818c7503f79059c113ed59eb1842ce5`
- `acceptance/acceptance-attempt-5-handoff.md` — SHA-256 `995e6c99b43a68a50c1582e6075fa0069c8b13b8fdf8b1cd876ecc650d915d21`

Formal state after this TEAM B handoff preparation:

- Acceptance Attempt 5: **NOT ADMITTED**
- eligible: `false`
- started: `false`
- formal invocation count: `0`
- decision: `null`
- new formal root: `D:\tmp\lo-runtime-acceptance-attempt-5`
- Runtime checkout: `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`
- PDFHow checkout: `b41fde5db9829ede7e6e217de6ac12c2b475b7fc`
- Release: `367637128`, required `draft: true`, `published_at: null`, `releaseQualified: false`

Attempt 5 must start from zero in its fresh root and cannot reuse or backfill Attempt 1/2/3/4 evidence. TEAM B has not executed or admitted Attempt 5 and has not predeclared PASS or FAIL. Release assets may not be replaced, re-uploaded, renamed, removed, or modified; the Release may not be published; no unnecessary native/WASM build may be triggered. The independent acceptance owner must first verify the committed and pushed handoff against the fixed remote state and separately persist the correctly spelled statement `Acceptance Attempt 5: ADMITTED`. Until then, no normative Attempt 5 command may run.

### Acceptance Attempt 5 independent admission — 2026-08-12

The independent acceptance owner, **OpenAI Codex AI 编程代理（当前验收会话实例）**, verified TEAM B handoff commit `99e53cd2841fe2d6f37b05f58875adce7a740f70` from a separate clean admission checkout and persisted:

**Acceptance Attempt 5: ADMITTED**

The owner did not participate in TEAM B's implementation, Windows launcher remediation, commits, package-test result formulation, or handoff conclusion, and independently accepts responsibility for the single formal execution and final PASS/FAIL signature.

Admission verification completed without invoking the formal command package. It covered the fixed Runtime/PDFHow refs, remediation ancestry and bounded delta, all immutable package hashes, parser/Node/Trellis/diff checks, timestamp and production-same Windows launcher contract tests, fresh Attempt 5 root absence, full Attempt 4 evidence preservation, the pinned DOCX hash, Release ID/tag/target/draft/unpublished state, all five asset identities and native-byte hashes, candidate manifest inventory/provenance/ABI/schema/pthread/forbidden-worker fields, and the unchanged latest Build WASM run. No newer native/WASM build was found.

Post-admission state:

- eligible: `true`
- started: `false`
- decision: `null`
- formal invocation count: `0`
- acceptance wait state: `attempt-5-admitted-awaiting-independent-execution`
- formal root: `D:\tmp\lo-runtime-acceptance-attempt-5` (must be created only by the single formal invocation)

Admission does not imply PASS. The pushed admission commit must be independently confirmed as the remote feature ref before the formal command starts. The formal execution must use a new checkout distinct from the admission checkout. Any command failure, timeout, assertion failure, crash, or missing evidence closes Attempt 5 FAIL with no retry, continuation, replacement, supplementation, or backfill. A monitoring or transport `stream disconnected` may be retried only for observation and never permits a second formal invocation.

### Acceptance Attempt 8 protocol refactor handoff — 2026-08-13

TEAM B submitted a protocol-only Acceptance Attempt 8 handoff. Attempt 8 was not prepared, admitted, or invoked. Current state remains **NOT ADMITTED**, eligible `false`, started `false`, formal invocation count `0`, and decision `null`. The default preparation, invocation-control, and formal roots were absent when the pre-admission audit was generated.

The refactored protocol separates three evidence domains:

1. **Retryable preparation — not acceptance evidence.** All clone/fetch/`ls-remote`, GitHub queries, Release queries/downloads, dependency installation, Chromium installation, archive extraction, preparation-helper checks, and PDFHow local-candidate workspace preparation are isolated in `attempt-8-prepare.ps1`. A successful run creates a schema-checked preparation manifest and sealed exact inventories without starting formal acceptance.
2. **Offline, retry-free formal acceptance.** `attempt-8-invoke-formal.ps1` requires an independent schema-versioned ADMITTED record bound to the exact command-package, preparation-manifest, and sealed-input-manifest SHA-256 values, then verifies package identity, preparation manifest state, sealed local inputs, fixed identities, and fresh roots. Only afterward does it atomically create the one-shot formal marker. `attempt-8-formal.ps1` contains only eight local candidate behavior gates and forbids retry, continuation, supplementation, backfill, failed-root reuse, network-capable commands, dependency installation, and browser download.
3. **Independent post-formal disposition audit — not acceptance evidence.** `attempt-8-disposition-audit.mjs` performs only read-only, retryable remote queries outside the formal root. It cannot change the formal decision or backfill formal evidence.

Automatic closure is provided by `attempt-8-close.mjs`, which creates or byte-verifies the evidence, matching receipt, and report. It is resumable only when existing output is byte-identical and otherwise fails closed.

TEAM B local protocol verification passed:

- PowerShell parser: all five Attempt 8 PowerShell files passed;
- production-same Windows launcher test: passed on PowerShell `7.6.4`;
- Node syntax checks: all Attempt 8 `.mjs` files passed;
- protocol tests: `16` passed, `0` failed;
- 17-file command package generate/verify: passed;
- pre-admission audit: passed, classification `not acceptance evidence`;
- handoff/schema/state consistency audit: passed, classification `not acceptance evidence`.

Identity records:

- `acceptance/attempt-8-command-package.json` — SHA-256 `dfb346745f3b0e0153a72cf1331134cdf17d61c92ff5ce0eaa3a7fba9730c23c`;
- `acceptance/acceptance-attempt-8-pre-admission-audit.json` — SHA-256 `711a47f3f7388af7470aa2e631991940c85f9de084d85327f5f6791463cf36df`;
- `acceptance/acceptance-attempt-8-handoff.md` — protocol-only handoff for independent audit;
- `acceptance/acceptance-attempt-8-handoff-audit.json` — passed pre-admission handoff consistency audit, not acceptance evidence.

These results are not acceptance evidence. Before preparation or formal invocation can be treated under Attempt 8, the independent acceptance owner must audit protocol/package/schema/state/handoff consistency. Preparation may then be run separately and retried, but remains not acceptance evidence. A subsequent independent admission must bind the exact command package and verified sealed inputs before the one-shot marker may be created. Until that admission exists, formal invocation count remains `0`.
