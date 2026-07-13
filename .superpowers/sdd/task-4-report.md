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

## Independent review fixes

### RED

Foram criados primeiro testes para `AuthGuard` e para a rotação de refresh token de uma conta `password` desactivada. O teste do guard assina um JWT real com `signAccessToken` e só fornece o cabeçalho `Authorization`, sem injectar `request.user`. Cobre token válido, ausência de token e token inválido.

Comando:

```bash
corepack pnpm --filter @ndjar/api test -- auth.guard.test.ts auth.repository.test.ts auth.controller.test.ts
```

Resultado antes da implementação:

```text
Test Files  2 failed | 4 passed (6)
Tests       1 failed | 39 passed (40)
```

Falhas relevantes:

```text
Cannot find module './auth.guard.js'
expected { ... } to be null
```

O segundo erro demonstrou que `rotateRefreshToken` devolvia uma sessão para a conta desactivada simulada.

### GREEN

Foi criado `AuthGuard`, aplicado exclusivamente a `GET /auth/me` e registado e exportado pelo `AuthModule`. O guard valida o Bearer JWT, preenche `request.user` com `{ id, roles }` e rejeita token ausente ou inválido com `Sessão obrigatória`.

`rotateRefreshToken` passou a exigir uma conta `password` activa através de `innerJoin(authAccounts, ...)`, com `provider = password` e `disabledAt IS NULL`. Não foi implementado `RolesGuard`.

Comando:

```bash
corepack pnpm --filter @ndjar/api test -- auth.guard.test.ts auth.repository.test.ts auth.controller.test.ts
```

Resultado:

```text
Test Files  6 passed (6)
Tests       43 passed (43)
```

Nota: a configuração actual do Vitest também executa os restantes testes da API quando recebe estes filtros.

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

## Review fixes

### RED

Foram adicionados testes unitarios focados em `apps/api/src/modules/auth/auth.service.test.ts` e `apps/api/src/modules/auth/auth.repository.test.ts`, sem dependencia de PostgreSQL real.

Comando:

```bash
corepack pnpm --filter @ndjar/api test -- auth.repository.test.ts auth.service.test.ts
```

Resultado observado antes da implementacao:

```text
Test Files  2 failed | 3 passed (5)
Tests       8 failed | 26 passed (34)
```

Falhas relevantes observadas:

```text
parseRefreshToken is not a function
expected updateChain.returning to be called
VERIFICATION_CODE_MAX_ATTEMPTS received undefined
expected tx.update to be called for invalid verification code
this.requireDatabase(...).insert is not a function
expected tx.update to be called 3 times, but got 2 times
expected createFarmerAccount to receive email
expected error to be instance of ConflictException
```

### Achados corrigidos

Critical: a rotacao de refresh token deixou de procurar todos os tokens activos por Argon2. O token emitido tem agora formato `selector.secret`. O selector e o `id` publico da linha em `refresh_tokens`; o segredo continua apenas em hash Argon2. A rotacao verifica o hash do segredo da linha seleccionada e reclama o token com `UPDATE ... WHERE id = selector AND revoked_at IS NULL AND expires_at > now RETURNING id`. Se a reclamacao nao devolver linha, nao e emitido novo refresh token. O logout aplica o mesmo selector e a mesma condicao de revogacao, sem varrer hashes.

Important: `verification_codes.attempts` passou a ter limite explicito `VERIFICATION_CODE_MAX_ATTEMPTS = 5`. Codigos de verificacao de conta e reset de password so sao seleccionados quando `attempts < 5`. Quando o codigo e invalido, as tentativas sao incrementadas atomicamente com `attempts = attempts + 1`, mantendo `consumed_at IS NULL`, validade temporal e limite de tentativas no `WHERE`.

Important: ao emitir novo codigo de password reset, codigos activos anteriores para o mesmo alvo sao invalidados na mesma transaccao antes do novo insert.

Important: `resetPassword` passou a consumir o codigo, alterar a password e revogar todos os refresh tokens activos do utilizador na mesma transaccao.

Important: duplicados por identificador passam a devolver `ConflictException` com mensagem controlada em portugues quando o erro e especificamente `23505`. Erros desconhecidos continuam a subir sem serem convertidos em conflito.

Minor: `register` passou a persistir `email` em `user_profiles.email` quando fornecido. O login primario continua por phone, via `loginIdentifierHash`.

Adjudicacao `/auth/me`: nao alterei o contrato. A Tarefa 5 especifica `request.user = { id: payload.sub, roles: payload.roles }`, logo o `AuthenticatedUser { id, roles }` actual ja e compativel.

### GREEN

Comando:

```bash
corepack pnpm --filter @ndjar/api test -- auth.repository.test.ts auth.service.test.ts
```

Resultado depois da implementacao:

```text
Test Files  5 passed (5)
Tests       34 passed (34)
```

Nota: pela configuracao actual do Vitest, o filtro tambem executa os restantes testes da API.

Comando final:

```bash
corepack pnpm --filter @ndjar/api test -- auth.controller.test.ts
```

Resultado:

```text
Test Files  5 passed (5)
Tests       35 passed (35)
```

Comando final:

```bash
corepack pnpm --filter @ndjar/api test
```

Resultado:

```text
Test Files  5 passed (5)
Tests       35 passed (35)
```

Comando final:

```bash
corepack pnpm --filter @ndjar/api typecheck
```

Resultado:

```text
tsc -p tsconfig.json --noEmit
```

Exit code: 0.

Comando final:

```bash
corepack pnpm --filter @ndjar/api lint
```

Resultado:

```text
All matched files use Prettier code style!
```

Comando final:

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

### Self-review das correccoes

Os testes novos continuam sem PostgreSQL real. A semantica de replay foi coberta por mock da interface de transaccao, provando que quando o `UPDATE ... RETURNING` nao reclama a linha, o repository nao emite novo token. A garantia concorrente final depende do comportamento atomico normal do `UPDATE` condicional em PostgreSQL.

Nao foram adicionados logs de codigos, tokens ou segredos.

Nao alterei `.superpowers/sdd/progress.md`.

## Final review fix

### RED

Foram adicionados testes em `apps/api/src/modules/auth/auth.repository.test.ts` para rejeitar tokens de refresh com selector nao UUID, UUID nao canonico, segredo fora de base64url, segredo curto, segredo longo e pontos adicionais. Tambem foi adicionado um teste para confirmar que `rotateRefreshToken` e `revokeRefreshToken` nao iniciam transaccao para token invalido.

Comando:

```bash
corepack pnpm --filter @ndjar/api test -- auth.repository.test.ts
```

Resultado observado antes da implementacao:

```text
Test Files  1 failed | 4 passed (5)
Tests       4 failed | 35 passed (39)
```

Falhas relevantes:

```text
expected parseRefreshToken(`not-a-uuid...`) to be null
expected segredo curto a ser rejeitado
expected token com ponto adicional a ser rejeitado
expected rotateRefreshToken(token invalido) to be null
```

### Decisao

`parseRefreshToken` passou a aceitar apenas o formato emitido por `newRefreshTokenParts`: `selector.secret`, com selector UUID canonico em minusculas e segredo base64url com exactamente 64 caracteres, que e o comprimento produzido por `randomBytes(48).toString("base64url")`.

A validacao ficou no repository, antes de `requireDatabase()` e antes de `transaction()`. Nao apertei `refreshSchema` nem `logoutSchema` para evitar duplicar regex fragil entre DTO e persistence. A camada de seguranca que protege PostgreSQL fica assim imediatamente antes da query, e o service continua a receber comportamento controlado: refresh invalido devolve `null`, logout invalido nao faz nada.

Nao foi alterado o formato emitido de tokens validos.

### GREEN

Comando:

```bash
corepack pnpm --filter @ndjar/api test -- auth.repository.test.ts
```

Resultado:

```text
Test Files  5 passed (5)
Tests       39 passed (39)
```

Comando:

```bash
corepack pnpm --filter @ndjar/api test -- auth.controller.test.ts
```

Resultado:

```text
Test Files  5 passed (5)
Tests       39 passed (39)
```

Comando:

```bash
corepack pnpm --filter @ndjar/api test
```

Resultado:

```text
Test Files  5 passed (5)
Tests       39 passed (39)
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
