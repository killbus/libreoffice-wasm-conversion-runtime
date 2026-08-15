# Downstream PDFHow browser-gate evidence

Captured: 2026-08-10 (Asia/Shanghai)

## Source task

The downstream validation was performed in:

```text
D:\Repositories\pdfhow.com-next\.trellis\tasks\
  08-09-validate-project-owned-libreoffice-runtime-artifact
```

Relevant records are `prd.md`, `design.md`, `research/preflight.md`, and
`research/browser-candidate-gate.md`. The candidate was consumed from an ignored
test-only overlay; PDFHow production dependency/Vite/lockfile state was not
changed.

## Browser identity

- Candidate ID:
  `21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b`
- Native/wrapper identity and all eight hashes match
  `research/artifact-provenance.md`.
- Native mode: `lok-convert-document-v1`, schema `1`, `main-script` pthread,
  external worker `null`.
- Candidate Chromium result: **2 passed (3.3m)**.
- Installed Matbee control result: **2 passed (3.2m)**.
- Playwright retries were not used to conceal candidate behavior.

## Functional and lifecycle evidence

The final full candidate run produced valid `%PDF-` output for:

| Case | PDF bytes | Duration |
|---|---:|---:|
| Generated DOCX | 14,670 | 940 ms |
| Same-Worker reuse | 14,670 | 83 ms |
| Hash-pinned `test.docx` | 651,789 | 3,824 ms |
| Legacy DOC | 11,445 | 79 ms |
| Valid conversion after malformed input | 14,670 | 59 ms |
| Custom-font conversion | 14,670 | 312 ms |
| Valid conversion after cancellation/restart | 14,670 | 1,257 ms |

Additional evidence:

- `crossOriginIsolated === true` and `SharedArrayBuffer` was available;
- successful calls emitted hidden-native-path evidence with
  `hidden=1 visible-frame-setup-entered=0`;
- no diagnostic entered visible-frame setup;
- the healthy second conversion reused the first conversion Worker;
- malformed input remained bounded and a following valid conversion recovered;
- cancellation/restart/disposal paths terminated all three Workers they created;
- profile restart and runtime disposal behavior passed;
- no standalone `soffice.worker.js` existed or was requested.

## Network and MIME evidence

The browser requested exactly four unique runtime network assets. Type
declarations, `loader.cjs`, and Node glue are package/runtime files but are not
browser network requests for this path.

| Requested asset | MIME | Bytes |
|---|---|---:|
| `browser.worker.global.9cababb37ce81ca8.js` | `text/javascript` | 122,735 |
| `soffice.0c18483bdf23a83e.js` | `text/javascript` | 439,517 |
| `soffice.b24a888550d27d29.wasm` | `application/wasm` | 148,022,311 |
| `soffice.c4b8a92b566d4e0d.data` | `application/octet-stream` | 99,735,790 |

All returned HTTP 200 with the expected MIME and uncompressed
`Content-Length`; no request failed or came from a Service Worker. Worker
`responseBodySize` was treated as observational because Chromium can report
zero/negative cache-adjusted values for Worker/importScripts traffic.

## Reliability observation that remains open

The first focused candidate run after enabling transfer capture completed all
four HTTP transfers and reached native `event=abi-enter`, but did not return
within the 180-second conversion bound. The gate disposed the runtime and
failed. It did not retry inside the test, patch the artifact, or trigger a native
build.

An immediate clean focused rerun passed (`1 passed (3.8m)`), and the full run
then passed (`2 passed (3.3m)`). The timeout did not reproduce. It is therefore
not proof of a deterministic defect, but it is real production-qualification
evidence and must remain visible.

## Consequence for independent acceptance

A single successful browser gate is insufficient for publication. Acceptance
must:

1. download the draft release through GitHub into a fresh path;
2. verify/extract it without reusing TEAM B staging or the prior overlay;
3. materialize only non-runtime test control metadata around those downloaded
   exact bytes;
4. run the full PDFHow Chromium candidate gate with retries disabled;
5. run at least **five consecutive fresh browser/profile cold-start
   conversions**, each reported separately and with retries disabled;
6. fail qualification on any timeout or conversion failure rather than rerun
   until green;
7. retain traces/network/native-stage diagnostics for a failed sample.

The soak is an acceptance activity owned by `killbus`. TEAM B may run a
preflight soak but cannot use it as the independent receipt.

## Production boundary

Passing the browser candidate gate proves compatibility of this exact byte set
with PDFHow's real Worker/network/isolation model. It does not itself:

- make the ignored overlay release-qualified;
- publish an immutable project-owned artifact;
- update PDFHow production dependency identity;
- verify production build output/headers;
- remove the installed Matbee rollback boundary.

Those cutover actions remain a separate follow-up task after this public
artifact release passes independent acceptance.

## Non-formal Google Chrome temporary-profile diagnostic

Captured from JSON records generated at `2026-08-13T18:06:39Z` and `2026-08-13T18:22:07Z`. This is **NOT ACCEPTANCE EVIDENCE**; no Attempt 8 formal invocation was created and the admission state is unchanged.

### Protocol

- Google Chrome `145.0.7632.68`: `D:\Applications\Scoop\apps\googlechrome\current\chrome.exe`; Playwright bundled Chromium was not used.
- Each launch uses `chromium.launchPersistentContext(profilePath, ...)` with a generated `D:\tmp\lo-runtime-chrome-profile-*` directory. This is equivalent to Chrome `--user-data-dir=<temporary path>`; the normal user profile is never used.
- Per run: two independent clean profiles, then one separate profile launched as `prime`, closed, and relaunched as `cached`.
- One DOCX-to-PDF conversion per launch; retries `0`; all temporary profile roots reported `removed: true`.
- Neutral same-origin HTML fixture, COOP/COEP/CORP enabled, no scripts or remote resources.
- Runtime API: `WorkerBrowserConverter`, `pthreadWorkerMode: main-script`, no `sofficeWorkerJs`; real `tests/sample_2_page.docx` input.
- Observes import, initialization, conversion, `%PDF-`, MIME/bytes, Worker lifecycle, cleanup, cache/network hits, isolation, ABI signals, and total time.
- Runtime assets use `Cache-Control: public, max-age=3600, immutable`.

Implementation: `scripts/release-runtime/browser-profile-diagnostic.mjs`; neutral page: `tests/browser/profile-diagnostic.html`.

Full non-formal records:

```text
D:\tmp\lo-runtime-chrome-profile-diagnostic-1786644398716.json
D:\tmp\lo-runtime-chrome-profile-diagnostic-1786645326512.json
```

### Results

All eight launches imported the package, initialized, reported `crossOriginIsolated === true`, exposed `SharedArrayBuffer`, and created exactly one conversion Worker. Successful output was stable at `42,173` bytes, `application/pdf`, with `%PDF-` header.

| Run | Launch | Profile state | Init | Conversion | Total | Result | Cleanup |
|---|---|---|---:|---:|---:|---|---|
| A | clean-1 | new isolated dir | 5,251 ms | 4,492 ms | 21,935 ms | pass, 42,173-byte PDF | timed out at 10 s; forced termination |
| A | clean-2 | different new dir | 5,018 ms | timed out at 180 s | 198,202 ms | fail after `abi-enter`, no `abi-return` | timed out at 10 s; forced termination |
| A | reused-prime | new reusable dir | 5,291 ms | 4,565 ms | 21,901 ms | pass, 42,173-byte PDF | timed out at 10 s; forced termination |
| A | reused-cached | same dir after restart | 5,078 ms | timed out at 180 s | 196,958 ms | fail after `abi-enter`, no `abi-return` | timed out at 10 s; forced termination |
| B | clean-1 | new isolated dir | 3,596 ms | 3,376 ms | 18,971 ms | pass, 42,173-byte PDF | timed out at 10 s; forced termination |
| B | clean-2 | different new dir | 3,297 ms | timed out at 180 s | 194,794 ms | fail after `abi-enter`, no `abi-return` | timed out at 10 s; forced termination |
| B | reused-prime | new reusable dir | 3,602 ms | 4,543 ms | 19,731 ms | pass, 42,173-byte PDF | timed out at 10 s; forced termination |
| B | reused-cached | same dir after restart | 3,572 ms | 3,874 ms | 18,994 ms | pass, 42,173-byte PDF | timed out at 10 s; forced termination |

Cached launches made only two server-side runtime requests (`soffice.data` and `soffice.wasm`); smaller JS/Worker resources came from the reused Chrome profile cache. Cold/prime launches made five server-side runtime requests. Large assets were not eliminated, and these two rounds do not support a reliable cached conversion speedup.

### Retained observations

1. Direct Chrome package resolution and initialization are repeatable: all eight launches initialized within `3.3-5.3` seconds.
2. Native conversion is not yet repeatable. Both second clean-profile samples reached `abi-enter` and exceeded 180 seconds. The reused cached sample failed in run A but passed in run B. No test-level retry hid these failures.
3. `destroy()` did not resolve within 10 seconds in any sample. Successful conversions logged `'PThread' was not exported`; the harness then terminated the Worker, leaving Worker accounting at created `1`, terminated `1`.
4. A preliminary run against `examples/browser-demo.html` is excluded from timing comparison because that page started its own external-pthread converter and requested remote fonts, causing a second WASM load and page navigation interference. The neutral fixture tightens, rather than relaxes, isolation.
5. These observations retain non-deterministic native-return and cleanup defects as open qualification risks. They do not authorize formal acceptance, publication, or an Attempt 8 invocation.

### PDFHow shortest-path consumer reference

The separate `pdfhow.com-next` local-`file:` package smoke reached the real consumer entry and completed once in a clean browser run (`1 passed (2.9m)`). Package payload identity matched the runtime; initialization took `11,828 ms`; the conversion request took `13,052 ms`; runtime conversion reported `1,220 ms`; output was a valid `14,670`-byte `%PDF-`. Cleanup showed the same `'PThread' was not exported` signal and required forced Worker teardown after a 3-second grace period. This remains non-formal consumer evidence only.
## Non-formal follow-up: cleanup remediation and process isolation — 2026-08-13

This follow-up supersedes only the interpretation of the earlier `destroy()` timeout. It remains **NOT ACCEPTANCE EVIDENCE**: Attempt 8 protocol work stayed paused, no formal invocation marker was created, no formal script ran, retries remained `0`, and no native/WASM build was started.

### Cleanup root cause and remediation

The browser Worker destroy path and `LibreOfficeConverter` both read `module.PThread` directly. The current Emscripten glue exposes that name as a throwing getter because `PThread` was not exported, so the getter aborted before the Worker could acknowledge destroy. `src/emscripten-pthread.ts` now checks the property descriptor before reading it and terminates exported pthread pools only when they are safely available. The helper is used by `src/browser.ts`, `src/browser.worker.ts`, and `src/converter.ts`.

After this wrapper-only remediation, successful Chrome samples reported cleanup resolved in `7-122 ms`, Worker accounting `created=1 / terminated=1`, `forced=0`, and zero occurrences of the exact `'PThread' was not exported` diagnostic. The temporary profile roots still reported `removed: true`. Representative post-fix record:

```text
D:\tmp\lo-runtime-chrome-profile-diagnostic-1786651251499.json
```

This fixes acknowledgement/teardown after a returned conversion. It does not make a Worker recoverable while its native conversion call itself remains blocked; those failed samples still require forced Worker termination after the conversion and cleanup time bounds.

### Cache/cooldown and independent-process isolation

A `15,000 ms` inter-launch cooldown changed which sample failed but did not remove the failure: clean-1 passed, clean-2 timed out after `hidden-path`, reused-prime passed, and reused-cached passed. Without cooldown, clean-2 and reused-cached timed out. Therefore cooldown/cache warmth is not a remediation.

```text
D:\tmp\lo-runtime-chrome-profile-diagnostic-1786649879657.json
D:\tmp\lo-runtime-chrome-profile-diagnostic-1786650837726.json
```

Three additional diagnostics each ran in a separate Node process with its own dev server, Chrome process, and temporary clean profile; each process performed one DOCX-to-PDF request and then exited. Results were fail/pass/fail:

| Record | Init | Conversion | Result | Cleanup/profile |
|---|---:|---:|---|---|
| `1786651774926` | 4,684 ms | 180 s bound | `abi-enter`, `hidden-path`, no `abi-return` | forced; profile removed; residual Chrome `0` |
| `1786651973921` | 3,856 ms | 3,010 ms | pass, 42,173-byte `%PDF-` | resolved 7 ms; forced `0`; profile removed |
| `1786651985596` | 3,531 ms | 180 s bound | `abi-enter`, `hidden-path`, no `abi-return` | forced; profile removed; residual Chrome `0` |

Full records:

```text
D:\tmp\lo-runtime-chrome-profile-diagnostic-1786651774926.json
D:\tmp\lo-runtime-chrome-profile-diagnostic-1786651973921.json
D:\tmp\lo-runtime-chrome-profile-diagnostic-1786651985596.json
```

This excludes reused Chrome profile state, residual Chrome processes, and repeated launches in one Playwright/Node process as the primary cause. The retained reliability observation is now narrower: the runtime/native conversion bridge can non-deterministically fail to return even in a single clean-profile launch in an otherwise isolated process.

### Native-stage localization and prepared diagnostics

Static inspection places `event=hidden-path` after the load/export try/catch, including the synchronous `XStorable::storeToURL` call. Between that event and outer `event=abi-return`, the native path still performs:

1. `nativeConversionCleanup(xComponent)`, preferring `XCloseable::close(true)` and otherwise `dispose()`;
2. result status classification;
3. JSON serialization and result allocation;
4. return-time destruction of `nativeConvertDocumentImpl` locals, including UNO references and the Solar mutex guard;
5. return through the private C ABI wrapper.

The current artifact therefore proves only that the stall is post-export/control-flow and pre-ABI-return; existing logs cannot yet distinguish cleanup from serialization/allocation or return-time destruction. The bridge patch now contains minimal non-formal stage markers for cleanup query/close/dispose, result serialization/allocation, `cleanup-call-return`, and `impl-return-ready`. A source-structure test locks their ordering. These markers are prepared source only and are not present in the current WASM bytes; activating them requires a distinct native build, which was intentionally not started here.

Low-cost regression status:

- native bridge/source/path plus browser pthread/quarantine and Emscripten cleanup tests: `6` files, `45` tests passed;
- patch-stack test: `1` test passed;
- `pnpm typecheck`: passed;
- `git diff --check`: passed apart from the previously observed Trellis line-ending warning before this append.

Existing tests cover cleanup contract semantics, result decoding, quarantine, pthread mode, and successful same-runtime reuse. They do not establish repeated independent-process return reliability. The next meaningful runtime experiment is therefore one non-formal Chrome run against a newly built artifact carrying the stage markers; another PDFHow smoke against unchanged native bytes would add little diagnostic value and must not be interpreted as formal acceptance.

### Non-formal marker-build follow-up (2026-08-14)

This follow-up is **NOT ACCEPTANCE EVIDENCE**. Attempt 8 formal preparation and protocol extension remained paused; `attempt8FormalInvocationCreated=false`, no formal invocation marker was created, and every conversion used `retries=0`.

The minimal native-stage instrumentation was built from isolated diagnostic branch `diagnostic/native-post-export-stages-20260813`, commit `066a90d41d2bcd42bc75b85d711a9e2b465149ba` (one commit ahead of `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`). GitHub Actions run `31746236333` (`build-wasm.yml`, `conversion-only`, `clean_build=false`, `use_conversion_autogen=false`) completed successfully in `3h31m6s`. Artifact `soffice-wasm-conversion-only-31746236333` contained the cleanup, serialization, allocation, implementation-return, and ABI-return markers.

Three independent Node/Chrome processes then each used Google Chrome `145.0.7632.68`, a distinct temporary `--user-data-dir`, one DOCX-to-PDF request, and no retry. All three passed:

| Record | Init | Conversion | PDF | Cleanup / Worker |
|---|---:|---:|---:|---|
| `1786670624089` | 3,605 ms | 2,968 ms | 42,173 bytes, `%PDF-` | resolved 9.86 ms; `1/1/0` |
| `1786671308743` | 2,912 ms | 2,563 ms | 42,173 bytes, `%PDF-` | resolved 7.47 ms; `1/1/0` |
| `1786671539793` | 3,045 ms | 3,570 ms | 42,173 bytes, `%PDF-` | resolved 14.02 ms; `1/1/0` |

Each successful conversion emitted the full native sequence from `abi-enter` through `hidden-path`, cleanup close/return, result serialization/allocation, `impl-return-ready`, and `abi-return`. Each temporary profile was removed and no forced Worker termination was needed.

A subsequent clean-plus-reused-profile matrix did reproduce the intermittent failure:

```text
D:\tmp\lo-runtime-chrome-profile-diagnostic-1786671910390.json
```

| Launch | Profile state | Init | Conversion/result | Last native marker | Cleanup |
|---|---|---:|---|---|---|
| `clean-profile-1` | new isolated dir | 2,929 ms | pass in 2,909 ms; 42,173-byte PDF | `abi-return` | resolved 24.34 ms; forced `0` |
| `reused-profile-prime` | first launch of reusable dir | 2,800 ms | timed out at 180 s | `abi-enter` only | timed out at 10 s; forced `1` |
| `reused-profile-cached` | same dir after restart | 2,583 ms | pass in 3,115 ms; 42,173-byte PDF | `abi-return` | resolved 10.75 ms; forced `0` |

The matrix profile root `D:\tmp\lo-runtime-chrome-profile-7KnBmw` reported `removed=true`. The cached launch made server requests only for `soffice.data` and `soffice.wasm`, while the prime launch requested the complete runtime asset set. The cached launch succeeded, so neither profile reuse nor cache warmth is a sufficient cause or remediation.

Most importantly, the failed prime launch stopped at `abi-enter` and never emitted `hidden-path`. It therefore does **not** implicate `XCloseable::close(true)`, result serialization/allocation, return-time local destruction, or JS cleanup. It broadens the retained observation: separate failures have occurred both before and after `hidden-path`, while identical-byte clean and cached launches can pass. The next native diagnostic should add minimal markers inside the `abi-enter` to `hidden-path` load/export span rather than concentrating only on cleanup.

After analysis, the marker artifact was removed from the working tree and the pre-run candidate was restored from `D:\tmp\lo-wasm-before-run-31746236333`. SHA-256 matched for all four files:

```text
soffice.cjs  0C18483BDF23A83E9AB1D180FC8D3C850F6CD57A42E4E1CDA545E25C512940A5
soffice.js   0C18483BDF23A83E9AB1D180FC8D3C850F6CD57A42E4E1CDA545E25C512940A5
soffice.data C4B8A92B566D4E0D4723D321EF926E1B9FBEB575D28CDD6466D27FD2C17C5514
soffice.wasm B24A888550D27D2942FF9C8C9A84E20CD0C852DB154E8558647CB9C5294FF291
```

### Non-formal PDFHow consumer and pre-hidden-stage follow-up (2026-08-14)

**NOT ACCEPTANCE EVIDENCE.** Attempt 8 protocol/formal work stayed paused; `attempt8FormalInvocationCreated=false`; no invocation marker; `retries=0` for every conversion.

PDFHow consumed `@matbee/libreoffice-converter = file:..\libreoffice-wasm-conversion-runtime` from its actual office-conversion entry in Google Chrome `145.0.7632.68`. Installed/source `dist/browser.js` SHA-256 matched (`ca5980054419e9709967d92f0389f41267f161ea37d3bc1807a1845e22e6d843`). Each launch used a temporary `--user-data-dir`; `crossOriginIsolated=true` and `SharedArrayBuffer` were observed.

| PDFHow sample | Package / entry | Init / conversion | Output | Cleanup / total |
|---|---|---|---|---|
| `174421` | 25.30 / 570,183.95 ms | 36,526.87 / 1,444.98 ms pass | 14,670-byte `%PDF-`, `application/pdf` | 13.71 ms, workers `1/1`, 608,475.81 ms; old 600 s outer timeout fired after success/report |
| `175620` | 11.36 / 241,542.82 ms | init unobserved; request timeout 180,006.21 ms | none | cancel `1`, 3,012.28 ms, workers `1/1`, 424,696.09 ms, no native marker |
| `180954` | 9.39 / 148,530.07 ms | 11,561.25 ms; request timeout 180,009.67 ms after 168,445.79 ms observed conversion | none | cancel `1`, 3,008.09 ms, workers `1/1`, 331,725.34 ms, last marker `abi-enter` |

The smoke outer timeout is now 15 minutes; its independent 180-second conversion bound, cancellation, disposal, and structured report are unchanged. Biome and Playwright discovery passed for the smoke; full PDFHow typecheck retains unrelated existing failures.

GitHub Actions run `31777106194` (`b690e67ef157a046a08f94a1598bb50cd5614ecb`) ended `failure`: WASM build/upload succeeded; the post-build converter gate passed 2/3 and its unsupported-output error-path test timed out at 60 s. Artifact SHA-256:

```text
soffice.cjs  B14801141873C185CC37DE17A3B7D89B2F3D729CAD9B554A97FFE5BDF7A0D30D
soffice.js   B14801141873C185CC37DE17A3B7D89B2F3D729CAD9B554A97FFE5BDF7A0D30D
soffice.data 7BDF0477F9782575DD1BFAC98DE59688651244CD06804950DB0B20B5B8B3557E
soffice.wasm 797270FAB0AB3778F87098FB796D19E7CC446ABA512816D67BFD91A9B43F9AAF
```

| Artifact launch | Init | Conversion/output | Last marker | Cleanup |
|---|---:|---|---|---|
| clean | 5,087.10 ms | 4,921.22 ms pass; 42,173-byte `%PDF-` | `abi-return` | resolved 30.37 ms; forced `0` |
| reused prime | 4,343.53 ms | timeout 180 s; none | `cleanup-close-enter` | timeout 10,013.92 ms; forced `1` |
| reused cached | 3,705.16 ms | 4,444.38 ms pass; 42,173-byte `%PDF-` | `abi-return` | resolved 10.32 ms; forced `0` |

The prime failure completed load/export and `hidden-path`, then stopped inside synchronous `XCloseable::close(true)` after `cleanup-close-enter`, without `cleanup-close-return`. Identical-byte clean/cached launches passed, so reuse/cache warmth is neither sufficient cause nor remediation. Along with PDFHow's init-only and `abi-enter` stalls, failures are non-deterministic across multiple stages.

The matrix root and three Playwright profiles were removed; no Chrome process referenced them. The diagnostic artifact was removed and pre-run hashes restored/verified:

```text
soffice.cjs  0C18483BDF23A83E9AB1D180FC8D3C850F6CD57A42E4E1CDA545E25C512940A5
soffice.js   0C18483BDF23A83E9AB1D180FC8D3C850F6CD57A42E4E1CDA545E25C512940A5
soffice.data C4B8A92B566D4E0D4723D321EF926E1B9FBEB575D28CDD6466D27FD2C17C5514
soffice.wasm B24A888550D27D2942FF9C8C9A84E20CD0C852DB154E8558647CB9C5294FF291
```

#### Local unsupported-output gate correction (2026-08-14)

**NOT ACCEPTANCE EVIDENCE.** Attempt 8 protocol/formal work remained paused; `attempt8FormalInvocationCreated=false`; no invocation marker was created.

The sole failure in run `31777106194` was traced to public `convertDocument()` creating the Node subprocess/WASM runtime before deterministic format validation. `src/index.ts` now rejects unknown output formats and invalid declared input/output paths before converter creation. A focused test mocks `createSubprocessConverter` and proves it is not called for either `docx -> mp3` or `pdf -> docx`.

Local verification:

- `pnpm typecheck`: passed;
- `pnpm build`: passed;
- `tests/convert-document-validation.test.ts`: 2/2 passed, test body 6 ms;
- filtered original gate `rejects an unsupported output format with ConversionError`: passed in 11 ms (2 success-path tests skipped);
- built `dist/index.js` returned `ConversionError` / `UNSUPPORTED_FORMAT` for `docx -> mp3` in 220.89 ms including module import;
- `git diff --check`: passed, with only the pre-existing Trellis CRLF-to-LF warning.

No GitHub Actions rerun is claimed here because the correction is currently local and uncommitted. The existing two successful conversion-path tests from run `31777106194` are unchanged; this correction is limited to preventing deterministic request errors from entering unstable native initialization/cleanup paths.

#### Pre-validation build/gate follow-up (2026-08-14)

**NOT ACCEPTANCE EVIDENCE.** Attempt 8 protocol extension and formal preparation remained paused; no Attempt 8 invocation marker was created. This records diagnostic CI only and does not replace the independent PDFHow acceptance path.

The correction was committed on `diagnostic/native-prevalidation-gate-fix-20260814` as `488554990ffd2f4242ccb8cec92a9c8e976faf16`. GitHub Actions run `31802763221` completed successfully. After a fresh LibreOffice WASM build, `tests/converter-gate.test.ts` passed `3/3` tests in `10.16 s` (`9.42 s` test time). Produced files were reported as `430K` `soffice.cjs`, `430K` `soffice.js`, `96M` `soffice.data`, and `142M` `soffice.wasm`.

Artifact `soffice-wasm-conversion-only-31802763221` was uploaded as ID `9226250528`, compressed size `78,835,433` bytes, digest `sha256:3ec19a72e575c3d9daaa4cb94132f6f8297f969f306e0fd1a341e4cedd2afca4`, expiring `2026-08-28T16:25:00Z`. Downloading it is not required to establish API-layer pre-validation; exact-byte inspection or a Chrome run specifically against this native output would require it, but no such browser claim is made here.

The same two-file API change was cleanly backported from `origin/main` base `a1c3cd6` to `fix/prevalidate-conversion-options-20260814` as `d4234463e0b4a2fa284d0c4f8181b48d33fa0690`. Frozen-lockfile install, typecheck, focused tests (`2` files / `3` tests), package build, and `git diff --check` passed on that branch. No additional WASM build is required for the backport.

#### Pre-validation merge closure (2026-08-14)

**NOT ACCEPTANCE EVIDENCE.** PR `#2` was merged with merge commit `6c1ad6fbe615870ed23856cdddaff408c5d65cf3`; its second parent is the reviewed backport `d4234463e0b4a2fa284d0c4f8181b48d33fa0690`. Main CI run `31829699733` passed. Both automatically triggered Release runs passed (`31829699766`, push; `31829838418`, workflow-run), and each explicitly reported that local `main` was behind the separately configured upstream repository, so no new version was published. No Build WASM workflow was triggered by the merge; the latest such run remains the previously completed manual run `31802763221`. Attempt 8 protocol/formal work remained paused and no invocation marker was created.

#### PDFHow conversion call-path audit (2026-08-15)

**NOT ACCEPTANCE EVIDENCE.** No new browser invocation or Attempt 8 marker was created. A current-tree audit confirmed that PDFHow's DOCX-to-PDF smoke enters its product-owned `createOfficeConversionRuntime()` entry, selects `createMatbeeOfficeToPdfEngine`, imports `@matbee/libreoffice-converter/browser`, and calls `WorkerBrowserConverter.convert()` with `outputFormat: 'pdf'`. The worker's non-image branch delegates to `BrowserConverter.convert()`, which creates a native conversion request and calls `LokBindings.convertDocument()`; that binding requires `_lok_convertDocument` and `_lok_convertFree`. The legacy JS-managed `documentLoad` / `documentSaveAs` branch remains only for image export and other pointer-oriented APIs, so this finding is limited to the tested DOCX-to-PDF path.

The package bytes used by PDFHow matched the runtime worktree: `dist/browser.js` SHA-256 `ca5980054419e9709967d92f0389f41267f161ea37d3bc1807a1845e22e6d843`; `wasm/soffice.wasm` SHA-256 `b24a888550d27d2942ff9c8c9a84e20cd0c852db154e8558647cb9c5294ff291`. A source regression gate now locks the non-image worker dispatch and the `BrowserConverter` image/native branch separation. Focused no-build verification passed `tests/native-conversion-source.test.ts` and `tests/lok-native-conversion.test.ts`: `2/2` files and `23/23` tests in `889 ms`.

The retained raw records `D:\tmp\lo-runtime-chrome-profile-diagnostic-1786670624089.json`, `D:\tmp\lo-runtime-chrome-profile-diagnostic-1786671308743.json`, and `D:\tmp\lo-runtime-chrome-profile-diagnostic-1786671539793.json` were re-read directly. Each successful conversion records `abi-enter`, `hidden-path`, cleanup enter/query/close/return, result serialization/allocation, `impl-return-ready`, and `abi-return`. The earlier matrix records also document failures stopping inside the same bridge after `abi-enter`, `hidden-path`, or `cleanup-close-enter`; this is runtime evidence that the observed DOCX-to-PDF work reached the new native transaction rather than the legacy JS-managed save path.

#### PDFHow local-package consumer harness (2026-08-15)

**NOT ACCEPTANCE EVIDENCE.** Attempt 8 protocol extension and formal preparation remained paused. No Attempt 8 invocation marker was created. No production dependency cutover is claimed.

The isolated PDFHow consumer branch `test/local-libreoffice-runtime-smoke` now contains local commit `f49f800d` (`test(office): add local LibreOffice package smoke`). The original dirty PDFHow `main` worktree was not modified. The harness resolves `@matbee/libreoffice-converter` through `file:../libreoffice-wasm-conversion-runtime`, serves the package assets with WASM MIME plus COEP/COOP/CORP headers, and invokes PDFHow's product-owned `app/lib/office-conversion` entry in Google Chrome `145.0.7632.68` using Playwright temporary profiles.

Package-resolution verification passed and bound the installed package to the runtime worktree by both browser and native bytes:

- package version `2.7.2`;
- `dist/browser.js` SHA-256 `ca5980054419e9709967d92f0389f41267f161ea37d3bc1807a1845e22e6d843`;
- `wasm/soffice.wasm` SHA-256 `b24a888550d27d2942ff9c8c9a84e20cd0c852db154e8558647cb9c5294ff291`;
- `crossOriginIsolated=true`, `SharedArrayBuffer` available, and `pthreadWorkerMode=main-script`;
- cleanup retained `created=1 / terminated=1`, including timeout cancellation paths.

Observed consumer runs were mixed against unchanged runtime bytes. Successful runs produced valid `%PDF-` output through the native bridge, including a 14,670-byte PDF from the generated fixture and a 42,173-byte PDF from the self-contained two-page fixture. Subsequent clean temporary-profile runs non-deterministically stopped after `abi-enter`, after `hidden-path`, or during runtime initialization and reached the 180-second bound; cancellation still disposed the PDFHow runtime and terminated its Worker. A contemporaneous runtime-direct clean-profile diagnostic passed in 3.92 seconds conversion time with 19.5 ms cleanup and removed its explicit temporary `--user-data-dir` root.

This comparison confirms that package resolution, PDFHow entry selection, cross-origin isolation, PDF production, and cleanup can all succeed, while also reproducing the already retained native return-reliability defect. Neither changing the DOCX fixture nor using a fresh Chrome profile is a sufficient remediation. The committed PDFHow harness is therefore a consumer qualification/reproduction tool, not a green production-cutover signal; replacing the production dependency with an immutable published runtime remains contingent on closing the native return-reliability issue.

### Non-formal production `noInitialRun` repair and consumer rerun — 2026-08-15

**NOT ACCEPTANCE EVIDENCE.** `attempt8FormalInvocationCreated=false`. Attempt 8 protocol/formal preparation remained paused, no invocation marker was created, and no native/WASM rebuild ran.

The generated Emscripten lifecycle calls `onRuntimeInitialized` before conditional `main()`, and honors `Module.noInitialRun` by clearing `shouldRunNow`. The runtime now applies `noInitialRun: true` after caller configuration across the browser global/Worker loaders, direct converter loaders, Node loader, subprocess, and fork-worker paths. The focused regression set passed `6/6` files and `41/41` tests; `pnpm typecheck` passed. The normal concurrent multi-config `pnpm build` process exited on Windows with `3221226356`, while sequential execution of the same five TypeScript-only tsup configurations completed all JS/CJS/DTS outputs. No WASM/native build was invoked.

Before the production repair, automatic-main Chrome samples passed `4/8`; the diagnostic `noInitialRun` mode passed `8/8`, plus a separate calibration pass `1/1`. An independent Node conversion with `noInitialRun=true` produced a `42,173`-byte `%PDF-` in `3,658.05 ms` total (`827.01 ms` module ready, `216.71 ms` converter initialization, `1,848.32 ms` conversion, `3.24 ms` cleanup).

A post-build production Node check then imported `dist/index.js#createConverter` and the packaged `wasm/loader.cjs` without supplying `noInitialRun` from the caller. The runtime policy applied internally and produced the same `42,173`-byte `%PDF-`: initialization `1,465.64 ms`, conversion `1,945.70 ms`, cleanup resolved in `1.64 ms`, total `3,429.73 ms`. A current-tree rerun retained `6/6` focused files and `41/41` tests passing, plus `pnpm typecheck`; focused ESLint over the modern TypeScript loading paths reported `0` errors and retained `12` pre-existing non-null-assertion warnings. Legacy `.cts` lint debt and the test directory's existing ESLint/tsconfig exclusion were not changed by this repair.

The rebuilt production Worker was then run without the transformed diagnostic Worker in Google Chrome `145.0.7632.68`, retries `0`, with six fresh temporary profiles and reusable-profile prime/cached launches:

```text
D:\tmp\lo-runtime-chrome-profile-diagnostic-1786792619059.json
```

- result: `8/8` passed; each output was `42,173` bytes, `%PDF-`, `application/pdf`;
- initialization: `2,125.84-3,225.07 ms`, average `2,703.88 ms`;
- conversion: `2,265.14-3,733.36 ms`, average `2,915.88 ms`;
- cleanup: every sample resolved, maximum `52.93 ms`;
- Worker accounting: every sample `created=1 / terminated=1 / forced=0`;
- cross-origin isolation and `SharedArrayBuffer` were available; the reusable cached launch passed;
- the explicit profile root was removed (`profileCleanup.removed=true`).

PDFHow's actual `app/lib/office-conversion` entry was rerun once with the refreshed local `file:../libreoffice-wasm-conversion-runtime` snapshot and the specified Google Chrome executable. Playwright launched Chrome with a fresh temporary `--user-data-dir` and reported temporary-directory cleanup complete. Package version was `2.7.2`; installed/runtime `dist/browser.js` SHA-256 matched at `3ad578c4985751afb91339083f460c625efeef52861f26bae8de4cfd43274912`.

- package resolution: `4.32 ms`;
- entry ready: `563,856.09 ms`;
- observed initialization: `15,632.74 ms`;
- conversion request: `17,057.22 ms`; observed conversion `1,422 ms`; runtime conversion `1,421 ms`;
- output: `pdfhow-local-package-smoke.pdf`, `14,670` bytes, `%PDF-`, `application/pdf`;
- cleanup: `20.45 ms`, disposed state, workers `created=1 / terminated=1`;
- total: `581,052.62 ms`; Playwright result `1 passed` with retries `0`.

This closes the shortest-path local-package integration verification for the repaired runtime. It does not claim formal Acceptance or an immutable production dependency cutover.

### Exact tarball PDFHow consumer smoke — 2026-08-15

**NOT ACCEPTANCE EVIDENCE.** Attempt 8 remains NOT ADMITTED, formal preparation is paused, formal invocation count remains `0`, and no invocation marker or native/WASM build was created. TEAM B did not participate in this work.

The minimal `noInitialRun` source repair at runtime candidate `391e0459fd3768bcb77729fe7f2e7a9c4c810829` was combined with the already-built run `31802763221` WASM bytes and packed as the exact local npm artifact:

```text
D:\tmp\lo-runtime-pack-31802763221-noinitialrun-20260815-2148\
  matbee-libreoffice-converter-2.7.2.tgz
```

Identity:

- tarball SHA-256: `1fa8b951ee1e5c9b4b3b5d3545f651eb3e62bc37b62891e6c642f82daa07ef9c`;
- installed `dist/browser.js`: `d659415259c6e2eb3883add073a5bd9097f9e6511bbef66ddba02d49891b7948`;
- installed `wasm/soffice.wasm`: `3d0365e3d72a4e58e0267f9f4564c192585731c1402a5df6b1f55eb0b436114b`.

PDFHow consumed that exact tarball through its `package.json` `file:` dependency and executed the real `app/lib/office-conversion` entry in Google Chrome `145.0.7632.68` from `D:\Applications\Scoop\apps\googlechrome\current\chrome.exe`. Playwright used retries `0`, created a fresh `pdfhow-office-chrome-*` user-data directory, and removed it after the run. COOP/COEP/CORP handling was effective: `crossOriginIsolated=true` and `SharedArrayBuffer` was available.

Result: `1 passed (4.0m)`. The DOCX conversion returned `pdfhow-local-package-smoke.pdf`, `14,670` bytes, `%PDF-`, `application/pdf`. Timings were package resolution `1,235.91 ms`, Chrome launch `769.27 ms`, entry readiness `212,697.87 ms`, observed initialization `12,774.60 ms`, request `14,259.41 ms`, observed conversion `1,482.32 ms`, runtime conversion `1,482 ms`, runtime/Worker cleanup `3,027.95 ms`, profile deletion `332.05 ms`, and total `232,447.08 ms`.

Lifecycle state after `dispose()` was `ready=false`, `stage=disposed`, `active=false`, `conversions=1`, `cancellations=0`, `disposals=1`; Worker accounting was `created=1 / terminated=1`. The explicit temporary profile path was absent after cleanup.

Retained non-formal observation: after successful PDF output and `lok_destroy`, browser teardown emitted `PThread was not exported`, `pageerror: unreachable`, and a forced Worker teardown after the 3,000 ms grace period. This does not invalidate package resolution or conversion output, but graceful destroy is not clean. The next session should isolate this browser destroy/PThread path in a runtime-owned focused test, repair it without rebuilding WASM unless source facts prove that necessary, and then run one final PDFHow consumer smoke. Do not resume Attempt 8 protocol expansion or formal preparation as part of that diagnosis.

## 2026-08-15 browser teardown source diagnosis and repaired exact-package verification

This section supersedes the retained teardown observation above for the repaired JS wrapper. It remains non-formal diagnostic evidence only: Attempt 8 is still NOT ADMITTED, no formal invocation marker was created, and no native/WASM rebuild was run.

### Source-level diagnosis

The consumed tarball `1fa8b951...` still contained two direct reads of the generated Emscripten `Module.PThread` accessor:

1. `LibreOfficeConverter.destroy()` / runtime quarantine cleanup in the bundled converter;
2. the browser Worker `handleDestroy()` path after `lok_destroy`.

The exact generated `soffice.js` installs a throwing accessor when `PThread` is not included in `EXPORTED_RUNTIME_METHODS`. The old consumer trace emitted exactly two `PThread was not exported` aborts after `lok_destroy`, matching those two wrapper-level reads. This localizes the defect to the TypeScript/JS lifecycle wrapper rather than the native conversion bridge or WASM payload.

The minimal repair centralizes cleanup in `src/emscripten-pthread.ts`. It inspects the own-property descriptor first and returns without invoking a getter-only unexported runtime accessor; when `PThread` is genuinely exported, it still calls `terminateAllThreads()` and best-effort terminates/clears exported worker collections. `src/browser.ts`, `src/browser.worker.ts`, and `src/converter.ts` use that helper. The startup policy remains `noInitialRun: true`.

Focused Vitest verification passed: 4 files / 20 tests (`emscripten-pthread`, `emscripten-startup-policy`, browser pthread worker mode, and browser worker quarantine). `pnpm build` rebuilt only the JS/TypeScript dist; `build:wasm` was not run.

### Runtime-owned exact-artifact Chrome matrix

A temporary staged package combined the prebuilt run `31802763221` WASM payload with the repaired JS dist:

```text
D:\tmp\lo-runtime-teardown-fixed-20260815-2255b
```

Identity:

- `wasm/soffice.wasm`: `3d0365e3d72a4e58e0267f9f4564c192585731c1402a5df6b1f55eb0b436114b` (unchanged from run `31802763221`);
- `dist/browser.js`: `3ad578c4985751afb91339083f460c625efeef52861f26bae8de4cfd43274912`;
- `dist/browser.worker.global.js`: `81373779181e3de63727f736394fdec1ffab9a7009a144b7559ca93604d1288f`.

Google Chrome `145.0.7632.68` ran one clean temporary profile and two launches against one reused profile (prime and cached), with zero conversion retries. Report:

```text
D:\tmp\lo-runtime-chrome-profile-diagnostic-1786805575531.json
```

All three samples produced a valid 42,173-byte `%PDF-` document, used `crossOriginIsolated=true` / `SharedArrayBuffer=true`, resolved graceful destroy within the 3,000 ms bound, recorded Worker `created=1 / terminated=1 / forced=0`, emitted no page error, and removed the temporary profile root.

| profile sample | initialization | conversion | graceful cleanup | total |
| --- | ---: | ---: | ---: | ---: |
| clean | 2,328.74 ms | 2,336.62 ms | 6.27 ms | 6,095.41 ms |
| reused prime | 2,233.18 ms | 3,047.50 ms | 13.85 ms | 6,707.24 ms |
| reused cached | 2,312.18 ms | 2,244.75 ms | 6.89 ms | 5,748.54 ms |

The runtime-owned matrix therefore confirms the prior teardown failure was deterministic wrapper behavior in the old bundle, not an unresolved intermittent native/WASM failure.

### Final PDFHow exact-package smoke

The repaired local package is:

```text
D:\tmp\lo-runtime-teardown-fixed-pack-20260815-2300\
  matbee-libreoffice-converter-2.7.2.tgz
```

Identity:

- tarball: `7a5e676f51b36c732e2c68a3290ec177ff3ebe2c21b373aa61c8d54633357693`;
- installed `dist/browser.js`: `3ad578c4985751afb91339083f460c625efeef52861f26bae8de4cfd43274912`;
- installed `wasm/soffice.wasm`: `3d0365e3d72a4e58e0267f9f4564c192585731c1402a5df6b1f55eb0b436114b`.

PDFHow consumed that exact tarball through `package.json` `file:` resolution and its real `app/lib/office-conversion` entry. The single retry-free Google Chrome smoke passed in `2.8m` and produced `pdfhow-local-package-smoke.pdf`, 14,670 bytes, `%PDF-`, `application/pdf`.

Timings: package resolution `884.75 ms`, Chrome launch `596.78 ms`, entry readiness `151,831.37 ms`, initialization `7,834.20 ms`, request `8,789.37 ms`, observed conversion `951.89 ms`, runtime conversion `952 ms`, graceful runtime/Worker cleanup `30.48 ms`, profile deletion `336.51 ms`, and total before profile deletion `162,245.21 ms`.

Final lifecycle state was `ready=false`, `stage=disposed`, `active=false`, `conversions=1`, `cancellations=0`, `disposals=1`; Worker accounting was `created=1 / terminated=1`. The temporary Chrome profile was removed. No `PThread was not exported`, `unreachable`, forced Worker teardown, or page-error line appeared after `lok_destroy done`.

Disposition: the shortest-path package resolution, initialization, conversion, PDF output, graceful cleanup, and timing verification is complete for this repaired non-formal candidate. Formal publication/Acceptance work remains paused and requires separate Attempt 8 admission.

### Continuation-session scoped verification and landing boundary

On 2026-08-15, the retained source state was rechecked without rebuilding WASM or repeating the expensive PDFHow Chrome smoke. Scoped `git diff --check` passed for the Trellis/runtime repair files and for the four PDFHow integration files. A focused Vitest run passed `7/7` files and `39/39` tests: API pre-validation, native-ready retry classification, shared `noInitialRun` policy, guarded PThread cleanup, browser pthread worker mode, Worker quarantine, and native-conversion source routing.

The verified runtime JS lifecycle repair was committed as `8d51562a12d9754300b58a6e8b94ba1f7808a5c1` (`fix(runtime): harden Emscripten lifecycle`). Two earlier commit attempts were not executed because the approval service returned transient rate-limit/stream-disconnect errors; the unchanged third attempt succeeded. The exact pre-commit staged diff is retained at `D:\tmp\libreoffice-runtime-lifecycle-staged-20260815.patch`, SHA-256 `1c97311ea7beed0c056eaa708c995ee4d0304670ef7b060ec9398c07bb902b0e`.

The PDFHow `package.json` currently identifies the exact temporary local tgz under `D:\tmp`. That state is valid retained non-formal consumer evidence but is not a production dependency cutover. The temporary `file:` dependency and unrebuilt native/WASM experiment remain outside the runtime lifecycle commit boundary. Attempt 8 remains not admitted and unstarted, with formal invocation count `0` and no invocation marker.

### Remaining worktree classification after lifecycle landing

The lifecycle repair is now committed independently. The remaining runtime dirty state is not part of that verified package cut:

- `src/index.ts` plus `tests/convert-document-validation.test.ts` reproduce the separately committed pre-validation fix `d423446`; duplicating it on this branch is deferred to normal branch integration.
- `build/patches/wasm-native-conversion-bridge.patch`, `tests/native-conversion-source.test.ts`, and the generated `wasm/soffice.*` files belong to an unrebuilt native diagnostic experiment. They are not qualified by the exact run `31802763221` package result and are not included in the lifecycle commit.
- `dev-server.mjs`, `scripts/release-runtime/browser-profile-diagnostic.mjs`, and `tests/browser/profile-diagnostic.html` are retained one-off diagnostic assets. The script's historical transformed `no-initial-run` comparison is no longer a production prerequisite now that the startup policy is committed.

The PDFHow Vite and smoke changes remain useful consumer evidence, but their package declaration points to a temporary `D:\tmp` tgz and the smoke is hash-bound to this candidate. Generalizing that harness is a new consumer source change and would require its own rerun. It is therefore deferred rather than represented as a permanent production landing in this non-formal task phase.
