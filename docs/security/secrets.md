# Segredos e credenciais

## Incidente

Um commit de testes introduziu palavras-passe de exemplo com valores fixos. O GitGuardian classificou-as como Generic Password. As strings não eram credenciais reais, mas o padrão era inseguro e o alerta era correcto. Os testes geram agora os valores durante cada execução.

## Regra

Nunca guardar credenciais reais, tokens, chaves, palavras-passe ou segredos de exemplo no repositório. Os campos sensíveis no `.env.example` ficam vazios. Define-os apenas no processo local, no sistema de configuração do serviço ou num fornecedor de segredos.

O scanner adicional detecta atribuições literais a nomes sensíveis como password, secret, token, API key e variantes. Também detecta credenciais incorporadas em URLs de base de dados. Valores dinâmicos gerados durante a execução e campos vazios são permitidos.

## Regra de allowlist

`pragma: allowlist secret` é proibido em código e configuração comum. O scanner só o aceita em `.pre-commit-config.yaml`, `tools/security/`, `docs/security/`, nos workflows `secret-scan` e no relatório de segurança legado explicitamente listado. Todos esses caminhos têm proprietário obrigatório em `.github/CODEOWNERS`. Um pragma fora destes caminhos é um finding, mesmo quando não existe outra credencial na linha.

## Verificação local

Instala o hook com:

```powershell
python -m pre_commit install
```

Verifica o tree actual com:

```powershell
python -m pre_commit run --all-files
python tools/security/scan_git_history.py --tree
```

Verifica todos os commits novos de um intervalo com:

```powershell
python tools/security/scan_git_history.py --base 82ea27f --head HEAD
```

O hook `detect-secrets` existente mantém-se activo. O hook local `generic-credential-tree` cobre credenciais genéricas que os detectores de entropia podem não reconhecer. O gate de histórico recebe sempre uma base e um head explícitos no CI.

## Push e pull request

Os workflows usam `fetch-depth: 0`. Num push, o intervalo é `github.event.before..github.sha`. Num pull request, o intervalo é `github.event.pull_request.base.sha..github.event.pull_request.head.sha`. O scanner percorre cada commit do intervalo. Assim, uma credencial introduzida e apagada num commit posterior continua a bloquear o processo.

O workflow de pull request corre em `pull_request_target`. Primeiro obtém a base protegida e copia a configuração do pre-commit e o scanner para `RUNNER_TEMP`. Só depois obtém o conteúdo do PR. A análise usa exclusivamente essas cópias protegidas. O workflow não executa scripts, gestores de pacotes ou configuração do PR. Todos os checkouts usam `persist-credentials: false`.

A protecção da branch deve exigir o check confiável e a revisão CODEOWNERS de todos os workflows. O GitGuardian mantém-se como verificação externa independente.

## Lockfile

O primeiro hook exclui `pnpm-lock.yaml` para evitar falsos positivos nos hashes de integridade. Um segundo hook analisa apenas esse ficheiro com os detectores de entropia desactivados. Os restantes detectores continuam activos e o scanner genérico verifica atribuições sensíveis sem interpretar versões de pacotes como credenciais.

## Pedidos administrativos

Os handlers de login e logout aceitam apenas pedidos POST cuja origem coincide com `NDJAR_PUBLIC_ORIGIN`. Cabeçalhos de proxy só são aceites quando `NDJAR_TRUST_PROXY_HEADERS=true`. Esta opção deve ser usada apenas quando um proxy controlado substitui sempre esses cabeçalhos. Em produção, a ausência de uma origem canónica ou de um proxy explicitamente confiado provoca uma falha fechada.

## Resposta a um segredo real

Se um segredo real chegar ao repositório, revoga-o ou roda-o de imediato. Confirma que a nova credencial está guardada fora do repositório. Só depois remove o valor dos ficheiros e avalia a limpeza de histórico segundo o processo de resposta a incidentes. No GitGuardian, classifica o incidente apenas depois de corrigir a origem do problema.
