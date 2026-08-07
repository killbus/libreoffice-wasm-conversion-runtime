# Implementation plan: official hidden native conversion bridge

## Preconditions

- [x] Work in `D:/tmp/lo-native-bridge-7c1d42e`.
- [x] Confirm branch `feature/official-hidden-native-bridge` is at exact base
      `7c1d42e9c603ad4b0f371762c2689b4fdca51493`.
- [x] Leave the dirty `main` worktree untouched.
- [x] Record the verified baseline artifact and official CLI probe evidence.
- [x] Start this Trellis task only after the PRD convergence pass.

## 1. Create the native patch atom

- [x] Create a pristine worktree from pinned LibreOffice revision
      `d1c9e0e4e1ddeb24fe8f93e56860b3765043f8b1`; do not modify the existing
      diagnostic worktree at `D:/tmp/lo-core-24-8`.
- [x] Apply the two baseline conversion-only patch atoms in build order.
- [x] Implement the private JSON C ABI in `desktop/source/lib/init.cxx`.
- [x] Export `_lok_convertDocument` and `_lok_convertFree` in the WASM link
      configuration while retaining legacy exports.
- [x] Add the minimal native hidden/visible diagnostic evidence needed by the
      first artifact gate.
- [x] Generate `build/patches/wasm-native-conversion-bridge.patch` as an
      independent patch.
- [x] Add its conditional application to `build/build-wasm.sh` after the
      baseline atoms.

## 2. Add the shared bridge contract and binding

- [x] Search existing mappings, UTF-8/pointer helpers, and error conventions
      before adding helpers.
- [x] Add versioned request/result types and one decoder from `unknown`.
- [x] Add one explicit filter-resolution source of truth, including
      DOCX -> `writer_pdf_Export` for PDF output.
- [x] Extend the Emscripten module type with both private bridge exports.
- [x] Add a `lok-bindings.ts` wrapper that guarantees native and Emscripten
      allocations are freed on all paths.
- [x] Surface cleanup state and runtime-reusability without exposing native
      document pointers.

## 3. Migrate basic conversion only

- [x] Switch `converter-node.ts` basic conversion to the shared bridge.
- [x] Switch `converter.ts` basic conversion to the shared bridge.
- [x] Switch the non-image basic branch in `browser.worker.ts` to the bridge.
- [x] Ensure `subprocess.worker.cts` and`node.worker.ts` inherit the Node
      bridge through `LibreOfficeConverter.convert()`.
- [x] Leave editor/render/preview/multi-page-image pointer flows unchanged.
- [x] Enforce runtime quarantine/termination after `cleanup=uncertain`.

## 4. Add inexpensive tests and checks

- [x] Unit-test request encoding, centralized result decoding, schema rejection,
      explicit filter selection, and all allocation/free paths.
- [x] Mock bridge success and each stable failure stage.
- [x] Assert an uncertain cleanup makes the runtime non-reusable.
- [x] Assert basic conversion never calls `documentLoad*`, `documentSaveAs`, or
      `documentDestroy`.
- [x] Add source/build structural checks for ABI exports, CLI-equivalent hidden
      properties, cleanup fallback, patch ordering, and absence of later trims.
- [x] Dry-run patch apply and reverse against the pristine pinned source.
- [x] Run repository formatting/lint/type-check/unit/build gates that do not
      compile LibreOffice WASM.

## 5. Prepare the single expensive build

- [x] Review the exact diff and record the branch/base/patch hashes.
- [x] Confirm every inexpensive gate is green.
- [ ] Trigger one manual `build-wasm.yml` run; do not trigger earlier.
- [ ] Download the artifact to a dedicated `D:/tmp` directory and record its
      SHA-256 hashes.
- [ ] Verify `_lok_convertDocument` and `_lok_convertFree` exports.
- [ ] Run `test.docx` -> PDF and assert `%PDF-`, non-empty output,
      `ok=true`, `stage=complete`, `cleanup=clean`, and hidden-path evidence.
- [ ] Run a second conversion in the same Worker/process.
- [ ] Run malformed-request and load/password-failure negative gates.
- [ ] Store fresh-artifact gate scripts and machine-readable results beside the
      artifact.

## Validation commands

Commands will be finalized against repository scripts before execution. The
expected inexpensive gate set is:

```powershell
git diff --check
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm exec vitest run --exclude 'tests/*converter*.test.ts'
pnpm build
```

Patch verification will use `git apply --check` and
`git apply --reverse --check` in the pristine pinned LibreOffice worktree.

## Local gate record (2026-08-07)

- Runtime branch: `feature/official-hidden-native-bridge`.
- Runtime base/HEAD before commit:
  `7c1d42e9c603ad4b0f371762c2689b4fdca51493`.
- Pinned LibreOffice source:
  `d1c9e0e4e1ddeb24fe8f93e56860b3765043f8b1`.
- Bridge patch SHA-256:
  `822E4AF2AD282D13646F4F46B408B4306254AA91FE6B00573AF9B36CD1523129`.
- Patch scope: 4 files, 992 insertions, 1 deletion.
- `git diff --check`: passed in both runtime and LibreOffice worktrees.
- Patch forward check against the baseline-only LibreOffice index: passed.
- Patch reverse check against the bridge-applied LibreOffice worktree: passed.
- Directed bridge suite: 6 files passed, 52 tests passed.
- CI-equivalent non-artifact suite: 15 files passed, 140 tests passed,
  1 skipped.
- `pnpm install --frozen-lockfile`: passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed with 0 errors and 22 warnings.
- `pnpm build`: passed.
- `pnpm-lock.yaml` was minimized to synchronize only the pre-existing `jszip`
  dev dependency; unrelated pnpm 11 libc/deprecation metadata churn was removed,
  and `pnpm install --frozen-lockfile` passed again.
- The checked-in baseline `wasm/` artifact does not export the new ABI, so
  fresh-artifact integration gates remain intentionally pending.

## Risk and rollback points

- ABI memory ownership: every result pointer must be freed by the matching
  native allocator; tests must force decode and call failures.
- UNO cleanup: a close exception must not bypass fallback disposal; uncertain
  cleanup must poison the runtime.
- Filter behavior: extension strings are not native filter names; unsupported
  pairs fail before native invocation.
- Scope leakage: raw LOK remains necessary for pointer-based features; migration
  is limited to basic conversion.
- Build cost: no workflow dispatch until all local evidence is reviewed.
- Rollback: remove the bridge call sites and the single bridge patch atom; do
  not alter or revert either validated baseline atom.
