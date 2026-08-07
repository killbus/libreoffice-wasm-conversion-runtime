import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function resolveBashExecutable(): string {
  if (process.platform !== 'win32') {
    return 'bash';
  }

  const gitExecPath = execFileSync('git', ['--exec-path'], {
    encoding: 'utf8',
  }).trim();
  const bashPath = resolve(gitExecPath, '../../..', 'bin', 'bash.exe');
  if (!existsSync(bashPath)) {
    throw new Error(`Unable to locate Git Bash from ${gitExecPath}`);
  }
  return bashPath;
}

const helperPath = fileURLToPath(
  new URL('../build/patch-stack.sh', import.meta.url)
);

const gateScript = String.raw`#!/usr/bin/env bash
set -euo pipefail

base="$1"
helper="$2"
if command -v cygpath >/dev/null 2>&1; then
    base="$(cygpath -u "$base")"
    helper="$(cygpath -u "$helper")"
fi
repo="$base/repo"
patch_file="$base/change.patch"
mkdir -p "$repo"
cd "$repo"

git init -q
git config user.email patch-stack@example.invalid
git config user.name patch-stack-test
printf 'ignored-created.txt\nworkdir/\n' > .gitignore
printf 'base\n' > tracked.txt
git add .gitignore tracked.txt
git commit -qm baseline
mkdir -p workdir
printf 'expensive-cache\n' > workdir/cache.bin

cat > "$patch_file" <<'PATCH'
--- a/tracked.txt
+++ b/tracked.txt
@@ -1 +1 @@
-base
+patched
--- /dev/null
+++ b/ignored-created.txt
@@ -0,0 +1 @@
+created
PATCH

# shellcheck source=../build/patch-stack.sh
source "$helper"
assert_patch_state() {
    local expected="$1"
    local actual
    actual="$(patch_file_state "$patch_file")"
    if [ "$actual" != "$expected" ]; then
        printf 'Expected patch state %s, got %s\n' "$expected" "$actual" >&2
        return 1
    fi
}

assert_patch_state pending
apply_pending_patch "$patch_file" >/dev/null
assert_patch_state applied

# One hunk reverted and one still applied must never be reapplied fuzzily.
git checkout -- tracked.txt
assert_patch_state inconsistent

reset_patched_source "$patch_file" >/dev/null
test "$(cat tracked.txt)" = base
test ! -e ignored-created.txt
test -f workdir/cache.bin
assert_patch_state pending
`;

describe('patch stack helper', () => {
  it('fails hard on partial state and resets source without deleting workdir', () => {
    const base = mkdtempSync(join(tmpdir(), 'lo-patch-stack-'));
    const scriptPath = join(base, 'gate.sh');
    writeFileSync(scriptPath, gateScript, 'utf8');

    try {
      const result = spawnSync(
        resolveBashExecutable(),
        [scriptPath, base, helperPath],
        {
          cwd: dirname(helperPath),
          encoding: 'utf8',
          stdio: 'pipe',
        }
      );
      expect(
        result.status,
        `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`
      ).toBe(0);
      expect(result.stdout).toBe('');
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});