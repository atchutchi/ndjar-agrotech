# N'djar Production Platform Design

Data: 2026-07-10

Estado: aprovado para planeamento de implementação

## Objectivo

Transformar o protótipo N'djar numa plataforma operacional para agricultores, consultores agrícolas e administradores. A versão final deve suportar autenticação completa, subscrição, fórum, Médico Agrícola, mapa real da Guiné-Bissau com dados GPS, gestão de culturas, gestão de solos, pagamentos, notificações e administração de conteúdos.

O produto continua mobile first para Android. A web fica dividida entre site público e backoffice administrativo.

## Decisão de Arquitectura

### Stack principal

- Mobile: React Native com Expo, Android primeiro.
- Web e Admin: Next.js.
- API: NestJS.
- Base de dados: PostgreSQL com PostGIS.
- ORM: Drizzle.
- Mapas: MapLibre ou Mapbox no mobile e no admin.
- Storage: S3 compatível para fotografias, documentos e anexos.
- Notificações: Firebase Cloud Messaging para push mobile.
- Pagamentos: integração por fases com Orange Money e TeleTaku.
- IA: robot determinístico com respostas aprovadas, sem aconselhamento livre não validado.

### Princípio central

O N'djar não deve apresentar dados agrícolas estimados como verdade técnica. Cada recomendação, amostra, zona, cultura e resposta deve ter fonte, estado de validação e responsável.

Estados recomendados:

- `draft`: criado por admin, ainda não publicado.
- `field_observed`: observado no terreno.
- `estimated`: inferido ou aproximado.
- `example`: dado de demonstração.
- `self_reported`: reportado por agricultor.
- `lab_validated`: validado por laboratório.
- `consultant_reviewed`: revisto por consultor.
- `published`: visível para utilizadores.
- `archived`: retirado da experiência pública.

## Perfis e Permissões

### Agricultor

Pode criar conta, iniciar sessão, editar perfil, subscrever, consultar calendário, ver mapa, consultar culturas, criar perguntas no fórum, enviar mensagens ao Médico Agrícola, anexar fotografias e pedir consulta presencial.

### Consultor agrícola

Pode responder perguntas encaminhadas, responder tópicos com selo verificado, ver histórico técnico, consultar fotos e contexto agrícola, fechar consulta, marcar necessidade de visita presencial e registar parecer técnico.

### Admin

Pode gerir regiões, sectores, tabancas, parcelas, culturas, pH, tipo de solo, conteúdos do calendário, biblioteca, fórum, consultores, subscrições, preços, notificações e publicações no mapa.

### Super admin

Pode gerir administradores, permissões, parâmetros de pagamento, auditoria, regras de publicação e políticas críticas.

## User Stories Completas

### Agricultor

Como agricultor, quero criar conta com telefone, email ou ambos para conseguir recuperar acesso e receber notificações.

Como agricultor, quero confirmar a minha conta por código para proteger o meu perfil.

Como agricultor, quero recuperar a minha senha por código para não perder o acesso.

Como agricultor, quero editar nome, telefone, comunidade, idioma, culturas e parcelas para receber informação mais útil.

Como agricultor, quero subscrever com Orange Money ou TeleTaku para desbloquear mapa, fórum e Médico Agrícola.

Como agricultor, quero ver calendário agrícola grátis para saber as épocas de preparação, plantação, capinação e colheita.

Como agricultor, quero ver no mapa as zonas agrícolas da Guiné-Bissau para entender onde posso cultivar.

Como agricultor, quero clicar numa zona do mapa e ver pH, tipo de solo, culturas recomendadas, limitações e necessidade de amostra.

Como agricultor, quero pesquisar uma cultura e ver pH de referência, época, manejo e compatibilidade por região.

Como agricultor, quero criar uma pergunta no fórum com texto, cultura, região e fotografia para pedir apoio à comunidade.

Como agricultor, quero receber notificação quando alguém responder à minha pergunta.

Como agricultor, quero enviar mensagem ao Médico Agrícola para receber assistência técnica dentro da app.

Como agricultor, quero pedir visita presencial e ver preço antes de confirmar.

Como agricultor, quero ver histórico de consultas, respostas e recomendações.

Como agricultor, quero poder usar dados já carregados quando estiver com internet fraca.

### Consultor

Como consultor, quero iniciar sessão com perfil próprio para separar respostas técnicas de respostas comuns.

Como consultor, quero ver fila de perguntas por prioridade para responder primeiro os casos urgentes.

Como consultor, quero ver fotografias, cultura, região, pH, histórico e estado de subscrição antes de responder.

Como consultor, quero responder com texto estruturado para que o agricultor entenda acção, risco e próximo passo.

Como consultor, quero marcar uma consulta como resolvida, em espera, precisa de foto, precisa de amostra ou precisa de visita.

Como consultor, quero ver pedidos presenciais com local, preço, transporte e alojamento para aceitar ou recusar.

Como consultor, quero transformar uma resposta boa em template aprovado para o robot usar no futuro.

### Admin

Como admin, quero criar e editar regiões no mapa usando polígonos ou coordenadas GPS.

Como admin, quero criar sectores, tabancas, parcelas e zonas agrícolas para organizar os dados da Guiné-Bissau.

Como admin, quero associar culturas, pH, tipo de solo e recomendações a cada zona.

Como admin, quero marcar se os dados são estimados, observados, laboratoriais ou revistos por consultor.

Como admin, quero publicar conteúdos só depois de validação para reduzir risco agrícola.

Como admin, quero adicionar culturas novas com imagem, pH, época, solo recomendado, riscos e calendário.

Como admin, quero moderar fórum e remover conteúdo perigoso.

Como admin, quero gerir preços de subscrição e consultoria presencial.

Como admin, quero ver pagamentos, subscrições activas e utilizadores bloqueados.

Como admin, quero enviar notificações para agricultores por região, cultura ou tema.

Como admin, quero ver métricas de uso, consultas, tópicos e zonas mais consultadas.

## Fluxo do Agricultor

1. Abre app.
2. Vê splash N'djar.
3. Escolhe idioma.
4. Cria conta ou entra.
5. Confirma conta por código.
6. Vê home com blocos: Calendário, Mapa, Subscrição, Informações do Cultivo, Fórum, Médico Agrícola, Sobre nós e Contacto.
7. Pode usar calendário grátis.
8. Ao tentar aceder módulos pagos, vê plano Agricultor.
9. Paga com Orange Money ou TeleTaku.
10. Recebe confirmação e acesso.
11. Consulta mapa, cultura ou fórum.
12. Cria pergunta com imagem se precisar.
13. Recebe resposta da comunidade ou consultor.
14. No Médico Agrícola, escolhe chat incluído ou consulta presencial paga.
15. Acompanha estado até resposta ou visita.

## Fluxo do Consultor

1. Entra no painel consultor.
2. Vê fila de perguntas.
3. Filtra por cultura, região, urgência e tempo restante.
4. Abre detalhe.
5. Consulta dados do agricultor, fotos, mapa, pH e histórico.
6. Responde com parecer técnico.
7. Define estado da consulta.
8. Se for presencial, propõe pacote, custo logístico e data.
9. Pode transformar resposta em template para revisão.

## Fluxo do Admin

1. Entra no admin web.
2. Vê dashboard com utilizadores, subscrições, consultas, fórum e mapa.
3. Gere mapa real da Guiné-Bissau.
4. Desenha região, sector, tabanca, parcela ou zona agrícola.
5. Adiciona pH, solo, culturas, fotos, documentos e fonte.
6. Publica ou guarda como rascunho.
7. Gere culturas e calendário.
8. Modera fórum.
9. Gere consultores e preços.
10. Envia notificações.
11. Audita alterações críticas.

## Modelo de Dados

### Autenticação

Tabelas:

- `users`
- `user_profiles`
- `auth_accounts`
- `password_reset_codes`
- `verification_codes`
- `refresh_tokens`
- `roles`
- `user_roles`

Campos críticos:

- telefone normalizado.
- email opcional.
- senha com hash Argon2.
- estado de verificação.
- idioma.
- região principal.
- data de última sessão.

### Subscrições e pagamentos

Tabelas:

- `plans`
- `subscriptions`
- `payment_providers`
- `payment_attempts`
- `payment_receipts`
- `entitlements`

Regras:

- O calendário fica gratuito.
- Mapa, fórum, culturas detalhadas e Médico Agrícola exigem subscrição activa.
- Pagamento deve ter estado `pending`, `confirmed`, `failed`, `expired` ou `refunded`.
- O backend decide acesso. A app nunca deve confiar apenas em estado local.

Assets já preparados:

- `apps/mobile/assets/payments/orange-money.png`
- `apps/mobile/assets/payments/teletaku.png`

### Mapa e PostGIS

Tabelas:

- `countries`
- `regions`
- `sectors`
- `communities`
- `land_zones`
- `parcels`
- `soil_profiles`
- `soil_samples`
- `zone_crop_suitability`
- `map_layers`
- `map_layer_versions`

Geometria:

- país: `MultiPolygon`.
- região: `MultiPolygon`.
- sector: `MultiPolygon`.
- tabanca: `Point` ou `Polygon`.
- zona agrícola: `Polygon` ou `MultiPolygon`.
- parcela: `Polygon`.
- amostra: `Point`.

Cada zona deve guardar:

- nome.
- tipo de solo.
- pH mínimo, máximo e médio.
- culturas recomendadas.
- culturas com risco.
- pastagem possível.
- limitações.
- fonte.
- estado de validação.
- data de recolha.
- responsável.

### Culturas

Tabelas:

- `crops`
- `crop_images`
- `crop_ph_ranges`
- `crop_calendar_rules`
- `crop_soil_requirements`
- `crop_risk_notes`
- `crop_region_recommendations`

Cada cultura deve ter:

- nome comum.
- nomes locais quando existirem.
- imagem.
- pH de referência.
- tipo de solo ideal.
- época.
- região compatível.
- necessidades de água.
- riscos.
- recomendação prudente.

### Fórum

Tabelas:

- `forum_categories`
- `forum_topics`
- `forum_posts`
- `forum_attachments`
- `forum_reactions`
- `forum_reports`
- `forum_moderation_actions`

Regras:

- Agricultor pode criar tópico.
- Utilizadores podem responder.
- Consultor pode responder com selo verificado.
- Admin pode ocultar, bloquear e fechar tópico.
- Conteúdo com dose, mistura química ou recomendação de risco deve ser escalado para moderação.

### Médico Agrícola

Tabelas:

- `consultants`
- `consultant_profiles`
- `consultation_threads`
- `consultation_messages`
- `consultation_attachments`
- `consultation_status_events`
- `consultation_packages`
- `visit_requests`
- `visit_quotes`
- `answer_templates`

Estados da consulta:

- `new`
- `needs_more_info`
- `in_review`
- `answered`
- `requires_sample`
- `requires_visit`
- `closed`

### Notificações

Tabelas:

- `notification_templates`
- `notification_jobs`
- `notification_deliveries`
- `device_tokens`
- `user_notification_preferences`

Canais:

- push.
- SMS no futuro.
- email.
- USSD no futuro.

Eventos:

- conta criada.
- código de verificação.
- recuperação de senha.
- pagamento confirmado.
- subscrição a expirar.
- resposta no fórum.
- resposta do Médico Agrícola.
- consulta presencial confirmada.
- alerta agrícola por região.

## Mapa Real e PostGIS

O mapa deve ser editável apenas no admin. O utilizador final consulta, mas não altera dados oficiais.

### Admin

Funcionalidades necessárias:

- ver mapa da Guiné-Bissau.
- pesquisar região, sector, tabanca ou parcela.
- adicionar ponto GPS.
- desenhar polígono.
- importar GeoJSON.
- associar culturas.
- associar pH.
- associar tipo de solo.
- marcar fonte e validade.
- publicar camada.
- ver histórico de versões.

### Mobile

Funcionalidades necessárias:

- ver mapa com zoom.
- carregar camadas publicadas.
- clicar numa zona.
- ver ficha local.
- abrir culturas recomendadas.
- pedir amostra.
- pedir consulta.

### Decisão técnica

Usar PostGIS como fonte principal e exportar camadas publicadas como GeoJSON simplificado para o mobile. Isto reduz peso no telemóvel e permite caching offline.

## Fórum

O fórum deve ter experiência simples:

- lista de categorias.
- lista de tópicos.
- criação de pergunta.
- upload de imagem.
- respostas encadeadas simples.
- selo de consultor.
- moderação.
- notificação.

O primeiro lançamento deve evitar conversas complexas em tempo real. Fórum assíncrono é suficiente para o MVP final.

## Médico Agrícola

### Perfil inicial

Eriksson Jaled Hopffer Delgado Duarte é Engenheiro Agroalimentar, formado no Instituto Universitário de Tecnologia de Maracaibo, Venezuela. Tem experiência em acompanhamento técnico no terreno, avaliação de projectos, gestão de actividades agrícolas e apoio à fileira do arroz na Guiné-Bissau. No N'djar, actua como Médico Agrícola e consultor técnico para apoiar agricultores na interpretação de solo, cultivo, calendário agrícola e boas práticas de produção.

Fonte interna: `Curriculum Eriksson.pdf` e imagem `Eriksson.png`.

### Chat incluído

O chat técnico dentro da app fica incluído na subscrição Agricultor. Deve ter limite operacional para evitar abuso:

- 3 consultas técnicas por mês incluídas.
- consulta extra por chat: 5.000 XOF.
- resposta esperada: até 24h.
- casos críticos podem ser marcados como visita ou amostra.

### Consulta presencial

Pacotes propostos:

- Consulta curta em Bissau: 25.000 XOF.
- Consulta fora de Bissau: 45.000 XOF por dia técnico.
- Transporte: cobrado à parte.
- Alojamento: cobrado à parte quando necessário.
- Diagnóstico de solo e plano de cultivo: 65.000 a 120.000 XOF.
- Formação para cooperativa: 150.000 a 300.000 XOF por dia.

Estes valores são proposta inicial. Devem ser validados com custos reais de deslocação, distância, número de parcelas, tempo técnico e capacidade de pagamento local.

### Referências de mercado consultadas

- Farm Progress indica consultoria agrícola por acre entre 5,75 e 6,75 USD, com scouting simples citado a 4 USD por acre.
- New Mexico State University indica 5 a 6 USD por acre para scouting básico e até 30 USD por acre para consultoria extensa em culturas de maior valor.
- Calypso Farm publica consultoria entre 40 e 75 USD por hora.
- Plants Dig Soil publica pacotes de 750 USD para Q&A, 2.500 USD para retainer anual e 4.000 USD para planeamento agrícola.
- Crop Quest descreve contratos por acre e serviços como monitorização, solo, fertilização, irrigação e scouting.
- DATCP recomenda esclarecer forma de cobrança, visitas, amostras de solo, capacidade GPS e recomendações antes de contratar consultor agrícola.

Fontes:

- https://www.farmprogress.com/commentary/why-hire-a-crop-consultant-
- https://nmsu.contentdm.oclc.org/digital/api/collection/AgCircs/id/56898/download
- https://calypsofarm.org/products/consulting/
- https://www.plantsdigsoil.com/pricing
- https://www.cropquest.com/crop-consulting-services/
- https://datcp.wi.gov/Pages/AgDevelopment/HiringAFarmConsultant.aspx

## Pagamentos

### Plano Agricultor

Preço base:

- 15.000 XOF por mês.

Inclui:

- calendário.
- mapa.
- fichas agrícolas.
- fórum.
- 3 consultas por chat.
- notificações principais.

Não inclui:

- consulta presencial.
- transporte.
- alojamento.
- análises laboratoriais.
- relatório técnico completo.

### Métodos

Fase 1:

- Orange Money.
- TeleTaku.

Fase 2:

- pagamento em agente autorizado.
- cupão de cooperativa.
- pagamento por ONG ou projecto parceiro.

### UX de pagamento

O ecrã de subscrição deve mostrar:

- plano.
- benefícios.
- preço.
- botão Orange Money com o asset `orange-money.png`.
- botão TeleTaku com o asset `teletaku.png`.
- estado de pagamento.
- recibo simples.
- data de expiração.

## Notificações

### Confirmação de conta

Enviar código por SMS ou email. Se SMS ainda não estiver integrado, a app deve permitir modo de teste apenas em ambiente de desenvolvimento.

### Recuperação de senha

Enviar código com expiração curta. Nunca enviar senha por mensagem.

### Fórum

Enviar push quando:

- alguém responde ao tópico.
- consultor responde.
- tópico é moderado.

### Médico Agrícola

Enviar push quando:

- consulta foi recebida.
- consultor pediu mais informação.
- resposta foi enviada.
- visita foi proposta.
- orçamento foi aceite.

### Pagamentos

Enviar push quando:

- pagamento fica pendente.
- pagamento é confirmado.
- pagamento falha.
- subscrição está perto de expirar.

## Admin Web

Rotas recomendadas:

- `/admin/login`
- `/admin/dashboard`
- `/admin/users`
- `/admin/subscriptions`
- `/admin/payments`
- `/admin/map`
- `/admin/regions`
- `/admin/crops`
- `/admin/soil`
- `/admin/calendar`
- `/admin/forum`
- `/admin/consultations`
- `/admin/consultants`
- `/admin/notifications`
- `/admin/audit`

Componentes principais:

- mapa com editor.
- tabela filtrável.
- formulário validado.
- publicação com revisão.
- histórico de alterações.
- painel de métricas.

## Experiência de Utilizador

### Mobile

A home deve continuar em blocos grandes porque o público precisa de leitura simples e toque fácil. Cada bloco deve mostrar claramente se é grátis ou pago.

Fluxos prioritários:

- entrar.
- subscrever.
- abrir mapa.
- clicar numa zona.
- ver cultura.
- perguntar no fórum.
- contactar Médico Agrícola.

O utilizador nunca deve ficar preso num ecrã. Todos os ecrãs profundos precisam de voltar visível e suporte ao botão físico Android.

### Admin

O admin deve ser denso, claro e operacional. Não deve parecer landing page. Deve priorizar:

- pesquisa.
- filtros.
- mapas.
- tabelas.
- estados.
- publicação.
- auditoria.

### Consultor

O consultor precisa de menos navegação e mais contexto. A fila de consultas deve mostrar:

- agricultor.
- cultura.
- região.
- tempo restante.
- fotos.
- estado.
- prioridade.

## Roadmap

### Fase 1: Fundação de Produção

- autenticação.
- permissões.
- base de dados real.
- storage.
- API protegida.
- admin login.
- seed inicial.

### Fase 2: Admin Agrícola

- gestão de culturas.
- gestão de calendário.
- gestão de pH.
- gestão de regiões.
- upload de imagens.
- publicação de conteúdos.

### Fase 3: Mapa Real

- PostGIS.
- MapLibre ou Mapbox.
- editor de polígonos.
- importação GeoJSON.
- camadas publicadas.
- cache mobile.

### Fase 4: Fórum

- categorias.
- tópicos.
- respostas.
- imagens.
- moderação.
- notificações.

### Fase 5: Médico Agrícola

- fila de consultas.
- chat assíncrono.
- anexos.
- parecer técnico.
- consultoria presencial.
- pacotes e orçamento.

### Fase 6: Pagamentos

- Orange Money.
- TeleTaku.
- recibos.
- expiração.
- bloqueio/desbloqueio por entitlement.

### Fase 7: Offline e USSD

- SQLite no mobile.
- sync incremental.
- USSD menu.
- perguntas predefinidas.
- respostas curtas.

### Fase 8: Release

- APK assinada.
- testes em dispositivos reais.
- monitorização.
- política de privacidade.
- termos de uso.
- plano de suporte.

## Critérios de Teste

### Autenticação

- criar conta com telefone.
- confirmar código.
- iniciar sessão.
- recuperar senha.
- renovar sessão.
- bloquear utilizador.
- impedir acesso com token expirado.

### Pagamentos

- criar tentativa.
- confirmar pagamento.
- falhar pagamento.
- activar subscrição.
- expirar subscrição.
- bloquear módulo pago sem subscrição.

### Mapa

- admin cria zona.
- admin desenha polígono.
- admin associa cultura.
- admin publica camada.
- mobile carrega camada.
- utilizador clica e vê ficha.
- mobile funciona com cache de última camada.

### Fórum

- criar tópico.
- anexar imagem.
- responder.
- resposta de consultor aparece verificada.
- admin modera.
- utilizador recebe notificação.

### Médico Agrícola

- criar consulta.
- anexar foto.
- consultor responde.
- estado muda.
- visita presencial recebe orçamento.
- notificação é enviada.

### Segurança

- agricultor não acede admin.
- consultor não edita mapa.
- admin não vê senhas.
- ficheiros privados exigem autorização.
- logs não expõem tokens.

### Acessibilidade

- botões com rótulo claro.
- contraste suficiente.
- toque mínimo confortável.
- estados pagos e bloqueados legíveis.
- textos sem sobreposição com barra do Android.

## Actualizações Necessárias no README

O README deve apontar para este spec como direcção final aprovada. Também deve clarificar:

- o protótipo actual é estável para demonstração.
- o mapa real fica na fase PostGIS e MapLibre ou Mapbox.
- autenticação, pagamentos, fórum e Médico Agrícola completo ainda dependem da fundação de produção.
- os assets Orange Money e TeleTaku foram adicionados.
- a próxima implementação deve começar por autenticação, permissões, base de dados e admin.

## Skeleton Final

```text
ndjar-agrotech/
  apps/
    mobile/
      src/
        auth/
        map/
        crops/
        forum/
        doctor/
        payments/
        profile/
        notifications/
    web/
      app/
        (public)/
        admin/
    api/
      src/
        modules/
          auth/
          users/
          subscriptions/
          payments/
          maps/
          crops/
          forum/
          consultations/
          notifications/
          admin/
  packages/
    database/
    domain/
    fixtures/
    design-system/
    shared-types/
  docs/
    data/
    design/
    product/
    superpowers/
      specs/
      plans/
```

## Subprojectos de Implementação

Este projecto deve ser implementado com subagentes por tarefa. A ordem recomendada é:

1. Autenticação, roles e sessões.
2. Base de dados real e migrations.
3. Admin shell e gestão de utilizadores.
4. Pagamentos e subscrições.
5. Gestão agrícola no admin.
6. Mapa real com PostGIS.
7. Mobile ligado à API real.
8. Fórum com imagens.
9. Médico Agrícola e consultor.
10. Notificações.
11. Offline e USSD.
12. QA, release e publicação.

## Decisão Final

A próxima implementação deve começar pela Fundação de Produção. Sem autenticação, roles, base de dados real e admin protegido, o mapa real, fórum, Médico Agrícola e pagamentos ficariam frágeis e difíceis de manter.
