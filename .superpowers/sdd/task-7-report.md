# Task 7: API Entitlement Check Endpoint

## RED/GREEN

- RED: a recuperação confirmou o risco indicado para uma chave extra no contrato. A cobertura existente usa `toEqual` para a resposta inteira, por isso uma chave como `todos` falharia o teste do serviço.
- GREEN: o estado actual devolve exactamente `agriculturalDoctor`, `cropDetails`, `forum` e `map`. A suite dirigida passou sem alterações de produção adicionais.

## Ficheiros

- `apps/api/src/modules/entitlements/entitlements.controller.ts`
- `apps/api/src/modules/entitlements/entitlements.service.ts`
- `apps/api/src/modules/entitlements/entitlements.repository.ts`
- `apps/api/src/modules/entitlements/entitlements.controller.test.ts`
- `apps/api/src/app.module.ts`

## Decisões

- O identificador do utilizador provém exclusivamente de `request.user.id` depois de `AuthGuard`.
- O repositório consulta entitlements e subscrições por `userId`; a subscrição é ordenada por `startsAt`, `createdAt` e `id` de forma descendente.
- O serviço aceita `now` como argumento para tornar a validade temporal controlável nos testes e delega a decisão em `hasEntitlement` e `PAID_FEATURES` de `@ndjar/domain`.
- Features desconhecidas são excluídas antes da avaliação. Entitlements inactivos ou expirados não concedem acesso.
- Em modo fixture, `DATABASE` é `null`, o módulo constrói e `EntitlementsRepository` falha explicitamente antes de devolver qualquer entitlement.
- O endpoint é registado em `AppModule` e não aceita `userId` vindo do cliente.

## Self-review

- Confirmei que não existe a chave `todos` em `entitlements.service.ts`.
- Confirmei que não existem features adicionais na resposta.
- Confirmei autenticação obrigatória, falha fechada sem `user`, isolamento por utilizador e ordenação determinística.
- Não foram adicionadas alterações fora do âmbito da Tarefa 7.

## Validação

- `corepack pnpm --filter @ndjar/api exec vitest run src/modules/entitlements/entitlements.controller.test.ts --pool=forks --maxWorkers=1 --fileParallelism=false`: 7 testes passaram.
- A suite integral passou em modo serial: 55 testes passaram.
- `corepack pnpm --filter @ndjar/api typecheck`, `corepack pnpm --filter @ndjar/api lint`, `git diff --check` e `py -m pre_commit run detect-secrets --all-files` passaram.
- O comando padrão `corepack pnpm --filter @ndjar/api test` continua instável sob execução paralela: o teste pré-existente `AuthRepository > rejeita replay quando a reclamacao atomica ja nao devolve linha` excede ocasionalmente os 5 segundos. Não alterei esse teste fora do âmbito da Tarefa 7.

## Independent review fixes

### RED/GREEN

- RED: a nova cobertura SQL falhou primeiro porque o mock de `orderBy` foi lido como tuplos e porque `PgDialect` inclui metadados de tipo. Corrigi apenas a instrumentação de teste para extrair os argumentos e comparar SQL mais parâmetros. A query de produção já estava correcta e não foi alterada.
- GREEN: a serialização com `PgDialect` prova agora `"entitlements"."user_id" = $1` e `"subscriptions"."user_id" = $1`, ambas com `user-1`, e prova a ordenação exacta `starts_at DESC`, `created_at DESC`, `id DESC`, seguida de `LIMIT 1`.
- RED: a suite paralela anterior excedia o timeout de cinco segundos ao calcular hashes Argon2 com os parâmetros de produção dentro de `auth.repository.test.ts`.
- GREEN: `testHash` usa hashes Argon2 reais com `memoryCost: 8`, `timeCost: 1` e `parallelism: 1`. A verificação de produção não foi mockada, o timeout não foi alterado e duas execuções paralelas completas passaram.

### Ficheiros

- `apps/api/src/modules/entitlements/entitlements.controller.test.ts`
- `apps/api/src/modules/auth/auth.repository.test.ts`

### Comandos e resultados

- `corepack pnpm --filter @ndjar/api test -- entitlements.controller.test.ts auth.repository.test.ts`: 55 testes passaram.
- `corepack pnpm --filter @ndjar/api test`: 55 testes passaram, duas vezes consecutivas em modo paralelo padrão.
- `corepack pnpm --filter @ndjar/api typecheck`: passou.
- `corepack pnpm --filter @ndjar/api lint`: passou.
- `git diff --check`: passou.
- `py -m pre_commit run detect-secrets --all-files`: passou.
