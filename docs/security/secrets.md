Segredos e credenciais

Incidente

Um commit de testes introduziu passwords de exemplo com valores fixos. O GitGuardian classificou-as como Generic Password. As strings nao eram credenciais reais mas o padrao era inseguro e o alerta era correcto. As fixtures usam agora valores aleatorios gerados durante cada execucao.

Regra

Nunca guardar credenciais reais, tokens, chaves ou segredos no repositorio. Os campos de configuracao sensiveis no ficheiro .env.example ficam vazios. Define-os apenas no ambiente local, no sistema de configuracao do servico ou no fornecedor de segredos.

Verificacao

Executa py -m pre_commit run detect-secrets --all-files. Para instalar a proteccao local, executa py -m pre_commit install. O hook detect-secrets bloqueia novos segredos e nao usa uma baseline que silencie o repositorio.

GitGuardian

Depois de autenticar o ggshield com a chave de API apropriada, pode activar-se a verificacao pre-push com ggshield secret install --mode pre-push. Nao a activar antes da autenticacao porque impediria commits por erro de autenticacao.

Proteccao de pull requests

O scan normal corre apenas em push. O scan de pull requests corre em pull_request_target com a configuracao copiada da base protegida antes de obter o conteudo do PR. pull_request_target nunca pode executar scripts, package managers ou codigo do PR. Todos os checkouts desactivam a persistencia de credenciais. A proteccao da branch deve exigir o check confiavel e a revisao CODEOWNERS de todos os workflows. GitGuardian continua activo como verificacao externa independente.

Lockfile

O primeiro hook exclui pnpm-lock.yaml para evitar milhares de falsos positivos nos hashes de integridade. Um segundo hook analisa apenas esse ficheiro com os detectores de entropia desactivados. Os restantes detectores continuam activos e podem detectar chaves, tokens e palavras-passe associados a nomes sensiveis.

Pedidos administrativos

Os handlers de login e logout aceitam apenas pedidos POST cuja origem coincide com a origem publica do pedido. Esta verificacao complementa o cookie SameSite. Deve manter-se quando forem adicionadas mutacoes administrativas.

Segredo real

Se um segredo real chegar ao repositorio, revoga-o ou roda-o de imediato. Confirma que a nova credencial esta guardada fora do repositorio. So depois remove o valor dos ficheiros e avalia a limpeza de historico segundo o processo de resposta a incidentes. Marca este incidente no GitGuardian como credencial de teste ou falso positivo depois da correccao.
