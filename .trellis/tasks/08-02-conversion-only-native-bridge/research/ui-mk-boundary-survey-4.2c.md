# 4.2c .mk UI-subdir boundary survey (sc + sd)

Goal: which `sc/source/ui/*` and `sd/source/ui/*` subdirs can be **dropped from
compilation** in conversion-only mode (lever ②: `.mk` conditional compile)
without breaking `docx→pdf` / `xlsx→pdf` / `pptx→pdf` (the gate).

Findings are from local LO tree `946c5d226` (full `wasm-build-fixes.patch` on
tip `d1c9e0e4e`). No GHA build triggered — this is source-level forensics.

## Critical context: why the existing ENABLE_WASM_STRIP_* gates do NOT fire

Our `autogen.input` has `--enable-wasm-strip` and `--with-main-module=all`.
The `.mk` gates use `$(if $(ENABLE_WASM_STRIP_*),,target)`. Two layers:

1. **C macros** (`AC_DEFINE`, `configure.ac:3230+`): `ENABLE_WASM_STRIP_ACCESSIBILITY`
   etc. are defined unconditionally inside the `enable_wasm_strip` block. These
   gate `#ifdef` in `.cxx`, **not** `.mk` targets.
2. **makefile vars** (`AC_SUBST`): `ENABLE_WASM_STRIP`, `_WRITER`, `_CALC`,
   `_BASIC_DRAW_MATH_IMPRESS`, `_CANVAS` are the `.mk`-visible vars.
   - `_BASIC_DRAW_MATH_IMPRESS` / `_CANVAS` require `with_main_module != "all"` → empty in our build.
   - `_CALC` (and the `ENABLE_WASM_STRIP_ACCESSIBILITY` makefile var, which
     `config_host.mk.in:234` aliases to `_CALC`) only set when
     `with_main_module = writer`. → empty in our build.

**Result**: in `all` mode, the `.mk` `ENABLE_WASM_STRIP_*` gates all take the
"build it" branch. Verified empirically in 4.2a wasm: `AccessibleDrawDocumentView`
(8), `AccessibleSlideSorterView` (5), `AccessiblePageShape` (3),
`sd/source/ui/accessibility` (12) — all present and == baseline.

**Conclusion**: 4.2c cannot lean on existing `ENABLE_WASM_STRIP_*` gates in
all-mode. We must add our own gates. `--disable-gui` (already set) gives us
`DISABLE_GUI` as a ready makefile var → use `$(if $(DISABLE_GUI),,target)`.

## Library coupling (the hard constraint)

`sc/Library_scfilt.mk` (the xlsx/dif/excel filters — conversion-critical)
**links `sc`** (`gb_Library_use_libraries scfilt ... sc`) and its sources
`#include <docsh.hxx>` (lives at `sc/source/ui/inc/docsh.hxx`) from 10+ filter
files. `docsh.hxx` in turn includes `docuno.hxx` (`sc/inc/docuno.hxx`, shared).
The `ScModelObj` (UNO doc model, `sc/source/ui/unoobj/docuno.cxx`, 191KB) is
the LOK document interface impl — `init.cxx` load path casts via
`SfxBaseModel`.

→ **Cannot drop `sc/source/ui/docshell` or `sc/source/ui/unoobj`.** These are
load-bearing for conversion. Same shape for sd: `sd/source/ui/docshell` and
`sd/source/ui/unoidl` KEEP.

## sc/source/ui subdir classification

From `sc/Library_sc.mk` source list + `gb_Library_use_libraries`:

| subdir | cxx (approx) | class | rationale |
|---|---|---|---|
| `app` | ~9 | KEEP | app init / ScModule, filter registration touches it |
| `docshell` | 6 | **KEEP** | ScDocShell — filter `#include <docsh.hxx>` |
| `unoobj` | ~60 | **KEEP** | ScModelObj = LOK doc iface; init.cxx load path |
| `view` | ~40 | CUT | view/scroll/input dispatch — pure editor UI |
| `drawfunc` | ~20 | CUT | drawing tools / mouse funcs |
| `attrdlg` | ~15 | CUT | format dialogs |
| `cctrl` | ~5 | CUT | chart content control UI |
| `condformat` | ~20 | CUT | conditional format dialog UI (keep core condformat in core/data) |
| `dbgui` | ~15 | CUT | database range dialog UI |
| `dialogs` | ~40 | CUT | misc dialogs |
| `formdlg` | ~10 | CUT | form dialog UI |
| `miscdlgs` | ~30 | CUT | misc dialogs |
| `namedlg` | ~10 | CUT | named range dialog UI |
| `navipi` | ~10 | CUT | navigator panel |
| `pagedlg` | ~10 | CUT | page format dialog |
| `sidebar` | ~15 | CUT | sidebar panels |
| `sparklines` | ~5 | CUT | sparkline UI (keep sparkline data in core) |
| `theme` | ~5 | CUT | theme dialog UI |
| `uitest` | ~5 | CUT | uitest helpers |
| `undo` | ~30 | CUT (risky) | undo stack — conversion may need minimal undo? **PENDING-VERIFY** |
| `xmlsource` | ~3 | CUT | XML source panel UI |
| `dataprovider` | ~10 | CUT (risky) | data provider UI; core data provider may be needed **PENDING-VERIFY** |

`sc/source/core/*` (data + tool) and `sc/source/filter/*` (in `Library_scfilt`):
**KEEP all** — these are the conversion engine.

`UIConfig_scalc` + `AllLangMoTarget_sc` + `Package_res_xml` in `Module_sc.mk`:
CUT (dialog resources + l10n; `xmlsecurity` already gates its UIConfig on
DISABLE_GUI — same pattern).

## sd/source/ui subdir classification

From `sd/Library_sd.mk`:

| subdir | cxx | class | rationale |
|---|---|---|---|
| `docshell` | 6 | **KEEP** | DrawDocShell — load-bearing |
| `unoidl` | 18 | **KEEP** | UNO doc model for sd |
| `accessibility` | 12 | CUT | a11y (already gated by ENABLE_WASM_STRIP_ACCESSIBILITY, but that var is empty in all-mode — re-gate on DISABLE_GUI) |
| `animations` | 6 | CUT | animation UI (keep animation data in core) |
| `annotations` | 3 | CUT | annotation UI |
| `app` | 9 | KEEP (risky) | sd module init **PENDING-VERIFY** |
| `controller` | 2 | CUT | controller UI |
| `dlg` | 47 | CUT | dialogs (sdui lib) |
| `framework` | 0 | — | (uses .hxx-only? verify) |
| `func` | 59 | CUT (risky) | slide/shape functions; some may be export-path **PENDING-VERIFY** |
| `presenter` | 5 | CUT | presenter console |
| `remotecontrol` | 11 | CUT | remote control (bluetooth/wifi) |
| `sidebar` | 17 | CUT | sidebar |
| `slideshow` | 6 | CUT (risky) | slideshow engine — **PENDING-VERIFY** (pptx→pdf may not need, but check) |
| `slidesorter` | 0 | — | (gated elsewhere?) |
| `table` | 3 | CUT | table UI |
| `tools` | 10 | KEEP (risky) | sd tools — likely shared **PENDING-VERIFY** |
| `uitest` | ~5 | CUT | uitest |
| `view` | 67 | CUT (risky) | view; some draw view needed for export? **PENDING-VERIFY** |

`sd/source/core/*` + `sd/source/filter/*`: **KEEP all** (pptx/odp export engine).

## Estimated volume lever

If the CUT rows above are gated out under `DISABLE_GUI`, the removed .cxx
count is roughly:
- sc: ~265 cxx across view/drawfunc/*dlg/sidebar/navipi/...
- sd: ~170 cxx across dlg/sidebar/remotecontrol/presenter/accessibility/animations/table/view...

This is the **actual** size lever (vs 4.2a's -66KB). Order of magnitude: tens
of MB of compiled code → single-digit MB of wasm after LTO/strip. **PENDING
build to confirm** — do not promise a number before a green GHA run.

## Patch shape proposal (quilt/series, per agreed convention)

```
build/patches/
├── wasm-trim-lok-exports-conversion-only.patch      (existing atom)
├── wasm-trim-lok-shims-conversion-only.patch        (existing atom)
├── wasm-trim-ui-sc-conversion-only.patch            (NEW 4.2c: sc .mk gates)
├── wasm-trim-ui-sd-conversion-only.patch            (NEW 4.2c: sd .mk gates)
└── series                                           (NEW: apply order)
```

Each ui-* patch gates one module's UI subdirs with `$(if $(DISABLE_GUI),,target)`
and is independently reversible for bisection. PENDING-VERIFY rows are split
into their own atoms or applied last with a fallback.

## Open questions to resolve before triggering GHA

1. `sc/source/ui/undo` — does conversion path need any undo? (test: gate out,
   if gate red, re-add.)
2. `sc/source/ui/dataprovider` — core data provider vs UI. (test: gate out.)
3. `sd/source/ui/func` / `view` / `slideshow` — which funcs are on the
   pptx→pdf export path? Need grep of `sd/source/filter/eppt` includes.
4. `sd/source/ui/app` — is SdModule init needed for filter registration?

These drive whether a subdir is a clean CUT or a PENDING-VERIFY bisection
candidate. Resolve by `#include` forensics in the filter dirs before building.

## #include forensics results (convergence pass)

### sd side — resolved PENDING-VERIFY

- `sd/source/filter` and `sd/source/core` include **zero** `sd/source/ui/<subdir>/`
  headers directly (grep returned 0 for func/view/slideshow/app/tools/controller/
  framework/sidebar).
- **BUT** transitive symbol coupling exists:
  - `sd/source/filter/grf/sdgrffilter.cxx:231` does
    `dynamic_cast<DrawViewShell*>(mrDocShell.GetViewShell())` and includes
    `<DrawViewShell.hxx>`/`<ViewShellBase.hxx>` (in `sd/source/ui/inc/`).
    `sdgrffilter` = **graphic export** (PNG/SVG/JPG) — that IS conversion
    (`exportAsImage`). → needs RTTI/vtable of `DrawViewShell` → needs the
    `.cxx` body compiled. **`sd/source/ui/view` is LINK-coupled** to the
    graphic-export path; cannot drop entirely.
  - `sd/source/core/undo/undoobjects.cxx` includes `<ViewShell.hxx>`/
    `<ViewShellBase.hxx>`. `core/undo` is KEEP (it is core, not ui/undo),
    and its coupling to `ViewShell` is for RTTI casts.
- `sd/source/ui/app/sdmod*.cxx` (SdModule = `SD_MOD`) is **KEEP**: pptx export
  `sd/source/filter/eppt/pptx-epptooxml.cxx:1971` calls
  `SD_MOD()->GetNumberFormatter()`. `SdModule` is in `sd/source/ui/app/`.
  → `sd/source/ui/app` is mixed (ScModule + input UI); **KEEP whole subdir**.
- `sd/source/ui/tools/EventMultiplexer` is used only by other `ui/*` subdirs
  (view/annotations/animations/table/framework/slidesorter), not by core/filter.
  → `sd/source/ui/tools` is CUT-safe **only if** all its consumers are also
  cut; otherwise keep. Since view/slidesorter stay (view is link-coupled),
  tools is risky. **Demote to: KEEP (conservative) — its 10 cxx are small.**
- `sd/source/ui/slideshow`, `func`, `view`: no direct include from core/filter,
  but `view` is link-coupled via grf filter's RTTI. `slideshow`/`func` have no
  external consumer in the link graph (only used within `ui/*`). →
  **`slideshow` CUT-safe; `func` CUT-safe; `view` PARTIAL (keep minimal subset
  for grf RTTI, cut the rest — too fiddly for a first atom, so KEEP view whole
  in v1, revisit).**

### sc side — resolved PENDING-VERIFY + new finding

- `sc/source/filter` / `sc/source/core` include **zero** `sc/source/ui/<subdir>/`
  headers directly. **BUT** symbol coupling is worse than sd:
  - `sc/source/core/data/table1.cxx:497,535` calls
    `ScTabViewShell::notifyAllViewsSheetGeomInvalidation(...)` — a **static
    method** with body in `sc/source/ui/view/tabvwshc.cxx`. Guarded at runtime
    by `ScDocShell::GetViewData()` (null in headless) but **link-time
    unresolved** if `ui/view` dropped. → `sc/source/ui/view` is LINK-coupled
    to `core/data`.
  - `sc/source/core/data/patattr.cxx:830`,
    `sc/source/filter/excel/xestream.cxx:1070` also `dynamic_cast<ScTabViewShell*>`.
  - `sc/source/filter/oox/workbookfragment.cxx:592` calls `SC_MOD()->...`
    → `sc/source/ui/app/scmod.cxx` (ScModule) is **KEEP**.
- `sc/source/ui/app/scmod.cxx` `#include <inputhdl.hxx>`/`<inputwin.hxx>` →
  `sc/source/ui/app` is **mixed** (ScModule + input UI). **KEEP whole subdir.**
- `sc/source/ui/undo`: no `#include` from core/filter. The undo API used by
  core (`IsUndoEnabled`/`EnableUndo`) is defined in `sc/source/ui/docshell/`
  (KEEP), not in `ui/undo`. `ui/undo/*` are editor undo action bodies. →
  **`sc/source/ui/undo` CUT-safe** (26 cxx).
- `sc/source/ui/dataprovider`: only consumer is `miscdlgs/dataproviderdlg.cxx`
  (UI). No core dataprovider in `sc/source/core`. → **CUT-safe together with
  `miscdlgs`** (6 cxx + its UI consumer).
- `sc/source/ui/unoobj/docuno.cxx` (ScModelObj, 191KB) is **KEEP** (LOK doc
  interface, load path). 10+ filter files `#include <docuno.hxx>` (via
  `sc/inc/docuno.hxx`, shared header — header stays, body stays).

## Revised classification (post-forensics)

### sc/source/ui — KEEP (link-coupled or load-bearing)
- `app` (ScModule, mixed) — `SC_MOD` used by oox filter
- `docshell` — filter `#include <docsh.hxx>`
- `unoobj` — ScModelObj = LOK doc iface
- `view` — `ScTabViewShell::notifyAllViewsSheetGeomInvalidation` static body
  called from `core/data/table1.cxx`; RTTI casts in core/filter. **v1: keep
  whole subdir** (minimal-subset split is fiddly; revisit in v2)

### sc/source/ui — CUT-safe (no core/filter link dep, no external consumer)
- `undo` (26), `dataprovider` (6) + `miscdlgs` (41, its consumer),
  `drawfunc` (27), `attrdlg` (5), `cctrl` (6), `condformat` (7),
  `dialogs` (3), `formdlg` (3), `namedlg` (4), `navipi` (4), `pagedlg` (6),
  `sidebar` (8), `sparklines` (4), `theme` (1), `uitest` (1), `xmlsource` (1),
  `dbgui` (32)
- Module-level: `UIConfig_scalc`, `AllLangMoTarget_sc`, `Package_res_xml`
  (gate on DISABLE_GUI, mirror xmlsecurity pattern)

### sd/source/ui — KEEP
- `app` (SdModule = SD_MOD, pptx export uses it; mixed)
- `docshell` — load-bearing
- `unoidl` — UNO doc model
- `view` — grf filter RTTI-coupled (`DrawViewShell`); v1 keep whole
- `tools` — consumed by view (which stays); conservative keep

### sd/source/ui — CUT-safe
- `accessibility` (12), `animations` (6), `annotations` (3), `controller` (2),
  `dlg` (47), `presenter` (5), `remotecontrol` (11), `sidebar` (17),
  `slideshow` (6), `func` (59), `table` (3), `uitest` (1)
- Module-level: `UIConfig_sdraw`, `UIConfig_simpress`, `AllLangMoTarget_sd`

## Revised cut volume estimate (v1, conservative)

- sc CUT-safe cxx: 26+6+41+27+5+6+7+3+3+4+4+6+8+4+1+1+1+32 = **~185 cxx**
  (view's 84 stay in v1)
- sd CUT-safe cxx: 12+6+3+2+47+5+11+17+6+59+3+1 = **~172 cxx**
  (view's 67 + tools 10 stay in v1)
- **Total ~357 cxx dropped** (down from 435 estimate, because view/tools
  stay in v1). Still the actual size lever; LTO/strip effect TBD by build.

## v1 atom plan (conservative — drop only clean CUT-safe subdirs)

```
build/patches/
├── wasm-trim-lok-exports-conversion-only.patch      (existing)
├── wasm-trim-lok-shims-conversion-only.patch        (existing)
├── wasm-trim-ui-sc-conversion-only.patch            (NEW: gate sc CUT-safe subdirs)
├── wasm-trim-ui-sd-conversion-only.patch            (NEW: gate sd CUT-safe subdirs)
└── series                                           (NEW: apply order)
```

Each ui-* patch wraps the relevant `gb_Library_add_exception_objects` entries
in `$(if $(DISABLE_GUI),, ... )` and gates the `UIConfig`/`AllLangMoTarget`
targets in `Module_*.mk`. **v1 does NOT touch `view`/`tools`/`app`/`docshell`/
`unoobj`/`unoidl`** — those stay compiled. If v1 is green, v2 can attempt the
fiddlier `view` minimal-subset split.

## Remaining risk for v1 (to accept, not pre-solve)

- `sc/source/ui/app` is mixed (ScModule + input UI). Keeping the whole subdir
  means input UI (`inputhdl`/`inputwin`) still compiles. That is acceptable
  for v1 — it's a small subset.
- `sd/source/ui/view` (67 cxx) is the biggest single chunk staying. If v1's
  size win is disappointing, v2 targets this with a minimal-subset atom
  (keep only `tabvwshc.cxx` + the RTTI targets, cut the other 66).
- Module-level `UIConfig` gating may hit `fs-image` cross-deps (design §3.1
  risk). If gate red on fs-image, revert just the UIConfig lines, keep subdir
  cuts.
