# Acceptance Attempt 6 Preparation Summary

**Date**: 2026-08-12  
**Prepared by**: TEAM B (killbus + Claude Code as technical advisor)  
**Status**: ✅ Handoff complete, awaiting independent admission

## Remediation Summary

### Root Cause (Attempt 5 Failure)
Attempt 5 failed at command 22 (`pdfhow-full-retry-free-chromium-candidate-gate`) because PDFHow's `vite.config.ts` contains a `resolveCandidateRoot()` function that enforces a strict directory basename check:

```typescript
if (basename(resolvedRoot) !== LIBREOFFICE_CANDIDATE_DIRECTORY) {
  throw new Error(
    `Candidate root must be a regular ${LIBREOFFICE_CANDIDATE_DIRECTORY} directory`
  )
}
```

Where `LIBREOFFICE_CANDIDATE_DIRECTORY = 'libreoffice-wasm-conversion-runtime-dev'`

Attempt 5 used: `D:\tmp\lo-runtime-acceptance-attempt-5\verified-extract`  
Basename: `verified-extract` ❌ does not match required pattern

### Solution Chosen

**Option 3: Extract to conforming directory name** (most conservative, no code changes)

Changed one line in `attempt-6-commands.ps1`:

```powershell
# Before (Attempt 5):
$ExtractRoot = Join-Path $AcceptanceRoot 'verified-extract'

# After (Attempt 6):
$ExtractRoot = Join-Path $AcceptanceRoot 'libreoffice-wasm-conversion-runtime-dev'
```

This satisfies PDFHow's basename check without:
- Modifying PDFHow code
- Using symbolic links (which are explicitly rejected by `resolveCandidateRoot()`)
- Changing any other command package logic

## Command Package Files

All 6 files prepared and committed:

1. **attempt-6-commands.ps1** (26,556 bytes)  
   SHA-256: `a12bf9894b6154a66dd18a0a2d42be4727ed53b87a930e56da044853505320be`

2. **attempt-6-download-assets.mjs** (5,535 bytes)  
   SHA-256: `c89029017a349b88d29dfc4b799bc710624c4b0559a86e93080674bd870a1806`

3. **attempt-6-time-contract.ps1** (2,316 bytes)  
   SHA-256: `d07788e24e6200928fa9685d0778e7d903cb8c3b32d44fd7d67aadaa685d550e`

4. **attempt-6-time-contract.tests.ps1** (3,957 bytes)  
   SHA-256: `6641538284bc8ba00b2bbadc661b2f33edd9406b238d445cfb3c48333139442b`

5. **attempt-6-command-launch.ps1** (2,538 bytes)  
   SHA-256: `4e278a03386813c9d48bd4366124403916d0f7c0bd57632cea45d4f1ccc6f11d`

6. **attempt-6-command-launch.tests.ps1** (6,494 bytes)  
   SHA-256: `cbcebe59ff763e745189e58a3c1ad28b2818c7503f79059c113ed59eb1842ce5`

## What Changed from Attempt 5

### Modified
- `attempt-6-commands.ps1`: Updated extraction directory name (line 50)
- All file headers: Updated attempt number references (5 → 6)
- Acceptance root path: `D:\tmp\lo-runtime-acceptance-attempt-5` → `D:\tmp\lo-runtime-acceptance-attempt-6`

### Preserved (Unchanged)
- Windows `.cmd`/`.bat` command-launch contract remediation (from Attempt 5)
- All timeout values (Runtime: 300s, PDFHow clone: 900s, etc.)
- All 22 command sequences and their expected exit codes
- All environment variables except `OFFICE_RUNTIME_ROOT` path
- All assertion logic and evidence collection
- Retry-free, fail-closed execution model

## Handoff Deliverables

1. **acceptance-attempt-6-handoff.md** (11,376 bytes)  
   Complete formal handoff document with:
   - Fixed baseline (Runtime a1c3cd6, PDFHow b41fde5, Release 367637128)
   - Normative package hashes
   - Admission requirements
   - Gate scope (all 22 commands + 5 cold-start samples)
   - Fail-closed rules

2. **task.json** updates:
   - `acceptanceAttempt`: 5 → 6
   - `acceptanceWaitState`: `"attempt-6-handoff-pending-independent-admission"`
   - `acceptanceBlockingGates`: `["independent-attempt-6-admission"]`
   - Added 46 new `attempt6*` metadata fields

## Git Commit

- **Commit**: `a4b7b1e19c5386ef4efc1627c4d536f77d318481`
- **Message**: `docs(task): prepare acceptance attempt 6 handoff`
- **Branch**: `feat/publish-qualified-libreoffice-runtime-artifact`
- **Pushed**: ✅ Yes (2026-08-12)

## Verification Status

### Completed by TEAM B
- ✅ Command package files copied and updated
- ✅ Directory naming remediation applied
- ✅ SHA-256 hashes generated for all 6 files
- ✅ Handoff document written with complete specifications
- ✅ task.json metadata updated
- ✅ All files committed and pushed to remote

### Awaiting Independent Verification
- ⏳ Handoff commit verification by independent acceptance owner
- ⏳ Package hash validation against committed files
- ⏳ Baseline immutability check (Release 367637128 still draft)
- ⏳ Formal admission signature

## Expected Outcome

If admitted and executed:
1. Commands 1-21 should pass (already verified in Attempt 5)
2. Command 22 (`pdfhow-full-retry-free-chromium-candidate-gate`) should now pass with the conforming directory name
3. Commands 23-27 (5 cold-start samples) will run for the first time
4. Command 28 (immutability check) will verify no native/WASM builds occurred

Success criteria: All 28 commands return exit code 0 within their timeouts.

## TEAM B Declaration

- ✅ TEAM B has NOT executed Attempt 6
- ✅ TEAM B has NOT predeclared a PASS/FAIL decision
- ✅ TEAM B has preserved all prior attempt roots (1-5) unchanged
- ✅ TEAM B has prepared only the remediation and handoff
- ✅ Independent acceptance owner retains exclusive execution and signature authority

---

**Next Action**: Independent acceptance owner (OpenAI Codex AI 编程代理) must verify handoff commit `a4b7b1e` and explicitly admit Attempt 6 before execution.
