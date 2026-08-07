# Cached LibreOffice Patch-Stack Replay

> Executable contract for replaying reviewed LibreOffice patches over Actions-cached source without deleting expensive build outputs.

## Scenario: Replay an ordered patch stack over cached source

### 1. Scope / Trigger

Use this contract whenever `build/build-wasm.sh` reuses a LibreOffice Git worktree that may contain both an applied patch stack and ignored build outputs under `workdir/`.

### 2. Signatures

```bash
patch_file_state <patch-path>
apply_pending_patch <patch-path>
reset_patched_source <active-patch>...
RESET_PATCHED_SOURCE=1 build/build-wasm.sh
```

`CLEAN_BUILD=1` also implies source reset. Patch helpers live in `build/patch-stack.sh` and operate in the current LibreOffice Git worktree.

### 3. Contracts

- `patch_file_state` writes exactly one state: `applied`, `pending`, or `inconsistent`.
- `applied` requires a reverse dry-run with `--reverse --force --batch --fuzz=0` to succeed. `--force` is mandatory because GNU patch may otherwise cancel reverse mode after a failed probe and test the patch forward.
- `pending` requires the strict forward dry-run to succeed after the reverse probe fails.
- A missing patch, partial application, mixed hunks, or failure of both probes is `inconsistent`.
- Only `pending` may call `apply_pending_patch`; `inconsistent` must stop the build.
- Active patches are ordered: baseline first, then feature atoms. A later atom may make a whole-baseline reverse probe inconsistent, so cached tracked source is reset before replay.
- `reset_patched_source` runs `git reset --hard HEAD`, then `git clean -fd`, then removes only exact safe paths created by active patches. It must never run broad `git clean -fdx` because ignored `workdir/` is the expensive cache.
- The workflow removes `wasm/soffice.*` before compilation so an early failure cannot upload checked-in LFS outputs as if they were fresh.

### 4. Validation & Error Matrix

| Condition | Required result |
|---|---|
| Strict reverse probe succeeds | `applied`; do not apply again |
| Reverse fails and strict forward succeeds | `pending`; apply once and recheck as `applied` |
| Both probes fail or patch is missing | `inconsistent`; return non-zero |
| Reset finds an absolute or parent-traversing created path | Return non-zero before targeted clean |
| Reset completes | Tracked source clean, patch-created ignored paths absent, ignored `workdir/` retained |
| Build fails before producing WASM | No `wasm/soffice.*` artifact is available for upload |

### 5. Good / Base / Bad Cases

- Good: cache contains the full old stack and `workdir/`; reset preserves `workdir/`, restores tracked HEAD, and replays every active patch in order.
- Base: pristine source classifies the first patch as `pending`; each dependent atom becomes `pending` only after its predecessors apply.
- Bad: infer baseline state from one whole-patch reverse check after later atoms changed overlapping files, then reapply the baseline.
- Bad: use broad `git clean -fdx` to normalize source and delete the expensive ignored build cache.

### 6. Tests Required

- Real mini-Git regression: pristine to `pending`, apply to `applied`, revert one hunk to `inconsistent`.
- Reset regression: remove an ignored patch-created file while preserving a simulated ignored `workdir/` output.
- Pinned-source integration gate: apply the complete ordered stack, prove the overlapping baseline becomes `inconsistent`, reset, and replay the stack a second time.
- Workflow structure: assert `RESET_PATCHED_SOURCE=1` and stale WASM removal occur before `build/build-wasm.sh`.

### 7. Wrong vs Correct

#### Wrong

```bash
if patch --reverse --batch --dry-run < "$patch_path"; then
    echo applied
else
    patch --forward < "$patch_path"
fi
```

This collapses partial and pending states and allows GNU patch to cancel reverse mode during the probe.

#### Correct

```bash
state="$(patch_file_state "$patch_path")"
case "$state" in
    applied) : ;;
    pending) apply_pending_patch "$patch_path" ;;
    inconsistent) return 1 ;;
esac
```

Normalize cached tracked source first, retain ignored build outputs, and replay only a reviewed ordered stack.
