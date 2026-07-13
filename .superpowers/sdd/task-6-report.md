# Tarefa 6: Admin Login And Protected Admin Shell

## RED

Foram acrescentados testes antes da implementação para a página de login, o proxy de login, o logout, a validação remota de sessão e o middleware. A primeira execução falhou porque os módulos ainda não existiam. Foi também acrescentado um teste para rotas fora de `/admin`; falhou porque o middleware redireccionava qualquer rota sem cookie e foi corrigido antes do ciclo GREEN.

## GREEN

O proxy aceita a sessão de login apenas quando `session.user.roles` contém `admin`. Define o cookie `ndjar_admin_access` com `httpOnly`, `sameSite=lax`, `path=/`, `secure` em produção e duração de 15 minutos. O layout de `/admin` consulta `GET ${NDJAR_API_URL}/auth/me` com `Authorization: Bearer`, `cache: no-store` e permite apenas a role `admin`. Falhas de token, role, API, configuração ou JSON são tratadas com redireccionamentos genéricos, sem expor detalhes internos. O middleware continua a ser apenas o filtro inicial de cookie e deixa o cookie presente seguir para validação no servidor. O logout invalida o cookie no mesmo caminho.

## Ficheiros

- `apps/web/app/admin/layout.tsx`
- `apps/web/app/admin/login/page.tsx`
- `apps/web/app/admin/login/page.test.tsx`
- `apps/web/app/admin/page.tsx`
- `apps/web/app/api/admin/login/route.ts`
- `apps/web/app/api/admin/login/route.test.ts`
- `apps/web/app/api/admin/logout/route.ts`
- `apps/web/app/api/admin/logout/route.test.ts`
- `apps/web/app/globals.css`
- `apps/web/lib/admin-session.ts`
- `apps/web/lib/admin-session.test.ts`
- `apps/web/middleware.ts`
- `apps/web/middleware.test.ts`

## Preocupações

A sessão inválida é ignorada e redireccionada pelo layout. Um cookie expirado pode manter-se no navegador até expirar ou até ao logout porque Server Components não podem alterar cookies directamente. Isto não permite acesso ao painel, pois a validação remota é sempre a autoridade. A política actual aceita apenas o valor de role `admin`, como definido para esta tarefa; uma futura política para `super_admin` exige alteração explícita e testes próprios.
