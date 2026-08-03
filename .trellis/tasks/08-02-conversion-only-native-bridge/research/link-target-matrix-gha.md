# Research: link-target matrix (GHA ground facts)

## Purpose

Cheap, permanent record of what was proven about EMSCRIPTEN **primary link target** vs packaging.  
Prevents re-proposing half-edits (change only FILENAMES or only EXT) that burn full LO WASM builds.

## Binding configuration group (invariant)

A legal config is **one tuple**, not independent knobs:

| Field | Role |
|-------|------|
| `gb_Executable_EXT` | Platform primary suffix (tip default `.html`; fork patch had flipped to `.mjs`) |
| `RepositoryFixes` FILENAMES | `soffice_bin` → installed/link name (`soffice.html` / `.js` / `.mjs`) |
| Link flags | e.g. `EXPORT_ES6`, `MODULARIZE`, `EXPORT_NAME=createSofficeModule` |
| Packaging inputs | Which file is copied to `wasm/soffice.cjs` |
| Loader contract | `require(cjs)+global.Module` vs `createSofficeModule` factory |

**Half-changing any field while leaving others on another row of this table is illegal.**

## GHA run matrix

| Run | EXT (patch) | FILENAMES / LNK target | EXPORT_ES6 | Result |
|-----|-------------|------------------------|------------|--------|
| **30742634098** | `.mjs` (full original patch) | `Executable/soffice.mjs` | yes (createSofficeModule group) | **LNK OK**; packaging looked for `soffice.js`, `\|\| true`, LFS cjs left |
| **30782309363** | still `.mjs` | forced primary **`soffice.js`** | no (stripped in tree) | **FAIL** `soffice.js` not a valid object file |
| **30811166214** | still `.mjs` | FILENAMES back toward **html** → `Executable/soffice.html` | no | **FAIL** `soffice.html` not a valid object file |
| tip unpatched | `.html` | non-QT6 → `soffice.html` | n/a | gbuild/emscripten model: `-o *.html` emits **aux** `.js`/`.wasm` |

## Reading the matrix

1. **Only proven green LNK in this pipeline:** full **mjs + EXPORT_ES6** group (30742634098).
2. **js primary without that group:** fails (30782309363).
3. **html primary while EXT remains `.mjs`:** fails (30811166214) — “restore html FILENAMES only” was a half-edit.
4. **H (classic) requires the full tip-shaped group:** `EXT=.html` **and** primary `soffice.html` **and** no conversion `EXPORT_ES6`, then package **aux** `soffice.js` → cjs.
5. **M requires the full 30742634098 group:** `EXT=.mjs` + mjs name + EXPORT_ES6, then package/loader for factory API.

## Chatroom convergence (Lamport / Carmack / Taleb)

- **Consensus:** half-edits forbidden; config is a bound group.
- **Lamport:** prefer complete **H** (align tip + current classic loader/npm narrative).
- **Carmack:** prefer complete **M** (only green LNK evidence).
- **Taleb:** **Other first** (fixed commit, dry-run, cheap falsification); evidence order **M ≫ H** for tail risk if forced to pick before cheap proof of H.

**Execution order adopted after chatroom:**

1. Record this matrix (Other / cheap memory).
2. Close illegal mid-state: complete **H** in patch (`EXT` must not stay `.mjs` if delivery is classic html-aux-js).
3. Local dry-run + packaging contract tests; **no full GHA until those pass and user accepts residual “H has no green LNK in this pipeline yet” debt.**

## Related

- `classic-js-cjs-vs-export-es6.md` — npm/loader vs EXPORT_ES6 drift
- `build/patches/wasm-build-fixes.patch` — `EMSCRIPTEN_INTEL_GCC.mk` EXT + ldflags
- `build/build-wasm.sh` — package aux `soffice.js` → cjs
- `scripts/test-wasm-packaging-contract.sh`
