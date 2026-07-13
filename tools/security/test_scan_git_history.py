from __future__ import annotations

import secrets
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCANNER = Path(__file__).with_name("scan_git_history.py")


class GitHistorySecretScanTest(unittest.TestCase):
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
