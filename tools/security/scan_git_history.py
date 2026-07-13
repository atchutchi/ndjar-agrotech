from __future__ import annotations

import argparse
import difflib
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


SENSITIVE_KEY = (
    r"[A-Za-z0-9_.-]*(?:password|passwd|pwd|secret|token|api[_-]?key)"
    r"[A-Za-z0-9_.-]*"
)
SENSITIVE_ASSIGNMENT = re.compile(
    rf"(?<![A-Za-z0-9_.-])[\"']?(?P<key>{SENSITIVE_KEY})[\"']?\s*"
    r"(?::|(?<![=!<>])=(?!=))\s*",
    re.IGNORECASE,
)
URL_CREDENTIAL = re.compile(
    r"(?P<scheme>[A-Za-z][A-Za-z0-9+.-]*)://"
    r"(?P<user>[^\s:/@]+):(?P<password>[^\s/@]+)@",
    re.IGNORECASE,
)
XML_ELEMENT = re.compile(
    rf"<(?P<key>{SENSITIVE_KEY})\b[^>]*>(?P<value>[^<]+)</[^>]+>",
    re.IGNORECASE,
)
XML_NAMED_VALUE = re.compile(
    rf"\bname\s*=\s*(?P<name_quote>[\"'])(?P<key>{SENSITIVE_KEY})"
    r"(?P=name_quote)[^>]*\bvalue\s*=\s*(?P<value_quote>[\"'])"
    r"(?P<value>.*?)(?P=value_quote)",
    re.IGNORECASE,
)
ALLOWLIST_PRAGMA = "pragma: allowlist secret"
DATABASE_SCHEMES = {
    "amqp",
    "amqps",
    "mariadb",
    "mongodb",
    "mongodb+srv",
    "mysql",
    "postgres",
    "postgresql",
    "redis",
}
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


def run_git_bytes(
    repository: Path, *arguments: str, allow_failure: bool = False
) -> bytes | None:
    result = subprocess.run(
        ["git", *arguments],
        cwd=repository,
        check=False,
        capture_output=True,
    )
    if result.returncode != 0:
        if allow_failure:
            return None
        message = result.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(message or "Git command failed")
    return result.stdout


def normalise_literal(
    raw_value: str, *, bare_identifier_is_literal: bool = False
) -> str | None:
    value = raw_value.strip().rstrip(",;").strip()
    is_quoted = (
        len(value) >= 2
        and value[0] in {"\"", "'", "`"}
        and value[-1] == value[0]
    )
    if is_quoted:
        value = value[1:-1].strip()

    if not value:
        return None
    if (value.startswith("<") and value.endswith(">")) or value.startswith("%"):
        return None
    if value.startswith("${") and value.endswith("}"):
        return None

    if not is_quoted:
        if value[0] in "${[(" or value in {
            "true",
            "false",
            "null",
            "undefined",
        }:
            return None
        if re.fullmatch(r"\d+(?:\.\d+)?", value):
            return None
        if re.fullmatch(r"v?\d+(?:\.\d+)+(?:[-+][A-Za-z0-9.-]+)?", value):
            return None
        if value.startswith("/") or any(character in value for character in "[]<>"):
            return None
        lower_value = value.lower()
        dynamic_markers = (
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
        if not bare_identifier_is_literal and re.fullmatch(
            r"[A-Za-z_][A-Za-z0-9_.]*", value
        ):
            return None
        if "(" in value or ")" in value:
            return None
    return value


def extract_assigned_value(line: str, start: int) -> str:
    remainder = line[start:].lstrip()
    if not remainder:
        return ""
    if remainder[0] in {"\"", "'", "`"}:
        quote = remainder[0]
        escaped = False
        for index, character in enumerate(remainder[1:], start=1):
            if escaped:
                escaped = False
            elif character == "\\":
                escaped = True
            elif character == quote:
                return remainder[: index + 1]
        return remainder

    end = len(remainder)
    for index, character in enumerate(remainder):
        if character.isspace() or character in ",;}]#":
            end = index
            break
    return remainder[:end]


def pragma_is_allowed(path: str) -> bool:
    normalised_path = path.replace("\\", "/")
    return (
        normalised_path == ".pre-commit-config.yaml"
        or normalised_path.startswith("tools/security/")
        or normalised_path.startswith("docs/security/")
        or normalised_path.startswith(".github/workflows/secret-scan")
        or normalised_path == ".superpowers/sdd/security-secrets-report.md"
    )


def credential_key_is_sensitive(key: str) -> bool:
    key_without_path = key.rsplit(".", 1)[-1]
    words = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", key_without_path)
    words = [word.lower() for word in re.split(r"[^A-Za-z0-9]+", words) if word]
    metadata_suffixes = {
        "column",
        "field",
        "hash",
        "id",
        "ids",
        "index",
        "input",
        "length",
        "name",
        "pattern",
        "selector",
        "type",
    }
    return bool(words) and words[-1] not in metadata_suffixes


def is_validation_sentinel(path: str, value: str) -> bool:
    test_file = re.search(r"\.(?:test|spec)\.[cm]?[jt]sx?$", path, re.IGNORECASE)
    return bool(test_file) and value.lower() in {"short"}


def is_dynamic_powershell_command(
    line: str, assignment_match: re.Match[str], raw_value: str
) -> bool:
    variable_prefix = line[: assignment_match.start()]
    command = raw_value.strip()
    return bool(
        re.search(r"\$(?:env:)?$", variable_prefix, re.IGNORECASE)
        and re.fullmatch(r"[A-Z][A-Za-z0-9]*-[A-Z][A-Za-z0-9-]*", command)
    )


def concrete_url_component(value: str) -> bool:
    placeholders = ("$", "{", "}", "<", ">", "%")
    return bool(value) and not any(marker in value for marker in placeholders)


def inspect_line(
    path: str, line_number: int, line: str, commit: str | None = None
) -> list[Finding]:
    if ALLOWLIST_PRAGMA in line:
        if pragma_is_allowed(path):
            return []
        pragma_finding = Finding(
            path,
            line_number,
            "Allowlist pragma is not permitted outside protected security files",
            commit,
        )
    else:
        pragma_finding = None

    findings: list[Finding] = []
    if pragma_finding:
        findings.append(pragma_finding)

    for url_match in URL_CREDENTIAL.finditer(line):
        if not all(
            concrete_url_component(url_match.group(group))
            for group in ("user", "password")
        ):
            continue
        scheme = url_match.group("scheme").lower()
        reason = (
            "Database URL embeds literal credentials"
            if scheme in DATABASE_SCHEMES
            else "URL embeds literal credentials"
        )
        findings.append(Finding(path, line_number, reason, commit))

    for assignment_match in SENSITIVE_ASSIGNMENT.finditer(line):
        if not credential_key_is_sensitive(assignment_match.group("key")):
            continue
        raw_value = extract_assigned_value(line, assignment_match.end())
        if is_dynamic_powershell_command(line, assignment_match, raw_value):
            continue
        literal = normalise_literal(
            raw_value,
            bare_identifier_is_literal=Path(path).suffix.lower() == ".env",
        )
        if literal and not is_validation_sentinel(path, literal):
            findings.append(
                Finding(
                    path,
                    line_number,
                    "Generic credential literal assigned to "
                    f"{assignment_match.group('key')}",
                    commit,
                )
            )

    for xml_pattern in (XML_ELEMENT, XML_NAMED_VALUE):
        for xml_match in xml_pattern.finditer(line):
            if normalise_literal(f'"{xml_match.group("value")}"'):
                findings.append(
                    Finding(
                        path,
                        line_number,
                        "Generic credential literal assigned to "
                        f"{xml_match.group('key')}",
                        commit,
                    )
                )

    return list(dict.fromkeys(findings))


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


def commit_parents(repository: Path, commit: str) -> list[str]:
    revision = run_git(repository, "rev-list", "--parents", "-n", "1", commit)
    return revision.strip().split()[1:]


def decode_git_paths(raw_paths: bytes | None) -> set[str]:
    if not raw_paths:
        return set()
    return {
        path.decode("utf-8", errors="replace")
        for path in raw_paths.split(b"\0")
        if path
    }


def changed_paths(repository: Path, parent: str | None, commit: str) -> set[str]:
    if parent is None:
        paths = run_git_bytes(repository, "ls-tree", "-r", "--name-only", "-z", commit)
    else:
        paths = run_git_bytes(
            repository,
            "diff",
            "--name-only",
            "-z",
            "--no-renames",
            parent,
            commit,
            "--",
        )
    return decode_git_paths(paths)


def file_lines(repository: Path, revision: str, path: str) -> list[str] | None:
    content = run_git_bytes(
        repository, "show", f"{revision}:{path}", allow_failure=True
    )
    if content is None or b"\0" in content:
        return None
    return content.decode("utf-8", errors="replace").splitlines()


def added_line_indexes(before: list[str], after: list[str]) -> set[int]:
    indexes: set[int] = set()
    matcher = difflib.SequenceMatcher(a=before, b=after, autojunk=False)
    for operation, _first_start, _first_end, second_start, second_end in matcher.get_opcodes():
        if operation in {"insert", "replace"}:
            indexes.update(range(second_start, second_end))
    return indexes


def scan_commit(repository: Path, commit: str) -> list[Finding]:
    parents = commit_parents(repository, commit)
    comparison_parents: list[str | None] = parents or [None]
    paths: set[str] = set()
    for parent in comparison_parents:
        paths.update(changed_paths(repository, parent, commit))

    findings: list[Finding] = []
    for path in sorted(paths):
        current_lines = file_lines(repository, commit, path)
        if current_lines is None:
            continue

        changed_by_parent: list[set[int]] = []
        for parent in comparison_parents:
            parent_lines = file_lines(repository, parent, path) if parent else []
            changed_by_parent.append(
                added_line_indexes(parent_lines or [], current_lines)
            )
        line_indexes = set.intersection(*changed_by_parent)

        for line_index in sorted(line_indexes):
            findings.extend(
                inspect_line(path, line_index + 1, current_lines[line_index], commit)
            )
    return list(dict.fromkeys(findings))


def scan_history(repository: Path, base: str, head: str) -> list[Finding]:
    findings: list[Finding] = []
    for commit in commits_in_range(repository, base, head):
        findings.extend(scan_commit(repository, commit))
    return list(dict.fromkeys(findings))


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
