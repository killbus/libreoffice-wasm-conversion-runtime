# Acceptance Attempt 7 implementation-to-independent-acceptance handoff

## Admission state

- Acceptance Attempt 7: **NOT ADMITTED**
- eligible: `false`
- started: `false`
- formal invocation count: `0`
- decision: `null`
- new formal root: `D:\tmp\lo-runtime-acceptance-attempt-7`
- formal root exists: `false`
- admission scope, if independently granted later: one retry-free formal execution and independent PASS/FAIL signature

TEAM B prepared the command-package remediation, the isolated diagnostic and the consistency audit only. TEAM B did not execute or admit Attempt 7 and does not predeclare PASS or FAIL.

No Chromium candidate gate, cold-start sample, conversion command, or final invariance gate was run during this remediation.

The independent acceptance owner must verify the committed and pushed handoff from a separate clean checkout and separately persist the exact statement `Acceptance Attempt 7: ADMITTED` before any formal command is invoked.

## Attempt 6 immutable closure

Acceptance Attempt 6 remains permanently **CLOSED / FAIL**:

- failure command index: `22`
- failure stage: `pdfhow-full-retry-free-chromium-candidate-gate`
- formal invocation count: `1`
- browser tests started: `false`
- cold starts run: `0`
- formal retry performed: `false`
- post-failure manual rerun occurred: `true`
- formal root contaminated after failure: `true`
- post-failure results admissible: `false`

The failure was a command-package/PDFHow preparation integration defect. Attempt 6 passed the Release extraction directly to PDFHow, but PDFHow requires its fixed-checkout helper to materialize `third_party/libreoffice-wasm-conversion-runtime-dev` with `LOCAL-CANDIDATE-METADATA.json`, `SHA256SUMS` and `package.json`. Command 22 failed before web-server/browser startup because that prepared local candidate did not exist.

`D:\tmp\lo-runtime-acceptance-attempt-6` remains historical failed/then-contaminated evidence and must not be repaired, cleaned, reused, rerun, supplemented or backfilled.

## Attempt 7 remediation

After fresh Release download, archive identity/hash verification, safe extraction and exact archive inventory verification, the formal package now:

1. invokes the official fixed-checkout helper `scripts/prepare-libreoffice-runtime-candidate.mjs`;
2. supplies the verified archive extraction as distinct native and wrapper source roots;
3. writes only to `pdfhow-repository/third_party/libreoffice-wasm-conversion-runtime-dev`;
4. requires the generated `LOCAL-CANDIDATE-METADATA.json`, `SHA256SUMS` and `package.json`;
5. verifies exact metadata keys, exact source keys, exact eight-runtime-file inventory, byte sizes, SHA-256 values, package contract, ABI, schema, provenance, pthread mode, `releaseQualified: false` and the frozen candidate ID;
6. supplies the prepared local candidate root to the unchanged PDFHow gate.

The formal runner remains single-pass, retry-free and fail-closed. Network retries are permitted only in diagnostics before admission and do not permit retries in the formal runner.

## Targeted pre-admission diagnostic

Classification: **targeted pre-admission diagnostic**  
Evidence status: **not acceptance evidence**

Persisted report:

- `acceptance-attempt-7-targeted-pre-admission-diagnostic.json`
- successful isolated root: `D:\tmp\lo-runtime-targeted-pre-admission-diagnostic-20260813-01`
- generated at: `2026-08-13T01:58:16.680Z`
- passed: `true`

The diagnostic verified only this minimal invariant:

```text
fresh Release bytes
→ prepare-libreoffice-runtime-candidate.mjs
→ LOCAL-CANDIDATE-METADATA.json
→ SHA256SUMS
→ package.json
→ exact inventory
→ PDFHow resolver success
```

Observed successful chain:

- fresh archive asset ID `508126614`, `248934231` bytes;
- archive SHA-256 `e9aac8dde2fb627251155fc97651c2bd35bec63b01e39f882d342c024a87de9a`;
- exact archive inventory: eight runtime files plus `ASSET-SHA256SUMS` and `CANDIDATE-MANIFEST.json`;
- a fresh isolated remote clone checked out exactly at PDFHow commit `b41fde5db9829ede7e6e217de6ac12c2b475b7fc`;
- official helper success at the required PDFHow `third_party` destination;
- exact prepared inventory: eight runtime files plus the three required control files;
- prepared candidate ID `21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b`;
- actual `resolveLibreOfficeRuntimeCandidate()` success from the pinned PDFHow checkout;
- resolver returned the expected local-candidate identity and four browser static asset roles.

The successful diagnostic did not create the Attempt 7 formal root and recorded:

- formal attempt started: `false`;
- formal invocation count: `0`;
- Chromium gate run: `false`;
- cold starts run: `0`;
- conversion run: `false`;
- final invariant gates run: `false`.

### Diagnostic retry disclosure

All roots below are diagnostic-only and are not acceptance evidence:

- `20260812-01`: failed because the diagnostic harness compared equivalent checksum objects with inconsistent property order;
- `20260812-02`: a later diagnostic-only run generated at `2026-08-13T01:47:41.466Z` used the obsolete `.ts` CommonJS top-level-await resolver runner and failed before resolver success;
- `20260812-03`: helper and inventory passed, then the diagnostic TSX runner used CommonJS top-level-await mode;
- `20260812-04`: helper and inventory passed, then the resolver runner still required the `.mts` ESM extension;
- `20260812-05`: passed the complete targeted chain and remains historical diagnostic evidence only;
- `20260813-01`: the current authoritative fresh-remote-clone rerun passed the complete targeted chain and produced the persisted report listed above.

These retries are permitted diagnostic retries. None was a formal Acceptance invocation, and no failed formal directory was repaired or rerun.

## Pre-admission identity, schema, state and handoff audit

The local audit command is:

```powershell
node .trellis/tasks/08-10-publish-qualified-libreoffice-runtime-artifact/acceptance/attempt-7-pre-admission-audit.mjs
```

Its persisted report is `acceptance-attempt-7-pre-admission-audit.json`. The report is also **not acceptance evidence**. It verifies:

- exact command-package SHA-256 identity;
- fixed Runtime/PDFHow/candidate/Release/archive identity consistency;
- prepared-candidate schema/control-file contract presence;
- no stale Attempt 5/6 copy-forward identity in the Attempt 7 package;
- Attempt 7 remains NOT ADMITTED, unstarted, invocation count zero and decision null;
- `D:\tmp\lo-runtime-acceptance-attempt-7` is absent;
- this handoff contains the same state, identity, classification and hashes.

## Fixed baseline

- Runtime checkout: `a1c3cd6d6d2dd25fab063539e9fe40fbb327b846`
- PDFHow checkout: `b41fde5db9829ede7e6e217de6ac12c2b475b7fc`
- frozen candidate ID: `21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b`
- Release ID: `367637128`
- Release tag: `runtime-artifact-21fcdfd7e9f49efc08c6ba56c13337cc0be59a9b496f5424adbe57e0fb4a6e7b`
- Release target: `df3f73c789e6d2abf71cbcd75186118d2bbc795a`
- required Release state: draft, unpublished, `releaseQualified: false`
- archive SHA-256: `e9aac8dde2fb627251155fc97651c2bd35bec63b01e39f882d342c024a87de9a`
- native commit: `71d33678ed74872ebbb1bc37f5778143f8f5e401`
- native workflow run: `31211473147`
- native ABI/schema: `lok-convert-document-v1` / `1`
- pthread mode: `main-script`; external worker: `null`

## Immutable formal command package SHA-256

- `attempt-7-commands.ps1`: `9ce7db401d3e15f24350acbadc43950ea1621c4e53ea8cf8b25493715e1ff028`
- `attempt-7-download-assets.mjs`: `6cd10dbc733d0cd3b9b1c65e8287ca476e835609c0113c8d8694e109227fbaf5`
- `attempt-7-time-contract.ps1`: `3f63a41cf8f5a0c488f07bed5a6c1b61f46f3a77827b22b79dcb339c9ca14e34`
- `attempt-7-time-contract.tests.ps1`: `ca1e5a33b36517254b258eb35659c7858dec2f7072cd942b318c806f9a513fdb`
- `attempt-7-command-launch.ps1`: `61ea15a71d720c128dfa4095896753d098f435844135d4adbec788c2e6faa21f`
- `attempt-7-command-launch.tests.ps1`: `067ed89937d9afc05e124e1c0fa53d8d5066dfcc17e7db3ae92ae3cb37cb8e7a`
- `attempt-7-prepare-candidate.tests.mjs`: `7816e3ad96f8c93a94715a236932e66179365d2660511d734af9a39a604e4a5f`
- `attempt-7-verify-prepared-candidate.mjs`: `dc493ed4f05c67df1dfb47ce043d7973dd38e8aa5fd095a59ec8e3a2bd701e10`

## Diagnostic artifact SHA-256

- `targeted-pre-admission-diagnostic-archive-to-pdfhow.mjs`: `171fe9740afff51c0dbdc69521d59f786c5640cb3b595a34a1c453801500bd19`
- `acceptance-attempt-7-targeted-pre-admission-diagnostic.json`: `5a833bcc172a4c4ff959dc6d3212d25cba3f72b0513862de6caacbab983ca105`

## Formal command inventory after admission

The formal runner contains 33 fail-closed command records:

| Commands | Purpose |
|---|---|
| 1 | Windows `.cmd`/`.bat` launch contract |
| 2 | PowerShell timestamp contract |
| 3-11 | fresh Runtime/PDFHow clones, fixed checkouts and remote-ref verification |
| 12 | preflight no-new-native/WASM-build assertion |
| 13-14 | Release identity/download and archive verification/extraction |
| 15 | PDFHow official preparation-helper contract test |
| 16 | official helper materializes the local candidate |
| 17 | prepared candidate schema/inventory/package verification |
| 18-23 | Runtime install/build and repository/CLI/Node gates |
| 24-25 | PDFHow install and Chromium binary setup |
| 26 | full retry-free Chromium candidate gate |
| 27-31 | five independent retry-free cold starts |
| 32 | final no-new-build assertion |
| 33 | final Release/asset immutability assertion |

The table is descriptive only. TEAM B has not executed these commands.

## Invocation prohibited until independent admission

Only after independent admission, from a separate clean checkout of the committed handoff, may the independent owner invoke exactly once:

```powershell
Set-Location <fresh-handoff-checkout-root>
pwsh -NoLogo -NoProfile -File .trellis/tasks/08-10-publish-qualified-libreoffice-runtime-artifact/acceptance/attempt-7-commands.ps1 -PinnedDocxFixture <absolute-pinned-DOCX-path> -AcceptanceRoot D:\tmp\lo-runtime-acceptance-attempt-7
```

The pinned DOCX must have SHA-256 `a78495545ae41486aa61c9a0e8c4c78f6491a8e7b3cfacbd4185ed0f124f59df`.

Any nonzero exit, timeout, assertion failure, crash or missing evidence closes Attempt 7 immediately. Formal retry, rerun, continuation, replacement, supplementation and backfill are forbidden. A monitoring/transport `stream disconnected` may be retried only for observation and never authorizes a second formal invocation.

## TEAM B declaration

TEAM B preserved Attempt 6 as CLOSED / FAIL, performed only the isolated targeted diagnostic and package-consistency work described above, and prepared this NOT ADMITTED handoff. TEAM B did not execute Attempt 7, did not create its formal root, did not run the Chromium/cold-start/conversion/final-invariant gates, did not admit the attempt and did not predeclare its decision.