# N'djar Design System Foundation

Este documento define a base visual inicial da N'djar para o MVP. A referência visual é o protótipo local da app N'djar, usado apenas para orientar produto, hierarquia, cor e componentes. Nota interna: a imagem original estava em `C:\Users\binta\Downloads\Concurso Ndjar Engim\ndjar_app_prototipos_frontend.png`. Não deve ser copiada para o repositório nem tratada como asset final.

O pacote partilhável está em `packages/design-system`. Os tokens reutilizáveis vivem em `packages/design-system/src/tokens.ts` e devem ser a fonte de verdade para mobile, web e admin sempre que estes clientes forem alinhados.

## Personalidade

A N'djar deve parecer agrícola, prática e fiável. A interface serve agricultores, criadores, técnicos agrícolas e equipas operacionais. O tom visual deve ajudar a tomar decisões sobre solo, culturas, pecuária, calendário e consultas sem parecer uma landing page ou uma apresentação decorativa.

A personalidade é:

- Operacional. Cada ecrã deve mostrar estado, próxima acção ou decisão.
- Local. O conteúdo deve respeitar termos agrícolas, zonas piloto e apoio por USSD.
- Claro. A informação crítica deve aparecer com texto, número e estado.
- Contido. A cor deve orientar, não decorar.
- Mobile-first. O Android é a superfície principal do MVP.

## Logo e marca

Usar o logotipo N'djar apenas com proporção preservada. Não redesenhar, recolorir ou cortar o símbolo sem uma decisão de marca explícita. Em ecrãs densos, o logo pode aparecer no cabeçalho com o nome do produto e uma legenda curta, como no protótipo.

Regras iniciais:

- Usar o logo completo em splash, onboarding, login e contacto.
- Usar marca compacta no cabeçalho dos ecrãs internos.
- Manter espaço livre à volta do símbolo.
- Não usar o logo como padrão decorativo de fundo.
- Não inventar novos assets privados.

## Cores

As cores estão alinhadas com `apps/mobile/src/theme.ts` e `apps/web/app/globals.css`.

| Token | Valor | Uso |
| --- | --- | --- |
| `brand.dark` | `#0E3C1D` | Splash, painéis fortes, cabeçalhos de destaque |
| `brand.primary` | `#25662C` | Identidade, texto activo, chips principais |
| `brand.action` | `#358439` | Botões primários, estados activos, progresso ideal |
| `brand.soft` | `#B3CBB1` | Separadores suaves, superfícies secundárias |
| `surface.app` | `#F5F7F2` | Fundo geral da app |
| `surface.default` | `#FFFFFF` | Cartões, inputs, listas |
| `surface.muted` | `#ECF5E8` | Chips, cartões suaves, estados informativos |
| `text.primary` | `#183B24` | Texto principal |
| `text.secondary` | `#636560` | Texto auxiliar |
| `border.default` | `#DDE5DA` | Bordas leves e divisores |
| `status.warning` | `#F49F0E` | pH razoável, tarefas pendentes, pagamento |
| `status.danger` | `#D94132` | pH inadequado, erro, alerta crítico |
| `data.soil` | `#7A3B22` | Solo, mercado, categorias de terra |
| `data.community` | `#2E63E6` | Comunidade, biblioteca, informação institucional |

A pequena divergência actual é o fundo em grelha subtil no web. Essa grelha pode continuar em páginas públicas e admin para dar contexto agrícola leve, mas não deve ser usada nos ecrãs operacionais mobile. No mobile, o fundo deve manter-se plano e claro.

## Tipografia

Usar Inter como base visual comum. No Android, Roboto é fallback aceitável. A web pode testar uma fonte de marca apenas em comunicação pública futura, mas os ecrãs operacionais devem manter uma sans-serif limpa.

Escala inicial:

- `caption`: 12 px, usado em legendas, chips e meta-informação.
- `small`: 13 px, usado em labels e texto secundário compacto.
- `body`: 15 px, usado em listas e cartões.
- `input`: 16 px, usado em campos para evitar zoom e melhorar leitura.
- `sectionTitle`: 18 px, usado em blocos internos.
- `title`: 24 px, usado em títulos de ecrã.
- `display`: 34 px, usado com moderação em splash, onboarding e web.

Usar `letterSpacing.default = 0`. Não apertar tracking em interfaces densas.

## Espaçamento, raio e elevação

O sistema usa uma base de 4 px e 8 px.

- Espaçamento comum: 4, 8, 12, 16, 24, 32 e 48.
- Raio padrão de cartões, inputs e botões: 8 px.
- Pills e chips usam raio alto.
- Elevação deve ser leve. Cartões usam sombra quase imperceptível ou apenas borda.
- Evitar cartões dentro de cartões. Agrupar por espaço, título e borda.

## Estados e pH

Estados nunca devem depender apenas de cor. Devem combinar texto, número, rótulo e, quando existir componente, ícone ou posição.

Estados base:

- `success`: Bom, verde.
- `warning`: Razoável, laranja.
- `danger`: Inadequado, vermelho.
- `info`: Comunidade ou informação, azul.
- `offline`: Modo offline ou USSD, verde escuro em superfície suave.

Escala visual global de pH, alinhada com `@ndjar/domain`:

- Ácido: abaixo de 5.6, estado inadequado.
- Favorável: 5.6 a 6.5, estado bom.
- Quase neutro: maior que 6.5 e menor que 7, estado razoável.
- Neutro: valor pontual 7, sem range visual forçado.
- Alcalino: maior que 7 até 14, estado razoável com apoio de cor soil quando necessário.

Os valores são fundação visual e seguem a classificação global de `@ndjar/domain`. Não devem calcular compatibilidade por cultura. Essa compatibilidade deve ser calculada fora dos tokens globais, com regras de domínio, dados validados ou recomendações agronómicas específicas.

## Componentes

Componentes mínimos para o MVP:

- Botão primário, usado para acção principal por ecrã.
- Botão secundário, usado para SMS, mensagem, anexos e alternativas.
- Campo de texto, sempre com label visível.
- Cartão de selecção, usado em idioma, acesso e tipo de consulta.
- Chip de estado, usado para culturas, pH, disponibilidade e categorias.
- Barra de pH, com segmentos e rótulos.
- Cartão de região, com valor de pH, estado e acção seguinte.
- Cartão de cultura, com nome, faixa de pH e compatibilidade.
- Cartão de médico, com especialidade, preço, tempo e disponibilidade.
- Cartão de consulta, com tipo, horário e resumo.
- Cartão de pergunta do fórum, com categoria, respostas e estado de moderação.
- Item de biblioteca, com categoria, título e disponibilidade offline.
- Bottom tab, com até cinco destinos principais.

## Mobile-first

O MVP deve ser desenhado primeiro para Android pequeno. O protótipo mostra ecrãs estreitos, listas verticais e CTAs fixos no fundo. As decisões de layout devem seguir essa ordem:

1. Android pequeno.
2. Android grande.
3. Tablet ou web app.
4. Admin web.
5. Site público.

Alvos tácteis:

- Android mínimo: 48 px.
- iOS mínimo: 44 px.
- Inputs e botões: mínimo 48 px de altura.
- Espaço entre alvos: mínimo 8 px.
- Bottom tab: mínimo 64 px, com área segura inferior.

## Acessibilidade

Regras obrigatórias:

- Texto normal com contraste mínimo AA.
- Labels visíveis em campos.
- Estados com texto além da cor.
- Foco visível no web.
- Leitura lógica para leitores de ecrã.
- Sem acções críticas só por gesto.
- Sem informação crítica escondida em hover.
- Mensagens de erro junto ao campo afectado.
- Suporte a texto maior sem truncar conteúdo essencial.

## Idioma e tom de voz

Português é o idioma inicial recomendado no MVP. Crioulo, Fula e Balanta aparecem como opções planeadas ou progressivas, conforme o protótipo. O texto deve ser directo, curto e útil no contexto do campo.

Preferir:

- "Registar nova amostra"
- "Pedir orientação ao Médico Agrícola"
- "Guardar e continuar"
- "Também funciona via USSD"

Evitar:

- Frases promocionais longas.
- Termos técnicos sem explicação.
- Mensagens vagas como "erro inválido".
- Humor ou linguagem decorativa em fluxos críticos.

## Web e admin

A web pública deve esperar por screenshots e provas do produto antes de ganhar expressão comercial. Para já, deve manter a mesma paleta, cartões claros e foco em piloto, serviços e contacto.

O admin deve ser ainda mais contido: tabelas, filtros, estados, moderação, importação e revisão. Deve usar a mesma base de tokens, mas com maior densidade e menos destaque visual.
