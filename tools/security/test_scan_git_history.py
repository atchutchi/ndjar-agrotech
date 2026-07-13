from __future__ import annotations

import secrets
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCANNER = Path(__file__).with_name("scan_git_history.py")


class GitHistorySecretScanTest(unittest.TestCase):
    def test_detects_supported_literal_forms_and_trailing_comments(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repository = Path(temporary_directory)
            self.initialize_repository(repository)
            keys = [
                "pass" + "word",
                "api" + "Token",
                "client" + "Secret",
                "jwt" + "Secret",
            ]
            values = [secrets.token_urlsafe(24) for _ in range(9)]

            (repository / "settings.ts").write_text(
                "".join(
                    [
                        f'const {keys[0]} = "{values[0]}";\n',
                        f'let {keys[1]} = "{values[1]}"; // local test\n',
                        f'const payload = {{ {keys[2]}: "{values[2]}" }};\n',
                        f'const {keys[3]} = "process.env.JWT_ACCESS_SECRET";\n',
                        f'var {keys[0]} = "{values[8]}";\n',
                    ]
                ),
                encoding="utf-8",
            )
            (repository / "settings.xml").write_text(
                "".join(
                    [
                        f"<{keys[0]}>{values[3]}</{keys[0]}>\n",
                        f'<property name="{keys[1]}" value="{values[4]}" />\n',
                    ]
                ),
                encoding="utf-8",
            )
            (repository / "local.env").write_text(
                f"API_TOKEN={values[5]} # local test\n",
                encoding="utf-8",
            )
            (repository / "service.conf").write_text(
                f"SERVICE_URL=https://user{values[6][:6]}:{values[7]}@example.test/path\n",
                encoding="utf-8",
            )
            self.commit_all(repository, "credential forms")

            result = self.run_scanner(repository, "--tree", check=False)

            self.assertNotEqual(result.returncode, 0)
            for path in ("settings.ts", "settings.xml", "local.env", "service.conf"):
                self.assertIn(path, result.stdout)
            for line_number in range(1, 6):
                self.assertIn(f"settings.ts:{line_number}", result.stdout)
            self.assertIn("settings.xml:1", result.stdout)
            self.assertIn("settings.xml:2", result.stdout)
            self.assertIn("local.env:1", result.stdout)
            self.assertIn("service.conf:1", result.stdout)
            self.assertIn("URL embeds literal credentials", result.stdout)
            self.assertIn("Generic credential literal", result.stdout)

    def test_rejects_allowlist_pragma_outside_protected_security_files(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repository = Path(temporary_directory)
            self.initialize_repository(repository)
            directive = "pragma:" + " allowlist secret"
            (repository / "app.ts").write_text(
                f"// {directive}\n", encoding="utf-8"
            )
            self.commit_all(repository, "ordinary pragma")

            rejected = self.run_scanner(repository, "--tree", check=False)

            self.assertNotEqual(rejected.returncode, 0)
            self.assertIn("Allowlist pragma is not permitted", rejected.stdout)

            (repository / "app.ts").unlink()
            (repository / ".pre-commit-config.yaml").write_text(
                f"rev: {secrets.token_hex(20)} # {directive}\n", encoding="utf-8"
            )
            self.commit_all(repository, "protected scanner configuration")

            allowed = self.run_scanner(repository, "--tree", check=False)
            self.assertEqual(allowed.returncode, 0, allowed.stdout)

    def test_ignores_types_patterns_comparisons_and_validation_sentinels(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repository = Path(temporary_directory)
            self.initialize_repository(repository)
            key = "refresh" + "Token"
            metadata_keys = [
                key.upper() + "_SECRET_LENGTH",
                key + "SecretPattern",
                "Forgot" + "PasswordInput",
            ]
            validation_sentinel = "sho" + "rt"
            (repository / "auth.test.ts").write_text(
                "".join(
                    [
                        f"export const {metadata_keys[0]} = 64;\n",
                        f"const {metadata_keys[1]} = /^[A-Za-z0-9_-]+$/;\n",
                        f"export type {metadata_keys[2]} = z.infer<typeof schema>;\n",
                        'typeof value.accessToken === "string";\n',
                        f'expect({{ {key}: "{validation_sentinel}" }}).toThrow();\n',
                    ]
                ),
                encoding="utf-8",
            )
            (repository / "pnpm-lock.yaml").write_text(
                f"integrity: sha512-{secrets.token_urlsafe(48)}==\n",
                encoding="utf-8",
            )
            powershell_key = "JWT_ACCESS_" + "SECRET"
            (repository / "bootstrap.ps1").write_text(
                f"$env:{powershell_key} = New-NdjarRuntimeSecret\n",
                encoding="utf-8",
            )
            self.commit_all(repository, "non credential metadata")

            result = self.run_scanner(repository, "--tree", check=False)

            self.assertEqual(result.returncode, 0, result.stdout)

    def test_detects_credential_introduced_by_a_merge_resolution(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repository = Path(temporary_directory)
            self.initialize_repository(repository)
            (repository / "settings.ts").write_text("mode = base\n", encoding="utf-8")
            self.commit_all(repository, "base")
            base = self.run_git(repository, "rev-parse", "HEAD").stdout.strip()
            primary_branch = self.run_git(
                repository, "branch", "--show-current"
            ).stdout.strip()

            self.run_git(repository, "checkout", "-b", "feature")
            (repository / "settings.ts").write_text(
                "mode = feature\n", encoding="utf-8"
            )
            self.commit_all(repository, "feature change")

            self.run_git(repository, "checkout", primary_branch)
            (repository / "settings.ts").write_text("mode = main\n", encoding="utf-8")
            self.commit_all(repository, "main change")
            merge = subprocess.run(
                ["git", "merge", "--no-ff", "feature"],
                cwd=repository,
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(merge.returncode, 0)

            key = "pass" + "word"
            generated_value = secrets.token_urlsafe(24)
            (repository / "settings.ts").write_text(
                f'const {key} = "{generated_value}";\n', encoding="utf-8"
            )
            self.run_git(repository, "add", "settings.ts")
            self.run_git(repository, "commit", "-m", "resolve merge")
            merge_commit = self.run_git(
                repository, "rev-parse", "HEAD"
            ).stdout.strip()

            result = self.run_scanner(
                repository,
                "--base",
                base,
                "--head",
                merge_commit,
                check=False,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn(merge_commit[:12], result.stdout)
            self.assertIn("settings.ts", result.stdout)

    def test_detects_literal_credentials_embedded_in_a_database_url(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repository = Path(temporary_directory)
            self.run_git(repository, "init")
            self.run_git(repository, "config", "user.email", "security-test@localhost")
            self.run_git(repository, "config", "user.name", "Security Test")

            username = "user" + secrets.token_hex(4)
            generated_value = secrets.token_urlsafe(24)
            (repository / "local.env").write_text(
                f"DATABASE_URL=postgres://{username}:{generated_value}@localhost/app\n",
                encoding="utf-8",
            )
            self.commit_all(repository, "database configuration")

            result = self.run_scanner(repository, "--tree", check=False)

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("Database URL embeds literal credentials", result.stdout)

    def test_detects_generic_credential_after_a_later_commit_removes_it(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repository = Path(temporary_directory)
            self.run_git(repository, "init")
            self.run_git(repository, "config", "user.email", "security-test@localhost")
            self.run_git(repository, "config", "user.name", "Security Test")

            (repository / "README.md").write_text("clean\n", encoding="utf-8")
            self.commit_all(repository, "base")
            base = self.run_git(repository, "rev-parse", "HEAD").stdout.strip()

            sensitive_name = "pass" + "word"
            generated_value = secrets.token_urlsafe(24)
            (repository / "settings.txt").write_text(
                f'{sensitive_name} = "{generated_value}"\n', encoding="utf-8"
            )
            self.commit_all(repository, "introduce credential")
            introducing_commit = self.run_git(
                repository, "rev-parse", "HEAD"
            ).stdout.strip()

            tree_result = self.run_scanner(repository, "--tree", check=False)
            self.assertNotEqual(tree_result.returncode, 0)
            self.assertIn("Generic credential literal", tree_result.stdout)

            (repository / "settings.txt").unlink()
            self.commit_all(repository, "remove credential")
            head = self.run_git(repository, "rev-parse", "HEAD").stdout.strip()

            history_result = self.run_scanner(
                repository,
                "--base",
                base,
                "--head",
                head,
                check=False,
            )

            self.assertNotEqual(history_result.returncode, 0)
            self.assertIn(introducing_commit[:12], history_result.stdout)
            self.assertIn("settings.txt", history_result.stdout)
            self.assertIn("Generic credential literal", history_result.stdout)

            clean_result = self.run_scanner(
                repository,
                "--base",
                introducing_commit,
                "--head",
                head,
                check=False,
            )
            self.assertEqual(clean_result.returncode, 0, clean_result.stdout)

    def commit_all(self, repository: Path, message: str) -> None:
        self.run_git(repository, "add", "--all")
        self.run_git(repository, "commit", "-m", message)

    def initialize_repository(self, repository: Path) -> None:
        self.run_git(repository, "init")
        self.run_git(repository, "config", "user.email", "security-test@localhost")
        self.run_git(repository, "config", "user.name", "Security Test")

    def run_git(
        self, repository: Path, *arguments: str
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["git", *arguments],
            cwd=repository,
            check=True,
            capture_output=True,
            text=True,
        )

    def run_scanner(
        self, repository: Path, *arguments: str, check: bool
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [
                sys.executable,
                str(SCANNER),
                "--repository",
                str(repository),
                *arguments,
            ],
            check=check,
            capture_output=True,
            text=True,
        )


if __name__ == "__main__":
    unittest.main()
