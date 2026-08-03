# Research: classic soffice.js/cjs vs EXPORT_ES6 soffice.mjs

## Question

Why does `wasm-build-fixes.patch` (upstream main / this fork) enable `EXPORT_ES6` / `soffice.mjs`, while the published package and runtime loaders ship and consume `soffice.cjs` / `soffice.js`?

## Facts (verified)

### Runtime loaders (this repo)

- Node: `wasm/loader.cjs` sets `global.Module`, then `require('./soffice.cjs')`.
- Browser: sets `window.Module`, then loads `soffice.js` via `<script>`.
- Neither path uses `import createSofficeModule from './soffice.mjs'`.

### Published npm `@matbee/libreoffice-converter@2.7.2`

- Ships `wasm/soffice.cjs` and `wasm/soffice.js` (no `.mjs` in package files).
- Glue body is classic Emscripten (`function GROWABLE_HEAP_I8...`), with a Node bootstrap line of the form  
  `if(typeof global!=="undefined"){var Module=global.Module=global.Module||{}}`  
  (two copies in the published tarball; see packaging bug below).

### Upstream LO gbuild (libreoffice-24-8)

- `RepositoryFixes.mk` on EMSCRIPTEN maps `soffice_bin` → `soffice.js` when QT6, else historically `soffice.html`.
- Emscripten default shell initializes `Module` as  
  `var Module = typeof Module != 'undefined' ? Module : {}`  
  — **not** `global.Module=global.Module||{}` (local emcc 4.0.22 smoke tests: zero matches).

### Patch intent drift

- `wasm-build-fixes.patch` previously set non-Qt FILENAMES to `soffice.mjs` and added unconditional  
  `MODULARIZE=1`, `EXPORT_ES6=1`, `EXPORT_NAME=createSofficeModule`.
- GHA log then showed `[build LNK] Executable/soffice.mjs`.
- Packaging still did `cp .../soffice.js → soffice.cjs` with `2>/dev/null || true`, so **js copy failed silently** when only `.mjs` existed.
- `OUTPUT_DIR` is the repo `wasm/` tree (LFS checkout already present). Failed copy left **old LFS cjs**; a broken idempotent sed (`head -c 50` truncates mid-`global.Module`) **appended another bootstrap line** (2 → 3 on GHA).
- Stripping bootstrap lines: GHA artifact cjs body SHA == LFS cjs body SHA → packaging never replaced glue with a fresh make output.

### GHA bisect (hashes)

- `soffice.data`: GHA artifact == git LFS (same SHA).
- `soffice.wasm`: GHA ≠ LFS (new binary was copied).
- `soffice.cjs`: body matches LFS; only bootstrap line count differs.

## Decision (engineering, not session labels)

**Single contract for this runtime:**

1. **Link (gbuild primary name, non-QT6):** keep tip default **`soffice.html`** (`gb_Executable_EXT := .html`). Do **not** rename the primary executable to `soffice.js` or `soffice.mjs` without the matching modularize/EXPORT_ES6 model.
2. **Take glue from emscripten aux output:** after a successful html link, **`instdir/program/soffice.js`** (and `.wasm` / `.worker.js`) exist beside the html shell.
3. **Package** that aux **`soffice.js` → `wasm/soffice.cjs`**, then copy to **`wasm/soffice.js`** for the browser; required files must exist or the job **fails**. Do not ship `soffice.html` as the npm entry.
4. **Clear** `OUTPUT_DIR` glue/binaries before copy so checkout leftovers cannot ship.
5. **Bootstrap** at most one `global.Module` line, whole-file idempotent.
6. **No `EXPORT_ES6`** on the headless conversion binary unless loaders are rewritten for `createSofficeModule`.

Rationale: loaders and npm already assume shared `Module` + classic glue. Upstream tip’s `soffice.html` primary is correct for gbuild/emscripten; delivery renames the **aux** `.js`. Mapping FILENAMES to primary `soffice.js` without QT6/EXPORT_ES6 caused `em++: soffice.js not a valid object file` (GHA 30782309363).

## Non-goals of this note

- Does not claim LOK init / `services.rdb` issues are fully solved by packaging alone (wasm binary still differs from LFS on GHA).
- Does not prescribe conversion-only feature trim (autogen / shim cuts); that remains implement.md Phase 4+.

## Related code

- `build/patches/wasm-build-fixes.patch` — FILENAMES + EXPORTED_FUNCTIONS; no EXPORT_ES6 for conversion binary.
- `build/build-wasm.sh` — Step 7 packaging.
- `scripts/test-wasm-packaging-contract.sh` — local packaging contract tests (classic js→cjs, reject mjs-only, bootstrap dedupe).
- `wasm/loader.cjs`, `src/browser.ts` — consumers.
