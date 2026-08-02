# Conversion-only patch trim strategy (DRAFT)

How to trim `wasm-build-fixes.patch` for the conversion-only build. This is a
strategy document, NOT an applied patch. The 4034-line consolidated patch has
internal cross-dependencies (notably the fs-image patches), so blind deletion
is risky. Trimming is done incrementally in the GHA conversion-only build with
bisection; this file lists what to cut and the known dependencies.

See `.trellis/tasks/08-02-conversion-only-native-bridge/design.md` §3.1/§3.2
for the full rationale.

## Shim classification

The LOK shims come from archive patches 012/013 (basic) and 014/015 (extended),
all merged into `wasm-build-fixes.patch`.

### KEEP (conversion needs these)
From 012-lok-shim-exports.patch + 013-lok-shim-functions.patch:
- `_libreofficekit_hook`, `_libreofficekit_hook_2`
- `_lok_preinit`, `_lok_preinit_2`
- `_lok_documentLoad`, `_lok_documentLoadWithOptions`
- `_lok_documentSaveAs`  ← core of conversion
- `_lok_documentDestroy`, `_lok_destroy`, `_lok_getError`
- `_malloc`, `_free`

### CUT (editor / rendering / interaction / a11y — conversion does not need)
From 014-lok-exported-functions.patch + 015-lok-shim-functions-extended.patch:

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

> NOTE: the JS side (`src/lok-bindings.ts`) references these via
> `module._lok_*`. Trimming the C shims MUST be paired with trimming the JS
> methods (see design §3.2). JS trim happens AFTER the trimmed wasm is
> verified, to keep the baseline gate green.

## Patch-level cut plan

### CUT these archive patches entirely
- `014-lok-exported-functions.patch` — adds the extended EXPORTED_FUNCTIONS list.
  Revert to the 012 basic list (only the KEEP shims above). This is the single
  most important cut: it removes the wasm exports the editor JS calls.
- `015-lok-shim-functions-extended.patch` — C++ implementations of the cut
  shims. With the exports gone, the implementations are dead code; removing
  them shrinks the binary.
- `005-fix-math-accessibility.patch` — a11y fix, conversion does not need.
- `007-fix-sd-annotationwindow-accessibility.patch` — a11y fix.
- `008-fix-slidesorter-accessibility.patch` — a11y fix.

### KEEP (do NOT cut)
- `001-fix-xmlsecurity-headless.patch` — headless build fix.
- `002-emscripten-exports.patch` — base emscripten exports.
- `003-skip-preload-option.patch` — WASM preload fix.
- `004-remove-xmlsec-ui-from-fs-image.patch` — removes xmlsec UI.
- `009-fix-repository.patch` — repo config.
- `010-fix-writerperfect.patch` — filter fix.
- `018-graphicexportfilter-fix.patch` — PNG/SVG/JPG image export fix. Image
  export IS conversion (exportAsImage), keep it.
- `pdfium-emscripten.patch` — PDF support, keep.

### PENDING-VERIFY (may have cross-deps with fs-image)
- `006-add-impress-draw-math-fs-image.patch` — adds impress/draw/math files to
  the fs image. Impress/Draw CONVERSION (pptx→pdf, odp→pdf) may need these fs
  resources. Try to keep; only cut if independently confirmed unused.
- `010-emscripten-fs-image-ui-files.patch` — UI files for fs image. The fs
  image (017) may reference these. HIGH RISK of cross-dep — keep initially.
- `014-emscripten-unipoll-fix.patch` — unipoll event loop fix. Needed only if
  sync events / callbacks run. Since we cut the callback shims, this MIGHT be
  droppable — but the base event loop may still be referenced at link time.
  PENDING-VERIFY: try dropping after cutting callback shims.
- `016-emscripten-platform.patch` — platform config, keep.
- `017-emscripten-fs-image.patch` — fs image config. This is large and likely
  references files added by 006/010. Do NOT cut; it is load-bearing.

## How to apply the trim (Phase 4)

Because `wasm-build-fixes.patch` is a single consolidated file, the trim is
done by maintaining a reverse-patch that un-applies the cut sections, OR by
maintaining two patch files. Recommended approach for the first conversion-only
build:

1. Start from baseline (full patch). Confirm gate passes on GHA.
2. Apply ONE cut at a time (start with 014 EXPORTED_FUNCTIONS revert, since
   that is the highest-value, lowest-risk cut).
3. Rebuild (CLEAN_BUILD=0 incremental — `rebuild-minimal.sh` style relink).
4. Run gate. If green, keep the cut; if red, revert.
5. Proceed through the CUT list. Stop when gate fails or binary stops shrinking.

The `build-wasm.yml` `conversion-only` mode currently only swaps
`autogen.input`. The patch-trim step (reverse-patch application) will be wired
into the workflow once the first cut is validated manually; see implement.md
Phase 4.

## Module-level conditional compile (the stronger UI-cut lever)

In addition to the patch cuts above, Phase 4 should use `.mk` / `.component`
conditional compilation to stop UI / non-conversion submodules from being
compiled at all — instead of relying on LTO to drop them. This is **already
established practice** in this repo's patch (NOT a new risky technique):

- `writerperfect/Module_writerperfect.mk` gates `Library_wpftdraw` /
  `Library_wpftimpress` on `$(ENABLE_CDR)` / `$(ENABLE_ETONYEK)`, and already
  honors `ENABLE_WASM_STRIP_BASIC_DRAW_MATH_IMPRESS` / `ENABLE_WASM_STRIP_CALC`.
- `xmlsecurity/Module_xmlsecurity.mk` wraps `UIConfig_xmlsec` and
  `AllLangMoTarget_xsc` in `$(if $(DISABLE_GUI),,)` — i.e. UI config and l10n
  are NOT built when `DISABLE_GUI` is set.
- `svx/util/svxcore.component` removes the `<optional/>` tag (component
  registration metadata, not C++ logic).

Pattern to apply for conversion-only: wrap UI submodule targets in
`sc/Module_sc.mk`, `sd/Module_sd.mk`, etc. with `$(if $(DISABLE_GUI),,)` (or
the existing `ENABLE_WASM_STRIP_*` flags), so `sc/source/ui`, `sd/source/ui`
do not compile/link/register under DISABLE_GUI. This keeps UI code out of
`soffice.wasm` deterministically, not by LTO luck.

> NOTE: this is **build metadata** (`.mk`/`.component`), NOT C++ implementation
> logic (`.cxx`/`.hxx`). The task's "do not modify C++ source" constraint
> applies to the latter; modifying the former is in-scope and is the
> established trim method. See design.md §5 and §6 (cognitive discipline).

