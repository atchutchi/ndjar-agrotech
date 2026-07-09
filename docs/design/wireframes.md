# N'djar Wireframes

Este documento mapeia os 24 ecrãs do protótipo para rotas, componentes e fases. A referência visual é a imagem local `C:\Users\binta\Downloads\Concurso Ndjar Engim\ndjar_app_prototipos_frontend.png`. A imagem serve para orientar estrutura e hierarquia, não como asset final.

## Estratégia de superfície

O MVP começa em Android. A app móvel concentra onboarding, mapa, pH, culturas, calendário, amostras, consultas, fórum, biblioteca, subscrição, contacto e perfil. A web pública e o admin entram depois, com base nos mesmos tokens e componentes.

Ordem de entrega:

1. Android primeiro, com navegação por bottom tabs e fluxos de detalhe.
2. Web pública depois, para apresentar piloto, serviços, screenshots e contacto.
3. Admin web depois, para gerir regiões, culturas, calendário, biblioteca, consultas e moderação.

## Navegação mobile

Top-level sugerido para o Android:

- Início
- Mapa
- Médico
- Fórum
- Perfil

Biblioteca, calendário, culturas, pecuária, contacto e subscrição podem entrar por atalhos no início e por listas internas. Isto evita uma bottom tab sobrecarregada e mantém os cinco destinos principais.

## Mapeamento dos 24 ecrãs

| Nº | Ecrã do protótipo | Rota mobile sugerida | Componentes principais | Fase |
| --- | --- | --- | --- | --- |
| 01 | Splash | `/splash` | Logo, painel verde escuro, CTA primário, nota USSD | MVP Android |
| 02 | Onboarding | `/onboarding` | Logo, ilustração pública ou placeholder, pager, CTA | MVP Android |
| 03 | Idioma | `/setup/language` | Lista de cartões de selecção, modo de acesso, CTA | MVP Android |
| 04 | Login | `/auth/login` | Logo, telefone, palavra-passe, SMS, offline | MVP Android |
| 05 | Registo | `/auth/register` | Formulário, chips de produção, CTA | MVP Android |
| 06 | Home | `/home` | Saudação, resumo de pH, alertas, grelha de atalhos | MVP Android |
| 07 | Mapa | `/map` | Mapa piloto, legenda de estado, lista de regiões | MVP Android |
| 08 | Região | `/regions/:regionId` | Cartão de pH, barra de estado, culturas observadas, recomendação | MVP Android |
| 09 | Cultivos | `/crops` | Pesquisa, lista de culturas, chips de estado | MVP Android |
| 10 | Detalhe cultivo | `/crops/:cropId` | Cabeçalho de cultura, compatibilidade por região, CTA médico | MVP Android |
| 11 | Calendário | `/calendar` | Tarefas sazonais, barras por mês, recomendações | MVP Android |
| 12 | Amostra pH | `/samples/new` | Formulário de amostra, passos, anexos, CTA guardar | MVP Android |
| 13 | Pecuária | `/livestock` | Avaliação por zona, cartões de animais, nota técnica | Futuro próximo |
| 14 | Médicos | `/doctors` | Pesquisa, lista de consultores, disponibilidade, CTA | MVP Android |
| 15 | Perfil médico | `/doctors/:doctorId` | Avatar, métricas, especialidades, CTAs | MVP Android |
| 16 | Marcação | `/consultations/new` | Tipo de atendimento, horários, resumo, preço | MVP Android |
| 17 | Chat | `/consultations/:consultationId/chat` | Mensagens, input, estado de escalamento | Futuro próximo |
| 18 | Fórum | `/forum` | Pesquisa, lista de perguntas, categorias, botão criar | MVP Android com moderação |
| 19 | Discussão | `/forum/:threadId` | Pergunta, respostas, CTA responder | MVP Android com moderação |
| 20 | Nova pergunta | `/forum/new` | Título, categoria, descrição, anexos, publicar | MVP Android com moderação |
| 21 | Biblioteca | `/library` | Lista de guias, categorias, disponibilidade offline | MVP Android |
| 22 | Subscrição | `/subscription` | Plano, opções USSD e consulta, pagamento | Futuro próximo |
| 23 | Contacto | `/contact` | Cartão institucional, telefone, email, WhatsApp, CTA | MVP Android |
| 24 | Perfil | `/profile` | Conta, parcelas, amostras, alertas, idioma, sync, sair | MVP Android |

## Componentes por fluxo

Autenticação e acesso:

- `BrandHeader`
- `LanguageOptionCard`
- `AccessModeCard`
- `AuthTextField`
- `PrimaryButton`
- `SecondaryButton`
- `OfflineSupportNote`

Operação agrícola:

- `HomeStatusPanel`
- `ShortcutGrid`
- `RegionStatusCard`
- `PhRangeBar`
- `CropRecommendationCard`
- `SeasonTaskTimeline`
- `SampleStepList`

Consultoria:

- `DoctorListItem`
- `DoctorProfileSummary`
- `ConsultationTypeCard`
- `TimeSlotChip`
- `ConsultationChat`

Comunidade e conteúdo:

- `ForumThreadCard`
- `ForumReplyCard`
- `QuestionForm`
- `LibraryResourceItem`
- `CategoryChip`

Conta e suporte:

- `ProfileMenuItem`
- `SubscriptionPlanCard`
- `ContactInfoCard`
- `SyncStatusRow`

## Rotas web e admin

Web pública futura:

| Página | Rota | Objectivo |
| --- | --- | --- |
| Página inicial | `/` | Explicar o piloto, valor, serviços e contacto |
| Serviços | `/services` | Descrever pH, culturas, médico agrícola, biblioteca e fórum |
| Piloto | `/pilot` | Mostrar zonas, método de validação e parceiros |
| Contacto | `/contact` | Recolher pedidos de apoio |

Admin web futuro:

| Módulo | Rota | Objectivo |
| --- | --- | --- |
| Dashboard | `/admin` | Ver estado operacional do piloto |
| Regiões | `/admin/regions` | Gerir zonas, pH médio e alertas |
| Culturas | `/admin/crops` | Gerir culturas, faixas de pH e recomendações |
| Calendário | `/admin/calendar` | Gerir tarefas sazonais |
| Biblioteca | `/admin/library` | Publicar guias e marcar offline |
| Consultas | `/admin/consultations` | Acompanhar pedidos e atribuições |
| Fórum | `/admin/forum` | Moderar perguntas, respostas e categorias |
| Amostras | `/admin/samples` | Rever amostras, coordenadas e anexos |

## Regras de wireframe

Cada tela mobile deve ter uma acção principal clara. Quando existir CTA fixo no fundo, a lista deve reservar espaço para a área segura. O conteúdo principal deve aparecer antes de atalhos secundários.

Formulários devem usar labels persistentes. Placeholders podem ajudar, mas não substituem labels. Erros aparecem junto ao campo. O fluxo de amostra deve guardar rascunho, porque pode ser usado com rede fraca.

Listas devem mostrar estado, contexto e acção. Por exemplo, uma cultura mostra nome, faixa de pH e estado. Uma região mostra pH, avaliação e próxima acção. Uma pergunta do fórum mostra categoria, respostas e estado de moderação quando aplicável.

## Decisões para fases futuras

Chat técnico, subscrição e pecuária podem aparecer no protótipo, mas não devem bloquear o MVP se os dados, pagamentos ou operação de suporte ainda não estiverem prontos. Devem ficar desenhados como rotas e componentes, com estados vazios e mensagens honestas.

A web pública não deve substituir a app. Deve explicar o produto e encaminhar para contacto ou piloto. O admin não deve usar composição promocional. Deve ser uma ferramenta densa, clara e auditável.
