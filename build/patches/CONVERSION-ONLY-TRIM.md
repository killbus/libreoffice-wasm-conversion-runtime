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

## Atoms (apply order: exports → shims)

| atom | file | touches | reversible alone? |
|---|---|---|---|
| **exports** | `wasm-trim-lok-exports-conversion-only.patch` | `desktop/Executable_soffice_bin.mk` only | yes |
| **shims** | `wasm-trim-lok-shims-conversion-only.patch` | `desktop/source/lib/init.cxx` only | yes |

Generated from local LO tree:

- A = `946c5d226` (full `wasm-build-fixes.patch` applied on tip `d1c9e0e4e`)
- B = `f33576ec3` (A + both atoms)

```
git diff A B -- desktop/Executable_soffice_bin.mk  > exports atom
git diff A B -- desktop/source/lib/init.cxx        > shims atom
```

Verified on A:

- atom1 alone → mk == B, init still A
- atom2 alone → init == c219eb02b, mk still A
- atom1 then atom2 → both files == B (git diff 0)

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
2. `.mk` / `.component` conditional compile (UI submodules never built)
3. fs-image resource cut
4. **LOK shim export/body trim** ← these atoms

Cutting shim wrappers does **not** by itself drop `sd`/`sc` UI symbols from
the wasm — those come from being compiled and linked. Do not expect a large
wasm size win from atoms alone; use them to narrow the ABI surface and to
bisect cleanly.

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
