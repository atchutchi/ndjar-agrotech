# Task 4 Report: API Auth Service And Endpoints

## Estado

Implementado.

## Resumo

Foram adicionados os oito endpoints de auth pedidos:

- POST /auth/register
- POST /auth/verify
- POST /auth/login
- POST /auth/refresh
- POST /auth/forgot-password
- POST /auth/reset-password
- GET /auth/me
- POST /auth/logout

O AuthModule foi ligado ao AppModule. O DatabaseModule continua global e o AuthRepository aceita Database | null, mas falha com mensagem clara quando e usado em fixture mode sem base real.

Usei Argon2 para passwords, codigos e refresh token hashes. Os refresh tokens sao persistidos apenas como hash. Nao foram adicionados logs de passwords, codigos, access tokens ou refresh tokens.

## TDD

Teste RED criado primeiro em apps/api/src/modules/auth/auth.controller.test.ts, cobrindo delegacao e validacao dos oito endpoints com AuthService simulado e sem PostgreSQL.

Evidencia RED:

Comando:

```bash
corepack pnpm --filter @ndjar/api test -- auth.controller.test.ts
```

Resultado esperado observado:

```text
FAIL src/modules/auth/auth.controller.test.ts
Error: Cannot find module './auth.controller.js'
```

Durante a primeira tentativa, a instalacao bloqueou antes do Vitest porque argon2 precisava de aprovacao de build no pnpm. Corrigi pnpm-workspace.yaml com allowBuilds.argon2=true, porque sem isso o workspace nao executava testes apos a dependencia obrigatoria.

Evidencia GREEN:

Comando:

```bash
corepack pnpm --filter @ndjar/api test -- auth.controller.test.ts
```

Resultado:

```text
Test Files  3 passed (3)
Tests       25 passed (25)
```

Nota: este comando tambem executou database.module.test.ts e app.e2e-spec.ts pela configuracao actual do Vitest.

## Ficheiros alterados

- apps/api/package.json
- apps/api/src/app.module.ts
- apps/api/src/modules/auth/auth.controller.test.ts
- apps/api/src/modules/auth/auth.controller.ts
- apps/api/src/modules/auth/auth.module.ts
- apps/api/src/modules/auth/auth.repository.ts
- apps/api/src/modules/auth/auth.schemas.ts
- apps/api/src/modules/auth/auth.service.ts
- apps/api/src/modules/auth/auth.tokens.ts
- pnpm-lock.yaml
- pnpm-workspace.yaml

## Decisoes

GET /auth/me usa uma interface minima AuthenticatedRequest com user opcional. O controller passa request.user para AuthService.me. Isto prepara a futura Tarefa 5, onde o AuthGuard podera popular request.user, sem implementar guard nesta tarefa.

Nao implementei AuthGuard nem RolesGuard.

Nao inventei mobile, web admin ou pagamentos.

## Resultados finais

Comando:

```bash
corepack pnpm --filter @ndjar/api test -- auth.controller.test.ts
```

Resultado:

```text
Test Files  3 passed (3)
Tests       25 passed (25)
```

Comando:

```bash
corepack pnpm --filter @ndjar/api typecheck
```

Resultado:

```text
tsc -p tsconfig.json --noEmit
```

Exit code: 0.

Comando:

```bash
corepack pnpm --filter @ndjar/api lint
```

Resultado:

```text
All matched files use Prettier code style!
```

Comando:

```bash
git diff --check
```

Resultado:

```text
Exit code: 0
```

Avisos observados:

```text
LF will be replaced by CRLF the next time Git touches it
```

Comando adicional:

```bash
corepack pnpm --filter @ndjar/api test
```

Resultado:

```text
Test Files  3 passed (3)
Tests       25 passed (25)
```

## Self-review

O controller esta coberto para delegacao e validacao dos oito endpoints sem depender de PostgreSQL.

O AppModule arranca em fixture mode com AuthModule importado. Isto ficou coberto pelo app.e2e-spec.ts existente, que passou apos a integracao.

O repository usa transaccao Drizzle na criacao de conta, na rotacao de refresh token, no logout e no consumo de codigos.

Preocupacao tecnica: refresh token lookup com Argon2 exige percorrer tokens activos porque o hash Argon2 nao permite lookup deterministico. Para volume real, a Tarefa futura deve introduzir um identificador publico ou fingerprint nao sensivel para localizar o registo antes de verificar o hash.

Preocupacao de cobertura: esta tarefa ficou com testes unitarios fortes no controller e smoke e2e em fixture mode. Nao ha teste de integracao real com PostgreSQL para o AuthRepository nesta task.
