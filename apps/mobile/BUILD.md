# Builds Android da N'djar

## APK de apresentação

O ficheiro criado pelo processo actual é um APK de apresentação autónomo para
testes internos. Inclui o bundle JavaScript e não precisa do servidor Metro,
mas usa assinatura de depuração e uma arquitectura Android limitada. Este APK não é uma release assinada e não deve ser enviado para a Play Store nem distribuído como
versão de produção.

Este APK permite validar navegação, conteúdo local e aspecto visual. Pagamentos,
autenticação, notificações, envio ao Médico Agrícola, câmara, sincronização e
logout permanecem indisponíveis ou claramente identificados como demonstração.

## Release de produção

Uma release instalável para distribuição exige, pelo menos:

1. Credencial de assinatura guardada fora do repositório.
2. Build Android `release`, sem dependências de desenvolvimento.
3. Versionamento de `versionCode` e `versionName`.
4. Bundle AAB para a Play Store e APKs de teste por arquitectura.
5. Verificação de integridade, permissões, política de privacidade e actualização.
6. Testes em dispositivos físicos antes da publicação.
