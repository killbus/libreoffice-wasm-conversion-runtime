#!/usr/bin/env bash

# Shared, fail-hard helpers for applying the reviewed LibreOffice patch stack.
# The caller owns shell options and logging.

patch_file_state() {
    local patch_path="$1"

    if [ ! -f "$patch_path" ]; then
        printf '%s\n' 'inconsistent'
        return 0
    fi

    # --force prevents GNU patch from cancelling --reverse when that probe
    # fails; without it, pristine source can be misclassified as applied.
    if patch --reverse --force --strip=1 --silent --batch --fuzz=0 --dry-run \
        < "$patch_path" >/dev/null 2>&1; then
        printf '%s\n' 'applied'
    elif patch --forward --strip=1 --silent --batch --fuzz=0 --dry-run \
        < "$patch_path" >/dev/null 2>&1; then
        printf '%s\n' 'pending'
    else
        printf '%s\n' 'inconsistent'
    fi
}

apply_pending_patch() {
    local patch_path="$1"

    patch --forward --strip=1 --batch --fuzz=0 < "$patch_path"
}

list_patch_created_files() {
    awk '
        /^--- \/dev\/null([[:space:]]|$)/ {
            expects_created_path = 1
            next
        }
        expects_created_path && /^\+\+\+ b\// {
            path = $0
            sub(/^\+\+\+ b\//, "", path)
            sub(/[[:space:]].*$/, "", path)
            if (!seen[path]++) {
                print path
            }
            expects_created_path = 0
            next
        }
        /^--- / {
            expects_created_path = 0
        }
    ' "$@"
}

is_safe_relative_patch_path() {
    local path="$1"

    case "$path" in
        ''|/*|../*|*/../*|*/..|[A-Za-z]:*) return 1 ;;
        *) return 0 ;;
    esac
}

reset_patched_source() {
    local created_path

    git reset --hard HEAD
    # Keep ignored build outputs/workdir, but remove ordinary untracked source.
    git clean -fd

    # A patch may create a path ignored by the pristine tree (for example
    # autogen.input). Remove only those exact reviewed paths; never run a broad
    # git clean -fdx that would discard the expensive LibreOffice workdir.
    while IFS= read -r created_path; do
        if ! is_safe_relative_patch_path "$created_path"; then
            printf 'Unsafe patch-created path: %s\n' "$created_path" >&2
            return 1
        fi
        git clean -fdx -- "$created_path"
    done < <(list_patch_created_files "$@")
}