from __future__ import annotations

import argparse
import os
import re
import shlex
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


SENSITIVE_ASSIGNMENT = re.compile(
    r"""^\s*(?:export\s+)?[\"']?
    (?P<key>[A-Za-z0-9_.-]*(?:password|passwd|pwd|secret|token|api[_-]?key|
    client[_-]?secret|access[_-]?token|refresh[_-]?token|jwt[_-]?secret)
    [A-Za-z0-9_.-]*)[\"']?\s*[:=]\s*(?P<value>.+?)\s*[,;]?\s*$""",
    re.IGNORECASE | re.VERBOSE,
)
DATABASE_CREDENTIAL = re.compile(
    r"(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis|amqps?)://"
    r"(?P<user>[^\s:/@]+):(?P<password>[^\s/@]+)@",
    re.IGNORECASE,
)
HUNK_HEADER = re.compile(r"^@@ -\d+(?:,\d+)? \+(?P<line>\d+)(?:,\d+)? @@")
ZERO_SHA = "0" * 40


@dataclass(frozen=True)
class Finding:
    path: str
    line: int
    reason: str
    commit: str | None = None

    def render(self) -> str:
        location = f"{self.path}:{self.line}"
        if self.commit:
            location = f"{self.commit[:12]}:{location}"
        return f"{location}: {self.reason}"


def run_git(repository: Path, *arguments: str) -> str:
    result = subprocess.run(
        ["git", *arguments],
        cwd=repository,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return result.stdout


def normalise_literal(raw_value: str) -> str | None:
    value = raw_value.strip().rstrip(",;").strip()
    is_quoted = (
        len(value) >= 2 and value[0] in {"\"", "'"} and value[-1] == value[0]
    )
    if is_quoted:
        value = value[1:-1].strip()

    if not value:
        return None

    if not is_quoted:
        if any(character.isspace() for character in value):
            return None
        if value[0] in "{[(" or value in {"true", "false", "null", "undefined"}:
            return None
        if re.fullmatch(r"v?\d+(?:\.\d+)+(?:[-+][A-Za-z0-9.-]+)?", value):
            return None

    lower_value = value.lower()
    dynamic_markers = (
        "${",
        "$env:",
        "process.env",
        "import.meta.env",
        "os.environ",
        "getenv(",
        "read-host",
        "randombytes(",
        "randomnumbergenerator",
        "token_urlsafe(",
        "secrets.",
        "crypto.",
        "prompt(",
        "input(",
    )
    if any(marker in lower_value for marker in dynamic_markers):
        return None
    if (value.startswith("<") and value.endswith(">")) or value.startswith("%"):
        return None
    if not is_quoted:
        if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_.]*", value):
            return None
        if "(" in value or ")" in value:
            return None
    return value


def inspect_line(path: str, line_number: int, line: str, commit: str | None = None) -> list[Finding]:
    if "pragma: allowlist secret" in line:
        return []

    findings: list[Finding] = []
    database_match = DATABASE_CREDENTIAL.search(line)
    if database_match:
        user = database_match.group("user")
        password = database_match.group("password")
        placeholders = ("$", "{", "}", "<", ">", "%")
        has_literal_credentials = all(
            value and not any(marker in value for marker in placeholders)
            for value in (user, password)
        )
        if has_literal_credentials:
            findings.append(
                Finding(path, line_number, "Database URL embeds literal credentials", commit)
            )

    assignment_match = SENSITIVE_ASSIGNMENT.match(line)
    if assignment_match and normalise_literal(assignment_match.group("value")):
        findings.append(
            Finding(
                path,
                line_number,
                f"Generic credential literal assigned to {assignment_match.group('key')}",
                commit,
            )
        )
    return findings


def scan_tree(repository: Path) -> list[Finding]:
    tracked_files = run_git(repository, "ls-files", "-z").split("\0")
    findings: list[Finding] = []
    for relative_path in tracked_files:
        if not relative_path:
            continue
        file_path = repository / relative_path
        try:
            content = file_path.read_bytes()
        except (FileNotFoundError, OSError):
            continue
        if b"\0" in content:
            continue
        for line_number, line in enumerate(
            content.decode("utf-8", errors="replace").splitlines(), start=1
        ):
            findings.extend(inspect_line(relative_path, line_number, line))
    return findings


def commits_in_range(repository: Path, base: str, head: str) -> list[str]:
    revision = head if base == ZERO_SHA else f"{base}..{head}"
    return [
        commit
        for commit in run_git(
            repository, "rev-list", "--reverse", "--topo-order", revision
        ).splitlines()
        if commit
    ]


def scan_commit(repository: Path, commit: str) -> list[Finding]:
    patch = run_git(
        repository,
        "show",
        "--format=",
        "--no-ext-diff",
        "--no-textconv",
        "--unified=0",
        "--no-renames",
        commit,
    )
    findings: list[Finding] = []
    current_path = "unknown"
    new_line_number: int | None = None

    for patch_line in patch.splitlines():
        if patch_line.startswith("diff --git "):
            try:
                parts = shlex.split(patch_line)
                current_path = parts[3][2:] if len(parts) >= 4 else "unknown"
            except ValueError:
                current_path = "unknown"
            new_line_number = None
            continue

        hunk_match = HUNK_HEADER.match(patch_line)
        if hunk_match:
            new_line_number = int(hunk_match.group("line"))
            continue

        if new_line_number is None:
            continue
        if patch_line.startswith("+++"):
            continue
        if patch_line.startswith("+"):
            findings.extend(
                inspect_line(current_path, new_line_number, patch_line[1:], commit)
            )
            new_line_number += 1
        elif patch_line.startswith("-"):
            continue
        else:
            new_line_number += 1
    return findings


def scan_history(repository: Path, base: str, head: str) -> list[Finding]:
    findings: list[Finding] = []
    for commit in commits_in_range(repository, base, head):
        findings.extend(scan_commit(repository, commit))
    return findings


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Detect generic credential literals in the Git tree or commit range."
    )
    parser.add_argument("--repository", type=Path, default=Path.cwd())
    parser.add_argument("--tree", action="store_true")
    parser.add_argument("--base", default=os.getenv("NDJAR_SECRET_SCAN_BASE"))
    parser.add_argument("--head", default=os.getenv("NDJAR_SECRET_SCAN_HEAD", "HEAD"))
    return parser.parse_args()


def main() -> int:
    arguments = parse_arguments()
    repository = arguments.repository.resolve()
    try:
        if arguments.tree:
            findings = scan_tree(repository)
        else:
            if not arguments.base:
                print("A base commit is required for a history scan.", file=sys.stderr)
                return 2
            findings = scan_history(repository, arguments.base, arguments.head)
    except RuntimeError as error:
        print(f"Secret scan failed: {error}", file=sys.stderr)
        return 2

    if findings:
        for finding in findings:
            print(finding.render())
        print(f"Detected {len(findings)} generic credential literal(s).")
        return 1

    print("No generic credential literals detected.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
