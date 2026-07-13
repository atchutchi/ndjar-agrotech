# Tarefa 8: Documentation And Verification

## Alcance

Actualizei o README e `.env.example` para documentar a fundação de produção tal como está implementada. A documentação distingue o código já existente da integração operacional ainda pendente.

O README passa a registar schema, endpoints de autenticação, `AuthGuard`, `RolesGuard`, shell de administração protegido e endpoint de entitlements. Também explica que não existem ainda provisionamento PostgreSQL, migrations aplicadas, email ou SMS, pagamentos reais, GIS e CRUD administrativo, backend completo do fórum ou consultas completas de produção.

`.env.example` contém `NDJAR_API_URL=http://localhost:3333`. `DATABASE_URL`, `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` permanecem vazios. O README documenta `NDJAR_DATABASE_MODE=fixture` para iniciar rotas baseadas em fixtures sem base de dados e esclarece que login real e entitlements reais requerem PostgreSQL. Inclui ainda um comando PowerShell que gera os JWT apenas no processo actual com `RandomNumberGenerator`, sem imprimir nem gravar segredos.

O README mantém a cobertura de segurança activa e regista dois limites externos sem alterar o workflow: a protecção de branch ainda tem de exigir o trusted secret scan e `pre-commit/action` mantém dependências transitivas mutáveis geridas pelo fornecedor.

## Limpeza de Minors

- Removido do relatório da Tarefa 3 o bloco histórico de fixtures que não pertencia à Production Foundation Task 3.
- `database.module.test.ts` captura e restaura `DATABASE_URL` e `NDJAR_DATABASE_MODE` em `beforeEach` e `afterEach`.
- Adicionado um teste de `RolesGuard` com `Reflector` real que prova que a metadata do handler prevalece sobre a metadata da classe.
- Corrigida a lista de ficheiros da Tarefa 5 para não atribuir uma alteração inexistente a `auth.guard.ts`.
- Removida do relatório da Tarefa 7 a afirmação histórica de instabilidade paralela que foi resolvida pela revisão subsequente.

## Verificação

- `corepack pnpm --filter @ndjar/database test`: passou, 8 testes.
- `corepack pnpm --filter @ndjar/domain test`: passou, 29 testes.
- `corepack pnpm --filter @ndjar/api test`: passou, 56 testes.
- `corepack pnpm --filter @ndjar/web test`: passou, 20 testes.
- `corepack pnpm --filter @ndjar/database typecheck`: passou.
- `corepack pnpm --filter @ndjar/domain typecheck`: passou.
- `corepack pnpm --filter @ndjar/api typecheck`: passou.
- `corepack pnpm --filter @ndjar/web typecheck`: passou.
- `corepack pnpm --filter @ndjar/api lint`: passou depois de formatar os dois testes alterados.
- `corepack pnpm --filter @ndjar/web lint`: passou.
- `corepack pnpm --filter @ndjar/api build`: passou.
- `corepack pnpm --filter @ndjar/web build`: passou. O Next.js 16 emite o aviso não bloqueante de que a convenção `middleware` será substituída por `proxy`.
- `git diff --check`: passou.
- `py -m pre_commit run detect-secrets --all-files`: passou.
- Leitura UTF-8 com Node e detecção de mojibake: passou para `README.md` e os relatórios alterados.

## Self-review

Não alterei a especificação porque a implementação não revelou uma contradição de arquitectura. Não foram introduzidos segredos fixos, migrations, provisionamento de base de dados, alterações de pagamentos, GIS, CRUD, fórum ou workflow de CI. O diff está limitado à documentação, correcções de relatórios e cobertura de teste necessária para os Minors identificados.

## Preocupações

Não há bloqueios externos para esta tarefa. A integração operacional continua dependente de PostgreSQL provisionado com schema aplicado. Branch protection e a gestão do risco de dependências transitivas de `pre-commit/action` são configurações externas ainda pendentes. O aviso de deprecação de `middleware` no build da web não foi corrigido porque não pertence ao âmbito desta fundação.
