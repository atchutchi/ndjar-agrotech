import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "../../..");

function readRepositoryFile(path: string) {
  return readFileSync(resolve(repositoryRoot, path), "utf8");
}

describe("configuração de segurança do repositório", () => {
  it("não executa a configuração alterável do PR no workflow normal", () => {
    const workflow = readRepositoryFile(".github/workflows/secret-scan.yml");

    expect(workflow).not.toMatch(/^\s*pull_request:\s*$/m);
    expect(workflow).toContain("persist-credentials: false");
    expect(workflow).toContain("fetch-depth: 0");
    expect(workflow).toContain("github.event.before");
    expect(workflow).toContain("github.sha");
    expect(workflow).toContain(
      "python tools/security/scan_git_history.py --base",
    );
  });

  it("usa apenas configuraÃ§Ã£o e scanner preservados da base no PR", () => {
    const workflow = readRepositoryFile(
      ".github/workflows/secret-scan-trusted.yml",
    );

    expect(workflow.match(/fetch-depth: 0/g)).toHaveLength(2);
    expect(workflow).toContain("trusted-pre-commit-config.yaml");
    expect(workflow).toContain("trusted-secret-scanner.py");
    expect(workflow).toContain("github.event.pull_request.base.sha");
    expect(workflow).toContain("github.event.pull_request.head.sha");
    expect(workflow).toContain(
      'python "$RUNNER_TEMP/trusted-secret-scanner.py" --base',
    );
    expect(workflow).not.toContain("python tools/security/scan_git_history.py");
    expect(workflow).not.toMatch(/\b(?:pnpm|npm|yarn|bun)\b/);
  });

  it("exige revisão para todos os workflows", () => {
    const codeowners = readRepositoryFile(".github/CODEOWNERS");

    expect(codeowners).toMatch(/^\.github\/workflows\/\*\*\s+@atchutchi$/m);
  });

  it("analisa o lockfile sem depender dos detectores de entropia", () => {
    const config = readRepositoryFile(".pre-commit-config.yaml");

    expect(config).toContain("files: ^pnpm-lock\\.yaml$");
    expect(config).toContain("Base64HighEntropyString");
    expect(config).toContain("HexHighEntropyString");
    expect(config.match(/id: detect-secrets/g)).toHaveLength(2);
    expect(config).toContain("id: generic-credential-tree");
    expect(config).toContain("id: generic-credential-history");
    expect(config).toContain("stages: [manual]");
  });

  it("documenta ambientes separados para fixture e autenticação real", () => {
    const readme = readRepositoryFile("README.md");

    expect(readme).not.toContain("Copy-Item .env.example .env");
    expect(readme).toContain("NDJAR_DATABASE_MODE=fixture` disables");
    expect(readme).toContain("NDJAR_DATABASE_MODE=postgres");
    expect(readme).toContain("apps/web/.env.local");
  });
});
