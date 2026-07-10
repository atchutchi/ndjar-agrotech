# Relatório da Tarefa 2

## Estado

Concluída.

## Implementação

Foi criado `packages/domain/src/auth.ts` com:

- `NDJAR_ROLES` para `farmer`, `agricultural_doctor`, `admin` e `super_admin`.
- `PAID_FEATURES` para `map`, `crop_details`, `forum` e `agricultural_doctor`.
- Os tipos `NdjarRole`, `PaidFeature` e `EntitlementSnapshot`.
- `canAccessAdmin`, que permite apenas `admin` e `super_admin`.
- `hasEntitlement`, que exige uma entitlement activa e sem expiração ou com expiração posterior ao instante de avaliação.

Foi criado `packages/domain/src/auth.test.ts` seguindo TDD. O teste foi executado antes da implementação e falhou porque `auth.ts` não existia. Depois da implementação passou.

Foi actualizado `packages/domain/src/index.ts` para exportar as regras de autenticação.

## Validação

- `corepack pnpm --filter @ndjar/domain test -- auth.test.ts`: passou, 4 ficheiros de teste e 27 testes.
- `corepack pnpm --filter @ndjar/domain typecheck`: passou.
- `corepack pnpm --filter @ndjar/domain lint`: passou.

`pnpm` não estava disponível directamente no PATH da sessão Windows. Foi usado `corepack pnpm`, que executou a versão 11.7.0.

## Commit

Foi criado o commit `a59bf67` com a mensagem `feat: add auth domain rules`.

## Correcção de revisão

Foi mantido `EntitlementSnapshot.featureKey` como `string` porque o campo correspondente na base de dados é texto. Foi acrescentado um teste que confirma que uma entitlement activa de outra funcionalidade é negada.

Foram acrescentados testes para entitlement inactiva, expirada, de funcionalidade diferente e activa sem data de expiração.

Comandos executados:

- `corepack pnpm --filter @ndjar/domain test -- auth.test.ts`: passou, 4 ficheiros de teste e 29 testes.
- `corepack pnpm --filter @ndjar/domain typecheck`: passou.
- `corepack pnpm --filter @ndjar/domain lint`: passou.
- `git diff --check`: passou.
