# Tarefa 5: Access Token Guard And Role Guard

## RED

Foram acrescentados testes ao AuthGuard e testes novos ao RolesGuard antes da
implementacao do RolesGuard. O comando focado falhou porque o modulo
`./roles.guard.js` ainda nao existia. A falha confirmou que os testes exercem
uma interface ainda ausente e nao uma implementacao ja existente.

Os casos cobrem a ausencia de requisitos de papel, autorizacao por qualquer
papel exigido, utilizador sem o papel exigido, pedido protegido sem utilizador
autenticado e metadata criada por `@Roles`. Os testes do AuthGuard continuam a
confirmar a atribuicao de `request.user` com `id` e `roles`, a ausencia de
Bearer JWT e JWT invalido. As mensagens validadas em runtime sao exactamente
`Sessão obrigatória` e `Permissão insuficiente`.

## GREEN

Foi criado o RolesGuard com Reflector e o decorator `@Roles(...roles)`. O guard
usa `getAllAndOverride`, pelo que a metadata do handler prevalece sobre a da
classe, permite rotas sem metadata e exige pelo menos um papel em comum nas
rotas protegidas. A ausencia de `request.user` numa rota protegida resulta em
ForbiddenException com a mensagem exigida.

O AuthGuard manteve a interface existente: depois de validar o access token,
atribui `request.user = { id: payload.sub, roles: payload.roles }`. As
mensagens de sessao mantem o valor exacto, evitando a codificacao incorrecta
apresentada no brief.

O AuthModule passou a disponibilizar AuthGuard e RolesGuard como providers e
exports para os futuros modulos consumidores.

## Ficheiros

Foram alterados `apps/api/src/modules/auth/auth.guard.test.ts` e
`apps/api/src/modules/auth/auth.module.ts`.

Foi criado `apps/api/src/modules/auth/roles.guard.ts`.

## Self-review

O RolesGuard conserva a interface `Roles(...roles: string[])` prevista no
brief e reutiliza `AuthenticatedUser` atraves de `Pick` para a forma de
`request.user`. Nao foram introduzidos novos papeis nem alterados os tipos de
papel existentes. A verificacao e OR entre papeis, conforme o exemplo do
brief. Nao foram criados nem modificados controladores de administracao,
mapas, culturas, forum, pagamentos ou consultas.

## Verificacao

`corepack pnpm --filter @ndjar/api test -- auth.guard.test.ts` passou com 48
testes em 6 ficheiros. O comando disponibilizado pelo projecto encaminha esse
argumento para o Vitest depois de `--`, pelo que tambem executou a suite da API.

`corepack pnpm --filter @ndjar/api test` passou com 48 testes em 6 ficheiros.
`corepack pnpm --filter @ndjar/api typecheck` passou. `corepack pnpm --filter
@ndjar/api lint` passou. `git diff --check` passou sem erros.

## Preocupacoes

Os guards estao disponiveis no AuthModule, mas nao sao globais nem foram
aplicados a controladores futuros. Essa aplicacao deve ser feita na tarefa que
introduzir cada endpoint protegido para evitar alargar o ambito desta tarefa.
Os testes do RolesGuard usam um duplo pequeno de Reflector para isolar a regra
de autorizacao. A integracao com metadata real e coberta pelo teste do
decorator; um teste HTTP de um futuro controlador protegido devera validar a
composicao completa.
