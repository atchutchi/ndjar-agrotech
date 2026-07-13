Relatorio de correccao de segredos

Base

Worktree analisada a partir de cc63723. Nenhuma alteracao preexistente foi revertida. O historico Git nao foi reescrito.

RED

Foram instalados localmente Python pre-commit 4.5.1 e detect-secrets 1.5.0, sem qualquer chave de API. Antes da correccao, detect-secrets 1.5.0 com KeywordDetector encontrou entradas Secret Keyword na password de registo, na password de validacao, na nova password e no segredo JWT de teste. Encontrou tambem a credencial de ligacao no ficheiro de exemplo. Esta execucao demonstrou a causa antes de qualquer alteracao de fixtures.

GREEN

As passwords, o segredo JWT e os tokens de sessao usados pelos testes de autenticacao passaram a ser gerados com node:crypto em runtime. Os testes continuam deterministas porque reutilizam as mesmas referencias dentro de cada caso. A fixture de refresh token usa tambem um segredo aleatorio com o tamanho que a aplicacao emite.

O ficheiro .env.example deixou de conter credenciais ou valores secretos reutilizaveis. Os campos sensiveis ficam vazios. A documentacao de seguranca explica onde os definir e como agir perante um segredo real.

Proteccao

.pre-commit-config.yaml usa o hook oficial Yelp detect-secrets v1.5.0 sem baseline e sem exclusoes globais de testes. Exclui apenas pnpm-lock.yaml porque os checksums SHA-512 das dependencias produzem falsos positivos de elevada entropia e nao sao credenciais. .github/workflows/secret-scan.yml executa a configuracao em push e pull_request com actions/checkout@v4.2.2 e pre-commit/action@v3.0.1. O hook local e instalado com py -m pre_commit install. O ggshield nao foi instalado porque nao existe GITGUARDIAN_API_KEY configurada.

Ficheiros alterados

apps/api/src/modules/auth/auth.service.test.ts
apps/api/src/modules/auth/auth.controller.test.ts
apps/api/src/modules/auth/auth.guard.test.ts
apps/api/src/modules/auth/auth.repository.test.ts
.env.example
.pre-commit-config.yaml
.github/workflows/secret-scan.yml
docs/security/secrets.md
.superpowers/sdd/security-secrets-report.md

Verificacao final

py -m pre_commit run detect-secrets --all-files passou. corepack pnpm --filter @ndjar/api test passou com 48 testes em 6 ficheiros. corepack pnpm --filter @ndjar/api typecheck passou. corepack pnpm --filter @ndjar/api lint passou. git diff --check e git diff --cached --check passaram. O hook pre-commit esta activo no directorio de hooks Git desta worktree.

Riscos residuais

O detector por palavras-chave e heuristico. Pode nao reconhecer todos os formatos de credenciais e pode sinalizar valores de teste sem segredo real. A verificacao bloqueia novos ficheiros e alteracoes, mas nao elimina incidentes ja registados por ferramentas externas nem reescreve historico. O incidente existente deve ser marcado no GitGuardian como credencial de teste ou falso positivo depois da correccao.
