# Tarefa 6: Admin Login And Protected Admin Shell

## RED

Foram acrescentados testes de regressão antes da correcção. O cenário de credenciais inválidas falhou com `expected "spy" to be called 1 times, but got 2 times`, confirmando que o `redirect()` chamado dentro do `try` era recapturado pelo `catch`. Foram também acrescentados testes directos para `NDJAR_API_URL` ausente, indisponibilidade da API e texto administrativo em pt-PT sem mojibake.

## GREEN

O proxy decide a sessão dentro do `try`, que cobre apenas configuração, chamada à API e parsing. O redireccionamento acontece uma única vez fora do `catch`: para o painel quando a sessão é válida ou para um erro genérico quando falha. O proxy continua a aceitar apenas `session.user.roles` com `admin`, não define cookie em qualquer falha e não expõe detalhes internos. A página administrativa é validada por teste de renderização com texto pt-PT e rejeição de caracteres de mojibake.

## Independent review fixes

- O `redirect()` deixou de ser chamado dentro do `try` do proxy de login. Os redireccionamentos já não são recapturados e o teste confirma uma só chamada no cenário de credenciais inválidas.
- Foram acrescentados testes directos para configuração da API ausente e API indisponível. Ambos falham fechados, não definem cookie e usam o destino genérico `/admin/login?error=invalid`.
- A codificação UTF-8 da página administrativa foi confirmada por leitura de bytes e protegida por teste de renderização. Os textos principais usam pt-PT correcto e o teste falha perante caracteres de mojibake.
- Este relatório foi reescrito em UTF-8 legível.

## Ficheiros

- `apps/web/app/admin/page.tsx`
- `apps/web/app/admin/page.test.tsx`
- `apps/web/app/api/admin/login/route.ts`
- `apps/web/app/api/admin/login/route.test.ts`
- `.superpowers/sdd/task-6-report.md`

## Comandos e resultados

- `corepack pnpm --filter @ndjar/web test -- admin/login/page.test.tsx app/api/admin/login/route.test.ts`: passou, 8 ficheiros e 20 testes.
- `corepack pnpm --filter @ndjar/web test`: passou, 8 ficheiros e 20 testes.
- `corepack pnpm --filter @ndjar/web typecheck`: passou.
- `corepack pnpm --filter @ndjar/web lint`: passou.
- `git diff --check`: passou.
- `py -m pre_commit run detect-secrets --all-files`: passou. O executável `pre-commit` não está no PATH, mas o módulo Python instalado executa o mesmo hook.

## Preocupações

A política actual aceita apenas a role `admin`, como exigido. A introdução futura de outros papéis administrativos, incluindo `super_admin`, exige decisão explícita e cobertura própria. A indisponibilidade da API bloqueia o acesso ao painel por desenho e devolve apenas um redireccionamento genérico.
