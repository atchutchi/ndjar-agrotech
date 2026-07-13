# Ambiente local

O ficheiro `.env.example` na raiz documenta o contrato comum. A API não carrega ficheiros `.env` automaticamente. As variáveis da API devem ser definidas no terminal que executa o processo.

## API em modo fixture

Este modo permite consultar as rotas suportadas por fixtures sem PostgreSQL. `NDJAR_DATABASE_MODE=fixture desactiva` o fornecedor de base de dados. Login, recuperação de palavra-passe e entitlements reais não funcionam neste modo.

```powershell
$env:NDJAR_DATABASE_MODE = "fixture"
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:JWT_ACCESS_SECRET -ErrorAction SilentlyContinue
corepack pnpm --filter @ndjar/api dev
```

## API com PostgreSQL

Este modo é necessário para autenticação e entitlements reais. A instância PostgreSQL deve ter PostGIS activo e o esquema aplicado.

```powershell
$env:NDJAR_DATABASE_MODE = "postgres"
$env:DATABASE_URL = Read-Host "DATABASE_URL"

function New-NdjarRuntimeSecret {
  $bytes = [byte[]]::new(48)
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}
$env:JWT_ACCESS_SECRET = New-NdjarRuntimeSecret

corepack pnpm --filter @ndjar/database exec drizzle-kit push

$env:NDJAR_ALLOW_LOCAL_ADMIN_BOOTSTRAP = "true"
$env:NDJAR_ADMIN_IDENTIFIER = Read-Host "Identificador do administrador"
$env:NDJAR_ADMIN_NAME = Read-Host "Nome do administrador"
$env:NDJAR_ADMIN_PASSWORD = New-NdjarRuntimeSecret
$env:NDJAR_ADMIN_ROLE = "admin"
corepack pnpm --filter @ndjar/api db:create-local-admin

Remove-Item Env:NDJAR_ADMIN_PASSWORD
$env:NDJAR_ALLOW_LOCAL_ADMIN_BOOTSTRAP = "false"
Remove-Item function:New-NdjarRuntimeSecret
corepack pnpm --filter @ndjar/api dev
```

O comando `drizzle-kit push` é adequado para desenvolvimento local. A produção precisa de migrações versionadas antes do primeiro lançamento.

O comando `db:create-local-admin` exige PostgreSQL, recusa `NODE_ENV=production` e só arranca quando `NDJAR_ALLOW_LOCAL_ADMIN_BOOTSTRAP=true`. Define `NDJAR_ADMIN_IDENTIFIER` e `NDJAR_ADMIN_NAME` no terminal. Gera `NDJAR_ADMIN_PASSWORD` em memória com pelo menos 16 caracteres. Usa `NDJAR_ADMIN_ROLE=admin` por defeito e reserva `super_admin` para operações que precisem desse privilégio. O comando recusa um identificador existente. Depois da criação, apaga a palavra-passe do processo e desactiva novamente o bootstrap.

## Web

O Next.js carrega o ficheiro local dentro do próprio pacote.

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
corepack pnpm --filter @ndjar/web dev
```

`NDJAR_PUBLIC_ORIGIN` deve conter a origem pública canónica da web. Em produção usa o URL HTTPS publicado. `NDJAR_TRUST_PROXY_HEADERS` fica `false` por defeito. Activa-o apenas atrás de um proxy controlado que substitua sempre `X-Forwarded-Host` e `X-Forwarded-Proto`. Sem origem canónica ou proxy explicitamente confiado, os pedidos administrativos falham fechados em produção.

O ficheiro `apps/web/.env.local` é ignorado pelo Git. Nunca coloques palavras-passe, tokens ou segredos JWT em ficheiros rastreados.
