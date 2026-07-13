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
