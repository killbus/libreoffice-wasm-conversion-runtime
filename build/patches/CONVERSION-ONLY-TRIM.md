# Conversion-only patch trim strategy

How conversion-only mode trims the baseline LOK surface. The authoritative
baseline is `wasm-build-fixes.patch` (full H-group green: GHA 30832043019).
Conversion-only atoms are applied **on top of** that consolidated patch when
`CONVERSION_ONLY=1`.

## First principles (why atoms, not one giant reverse-diff)

382ad12's `wasm-trim-conversion-only.patch` was a single 1116-line reverse
diff that mixed two independent contracts:

1. **Link contract** — `EXPORTED_FUNCTIONS` in `desktop/Executable_soffice_bin.mk`
2. **Shim bodies** — C++ wrappers in `desktop/source/lib/init.cxx`

That shape is wrong for three reasons:

- Archive already split these as **014** (exports) and **015** (bodies).
- Bisection requires each lever to be independently reversible.
- A failed conversion-only build cannot attribute fault to "exports" vs
  "bodies" vs "autogen" when they ship as one blob.

The replacement is two atoms, matching the archive boundary.

## Atoms (apply order: exports → shims → ui-sc → ui-sd)

| atom | file | touches | reversible alone? |
|---|---|---|---|
| **exports** | `wasm-trim-lok-exports-conversion-only.patch` | `desktop/Executable_soffice_bin.mk` only | yes |
| **shims** | `wasm-trim-lok-shims-conversion-only.patch` | `desktop/source/lib/init.cxx` only | yes |
| **ui-sc** | `wasm-trim-ui-sc-conversion-only.patch` | `sc/Library_sc.mk`, `sc/Module_sc.mk` | yes |
| **ui-sd** | `wasm-trim-ui-sd-conversion-only.patch` | `sd/Library_sd.mk`, `sd/Module_sd.mk` | yes |

Apply order is listed in `build/patches/series` (quilt-style). `build-wasm.sh`
reads `series` and applies each atom in order when `CONVERSION_ONLY=1`.

### exports + shims (LOK ABI surface)

Generated from local LO tree:

- A = `946c5d226` (full `wasm-build-fixes.patch` applied on tip `d1c9e0e4e`)
- B = `f33576ec3` (A + exports + shims)

```
git diff A B -- desktop/Executable_soffice_bin.mk  > exports atom
git diff A B -- desktop/source/lib/init.cxx        > shims atom
```

Verified on A: atom1 alone / atom2 alone / both → align to B's files (git diff 0).

### ui-sc + ui-sd (.mk conditional compile, lever ②)

Generated from local LO tree:

- A = `946c5d226`
- B = `077fed8f1` (A + ui-sc + ui-sd)

```
git diff A B -- sc/Library_sc.mk sc/Module_sc.mk   > ui-sc atom
git diff A B -- sd/Library_sd.mk sd/Module_sd.mk   > ui-sd atom
```

Each CUT-safe `gb_Library_add_exception_objects` entry is wrapped in
`$(if $(DISABLE_GUI),,entry)`. `Library_scui`/`Library_sdui`, `UIConfig_*`,
`Package_res_xml`/`Package_opengl`/`Package_xml`, `AllLangMoTarget_*` are
gated on `DISABLE_GUI` in `Module_*.mk`.

Verified on A: each ui-* atom dry-runs and applies independently; both
applied → align to B's 4 `.mk` files (git diff 0). See
`research/ui-mk-boundary-survey-4.2c.md` for the KEEP/CUT forensics.

## KEEP (conversion + abort)

From 012/013 basic set + abort group:

- `_libreofficekit_hook`, `_libreofficekit_hook_2`
- `_lok_preinit`, `_lok_preinit_2`
- `_lok_documentLoad`, `_lok_documentLoadWithOptions`
- `_lok_documentSaveAs`
- `_lok_documentDestroy`, `_lok_destroy`, `_lok_getError`
- `_lok_abortOperation`, `_lok_setOperationTimeout`, `_lok_getOperationState`, `_lok_resetAbort`
- `_malloc`, `_free`

## CUT (editor / rendering / interaction / a11y)

From 014/015 extended set — removed by the two atoms:

| group | shims |
|---|---|
| tile rendering | `GetParts`, `GetPart`, `SetPart`, `GetDocumentType`, `GetDocumentSize`, `InitializeForRendering`, `PaintTile`, `GetTileMode` |
| text selection | `GetTextSelection`, `SetTextSelection`, `GetSelectionType`, `ResetSelection` |
| interaction | `PostMouseEvent`, `PostKeyEvent` |
| UNO edit | `PostUnoCommand`, `GetCommandValues` |
| page info | `GetPartPageRectangles`, `GetPartInfo`, `GetPartName` |
| clipboard | `Paste` |
| view zoom | `SetClientZoom`, `SetClientVisibleArea` |
| a11y | `GetA11yFocusedParagraph`, `GetA11yCaretPosition`, `SetAccessibilityState` |
| calc | `GetDataArea` |
| edit mode | `GetEditMode`, `SetEditMode` |
| view mgmt | `CreateView`, `CreateViewWithOptions`, `DestroyView`, `SetView`, `GetView`, `GetViewsCount` |
| event loop | `enableSyncEvents`, `disableSyncEvents`, `runLoop` |
| callbacks | `RegisterCallback`, `UnregisterCallback`, `hasCallbackEvents`, `getCallbackEventCount`, `pollCallback`, `clearCallbackQueue`, `flushCallbacks` |

> NOTE: JS (`src/lok-bindings.ts`) still references the cut shims via
> `module._lok_*`. Trim the C surface first; JS method trim happens **after**
> the trimmed wasm is verified green, so the baseline gate stays green.

## What these atoms do NOT do

Per task first principles, the delivery target is the final
`soffice.wasm` / `soffice.data`, not the LO source tree. LOK shim trim is
**lever ④** only — the weakest of the toolbox:

1. `autogen.input` switches (`build/autogen.conversion-only.input`, all
   marked `# PENDING-VERIFY`)
2. **`.mk` / `.component` conditional compile (UI submodules never built)** ← ui-sc/ui-sd atoms
3. fs-image resource cut
4. **LOK shim export/body trim** ← exports/shims atoms

The ui-sc/ui-sd atoms are the **actual size lever** (lever ②): they stop
~327 UI `.cxx` from being compiled at all. The exports/shims atoms only
narrow the ABI surface (lever ④) — 4.2a proved they alone shrink wasm by
just 66 KB because UI module bodies still get compiled and linked.

## How the pipeline applies them

`build/build-wasm.sh`, after `wasm-build-fixes.patch`:

```
if CONVERSION_ONLY=1:
  apply exports atom   # fail hard on error
  apply shims atom     # fail hard on error
```

`build-wasm.yml` sets `CONVERSION_ONLY` from `inputs.mode == conversion-only`.
It also swaps `autogen.input` ← `autogen.conversion-only.input` in the
Configure step. Those are **independent levers** — do not treat a red
conversion-only run as "the atoms failed" without isolating autogen.

## Bisection order (Phase 4)

Full builds are ~4h. Isolate one lever per run:

1. **exports only** — `CONVERSION_ONLY` path modified to skip shims atom;
   keep baseline `autogen.input`. Expectation: ABI surface narrower; wasm
   size roughly baseline (dead shim bodies still linked unless LTO drops them).
2. **exports + shims** — both atoms, still baseline autogen. Expectation:
   same as (1) plus smaller compile of `init.cxx`; LOK init must still work.
3. **autogen deltas** — only after (2) is green, introduce
   `autogen.conversion-only.input` switches one-by-one (LTO last or first
   as a dedicated run — never mix with unproven atoms).

If gate red: reverse the last atom / last autogen switch. Do not stack
unproven changes.

## Module-level conditional compile (stronger UI-cut lever)

Still the primary size lever (design §3.1). Existing patch already gates:

- `writerperfect/Module_writerperfect.mk` on `ENABLE_CDR` / `ENABLE_ETONYEK`
  / `ENABLE_WASM_STRIP_*`
- `xmlsecurity/Module_xmlsecurity.mk` on `DISABLE_GUI`

Phase 4 should extend that pattern to `sc/source/ui`, `sd/source/ui`, etc.
That work is **out of scope of these two atoms**.

## Local verification commands

```bash
# On clean tip d1c9e0e4e with wasm-build-fixes.patch applied (= A):
patch -p1 --dry-run < build/patches/wasm-trim-lok-exports-conversion-only.patch
patch -p1 --dry-run < build/patches/wasm-trim-lok-shims-conversion-only.patch

# Pipeline syntax:
bash -n build/build-wasm.sh
bash scripts/test-wasm-packaging-contract.sh
```
