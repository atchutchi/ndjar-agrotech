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

Independent review fixes

A revisao independente identificou duas correccoes importantes. A configuracao do hook e todas as referencias directas a actions nos workflows usam agora SHAs completos com a versao legivel em comentario. Os comandos git ls-remote https://github.com/Yelp/detect-secrets.git refs/tags/v1.5.0, git ls-remote https://github.com/actions/checkout.git refs/tags/v4.2.2 e git ls-remote https://github.com/pre-commit/action.git refs/tags/v3.0.1 confirmaram, respectivamente, 68e8b45440415753fff70a312ece8da92ba85b4a, 11bd71901bbe5b1630ceea73d27597364c9af683 e 2c7b3805fd2a0fd8c1884dcaebf91fc102a13ecd.

detect-secrets classificou o SHA do hook como alta entropia durante a validacao. A linha contem pragma: allowlist secret, a anotacao oficial e localizada do detector, porque o valor e a revisao publica confirmada pelo comando git ls-remote e nao uma credencial. Nao foi usada baseline nem exclusao adicional.

.github/CODEOWNERS atribui a @atchutchi a propria politica, ambos os workflows de secret scan, futuros workflows com secret ou security no nome, .pre-commit-config.yaml e docs/security/secrets.md. O workflow trusted usa pull_request_target, faz checkout explicita da base protegida, copia a configuracao para RUNNER_TEMP e so depois faz checkout do commit do PR. Executa apenas detect-secrets com a configuracao guardada. Nao executa scripts, package managers ou codigo do PR. A proteccao da branch deve exigir este check e revisao CODEOWNERS. GitGuardian permanece uma verificacao externa independente. Nao foi tentada qualquer alteracao externa de branch protection por API.

Verificacao da revisao independente

py -m pre_commit run detect-secrets --all-files passou com a configuracao fixada por SHA. py -c com yaml.safe_load validou .pre-commit-config.yaml, .github/workflows/secret-scan.yml e .github/workflows/secret-scan-trusted.yml. A validacao estrutural confirmou todos os SHAs, todos os owners e a ordem base, copia, PR e scan confiavel. corepack pnpm --filter @ndjar/api test, corepack pnpm --filter @ndjar/api typecheck e corepack pnpm --filter @ndjar/api lint passaram. git diff --check sera repetido antes do commit.
