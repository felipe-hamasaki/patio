# Decisões do P0

## Fronteiras

A interface usa `DemoProvider` no layout persistente de `/demo`. A navegação entre as páginas mantém o estado e os controles de simulação. A inicialização lê e valida o armazenamento somente após hidratação; até isso ocorrer, exibe um skeleton com anúncio de carregamento.

`domain.ts` concentra as transições em `transition`, sem dependência de React, Next ou armazenamento. Cada alteração recebe uma cópia da OS, valida as precondições, produz eventos e devolve um objeto validado por Zod. `createOrder` cria os vínculos entre cliente, veículo e OS em uma única alteração do cenário.

`demo-store.tsx` é a fronteira de persistência: lê a revisão atual, valida o estado resultante, grava no navegador e só então confirma a mudança à interface. Falhas não substituem o estado anterior. Dados ilegíveis não são sobrescritos silenciosamente: a interface permite tentar ler novamente ou restaurar explicitamente o cenário.

## Regras financeiras

Preços, descontos, recebimentos e saldos usam centavos inteiros. Quantidade é armazenada em centésimos de unidade: `125` representa `1,25`. Cada linha calcula `round(quantidade × preço / 100) − desconto`. O desconto é aplicado à linha, não a cada unidade. O total soma essas linhas já arredondadas.

Uma aprovação se refere a uma versão exata e a uma lista de IDs de itens. No aceite parcial, apenas as linhas aprovadas compõem o saldo e as tarefas. O desconto por linha evita rateios implícitos no aceite parcial. Quantidade, preço e desconto têm limites explícitos no esquema.

Uma revisão mantém os valores e a decisão anterior no histórico, cria um novo rascunho e suspende a execução até novo aceite. Revisões depois de trabalho iniciado ou recebimento são bloqueadas neste recorte; aditivos e estornos exigem uma modelagem adicional no P1.

Cada recebimento tem um ID único para impedir duplicação por reenvio na mesma OS. Não há estorno financeiro neste P0. O lançamento não pode superar o saldo; pagamentos e entrega são estados distintos. A entrega a prazo exige justificativa, registrada como autorização fictícia da gestora.

## Persistência e rascunhos

- `localStorage['patio.demo.v1']`: cenário com versão de esquema, revisão, clientes, veículos, ordens e rascunho da nova OS.
- `sessionStorage['patio.quote-draft.<ordem>.<versão>']`: edição ainda não salva do orçamento, preservada ao fechar o editor ou navegar na mesma aba. A versão aprovada nunca é alterada pelo rascunho.
- Evento `storage`: atualiza outras abas abertas. O editor compara a versão de origem antes de salvar e preserva os campos se outra aba revisou o orçamento.
- Restaurar o cenário remove rascunhos de orçamento da aba atual e recria as seis OS. Rascunhos de outra aba são locais àquela aba; versões divergentes não podem sobrescrever um orçamento mais recente, mas o reset não é um protocolo transacional entre abas.

Instantes usam ISO UTC. Listas e histórico exibem o fuso `America/Sao_Paulo`. `datetime-local` usa o fuso do dispositivo e informa esse comportamento ao usuário. Datas do cenário são relativas ao instante da primeira abertura/restauração e permanecem estáveis até outro reset.

## Sistema visual

Toda a interface usa shadcn/ui, preset Nova com base Radix, Tailwind CSS 4 e tema Green sobre a base neutral. Os componentes foram instalados pelo CLI oficial; `components.json` registra aliases e preset. `globals.css` concentra tokens semânticos do tema claro/escuro, regras de impressão e movimento reduzido. O contraste de `muted-foreground` no tema claro foi reforçado para textos pequenos sobre superfícies secundárias. A paleta Green vem do registro oficial do shadcn (`apps/v4/registry/themes.ts`), com acentos mais claros no modo escuro para contraste de links. Tokens adicionais `success`, `warning`, `info`, `diagnostic` e `danger` usam pares superfície/texto em ambos os modos; `stageColors` centraliza as cores das etapas. Navegação, ações, indicadores, avatares e quadro consomem esses tokens. Não há biblioteca visual legada nem seletores CSS de componentes próprios.

Sidebar/Sheet, Dialog/AlertDialog, Tabs, ToggleGroup, Checkbox, Button, Card, Badge, Avatar, Empty, Skeleton, Progress, Alert, Table, Tooltip e Breadcrumb são componentes shadcn. Sonner fornece notificações. Radix gerencia teclado e foco dos controles compostos. `patio-ui.tsx` adapta somente conteúdo do domínio, traduções e retorno de foco dos diálogos controlados. Os formulários usam Input, Textarea, Label e NativeSelect do shadcn, preservando validação HTML e Zod e os contratos existentes de onChange. O hook de viewport usa `useSyncExternalStore` para sincronização segura com React. O título do Sidebar móvel é traduzível.

Imagens de entrada são ilustrações vetoriais locais de exemplo. A fonte Geist usa `next/font`: download no build e arquivos locais durante o uso. Não há chamadas externas do navegador para tipografia, imagens, métricas, comunicação ou pagamentos.

## Segurança do recorte

Sem segredos, autenticação fictícia que pareça real, HTML arbitrário, endpoints de negócio ou upload de arquivos. Textos são renderizados pelo React com escape. O esquema valida entradas e conteúdo persistido; links e nomes digitados não são interpretados como HTML.

O Next envia `nosniff`, política de referência, bloqueio de iframe e restrições a câmera/microfone/geolocalização. CSP restringe as origens ao próprio app. Scripts inline são permitidos por compatibilidade com o bootstrap do Next; em desenvolvimento também há `unsafe-eval`. Para o piloto, adotar CSP com nonce/hash e testar o modo de hospedagem escolhido. Esses headers não transformam a demo em aplicação pronta para dados reais.

O P1 precisa de identidade autenticada, autorização no servidor, papéis, isolamento por organização, RLS e chaves compostas; recebimentos e estoque transacionais; idempotência persistida; anexos privados; backups testados; auditoria resistente a alterações; retenção e privacidade. A escolha de adaptador deve ser controlada no servidor. Um parâmetro enviado pelo navegador jamais poderá ativar bypass de autorização.

## Dependências

As versões instaladas estão registradas em `package-lock.json`; `package.json` declara as faixas aceitas. Use `npm ci` para reprodução. A consulta de 04/10/2026 após a migração retornou zero avisos para dependências de produção em `npm audit --omit=dev`.

O audit completo apontou nove entradas de severidade alta na árvore de desenvolvimento. As cadeias de ESLint e do CLI shadcn (incluindo registry/ts-morph) chegam a `fast-glob → micromatch → braces`, com aviso de esgotamento de pilha por padrões profundamente aninhados. Não foi aplicado o downgrade incompatível sugerido pelo audit. Essas ferramentas processam arquivos e padrões durante o desenvolvimento. Deve ser reavaliado ao atualizar as ferramentas; zero avisos de produção não equivale a uma auditoria de segurança completa.

## Idiomas e temas

`PreferencesProvider` no layout raiz controla `pt-BR`/`en-US` e `light`/`dark`. A preferência é validada e armazenada separadamente em `patio.preferences.v1`; a restauração dos dados da oficina não a remove. O evento `storage` sincroniza outras abas. Se a gravação falhar, a preferência vale na sessão e a interface anuncia que não pôde salvá-la.

`messages.en.ts` contém o catálogo de apresentação. `i18n.ts` resolve chaves e templates explícitos para eventos já persistidos, sem reescrever os registros existentes. `Intl` formata BRL e datas; IDs, enums e valores usados nas regras de domínio permanecem estáveis. Conteúdo livre não passa por tradução automática.

O bootstrap aplica `lang` e `data-theme`; next-themes gerencia a classe `.dark`, a aplicação antecipada do tema e a preferência espelhada em `patio.theme`. `PreferencesProvider` mantém o contrato anterior em `patio.preferences.v1`, migra preferências existentes e sincroniza o tema com next-themes. Controles ficam desabilitados até carregar as preferências. Os componentes usam os tokens semânticos do shadcn nos dois modos. A impressão exibe somente o documento do diálogo em superfície clara.
