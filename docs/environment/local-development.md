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
Remove-Item function:New-NdjarRuntimeSecret

corepack pnpm --filter @ndjar/database exec drizzle-kit push
corepack pnpm --filter @ndjar/api dev
```

O comando `drizzle-kit push` é adequado para desenvolvimento local. A produção precisa de migrações versionadas antes do primeiro lançamento.

## Web

O Next.js carrega o ficheiro local dentro do próprio pacote.

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
corepack pnpm --filter @ndjar/web dev
```

O ficheiro `apps/web/.env.local` é ignorado pelo Git. Nunca coloques palavras-passe, tokens ou segredos JWT em ficheiros rastreados.
