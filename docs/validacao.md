# Validação do Pátio

Data: **04/10/2026**, fuso de referência America/Sao_Paulo.

## Revisão para publicação

Foram adicionados edição de clientes, cadastro/edição independente de veículos, nova OS contextual com preservação do rascunho, importação JSON com confirmação e recuperação, validações de consistência, títulos por tela e imagem Open Graph.

Os **45 testes unitários** e **34 testes E2E** passaram, assim como lint, TypeScript, formatação e build. Duas variantes não aplicáveis foram omitidas (gaveta móvel no desktop e matriz de larguras duplicada no celular). A rodada E2E final durou 2,3 minutos. `npm audit --omit=dev --audit-level=high` retornou **zero vulnerabilidades de produção**. A suíte ampliada de navegador usa uma instância isolada do build de produção em `127.0.0.1:3003`, iniciada pelo Playwright com `PLAYWRIGHT_PRODUCTION=1`.

As novas verificações incluem edição persistente de cadastros, contexto cliente/veículo, preservação/descarte do rascunho, exportação e recuperação do arquivo, arquivo incompatível sem sobrescrita, confirmação cancelada, armazenamento corrompido, mudança em outra aba durante a confirmação, entrada pública, título, CSP, imagem social e rota inválida. Os diálogos novos também passam pela auditoria axe.

Capturas adicionais: [cadastro desktop](screenshots/desktop-cadastro-completo.png), [cadastro móvel](screenshots/mobile-cadastro-completo.png) e [imagem de compartilhamento](screenshots/compartilhamento.png), inspecionadas visualmente.

As seções seguintes preservam os resultados históricos das etapas anteriores; as métricas de desempenho não foram refeitas nesta revisão.

## Produção pública — Vercel

Deploy `dpl_H8haa74xpvnXhTS6yQzGbqK4myDz`, projeto `patio`, estado **READY**, publicado em [patio-gamma.vercel.app](https://patio-gamma.vercel.app).

**4 testes E2E adicionais passaram no domínio público**, em desktop e celular: jornada de nova OS → orçamento → aprovação parcial → execução → quitação → entrega → recarga; e entrada pública → título → CSP → imagem social → rota inválida → retorno. Os contextos não tinham sessão de login na Vercel.

HTTP 200 confirmado na raiz (redirecionada para `/demo`), em `/demo/ordens/1042`, `/demo/clientes`, `/demo/recebimentos`, `/demo/ajustes` e `/opengraph-image`; HTTP 404 em `/demo/ordens/1042/invalida`. O endereço Open Graph aponta para o domínio público correto.

Para repetir apenas essa conferência, defina `PLAYWRIGHT_BASE_URL=https://patio-gamma.vercel.app` e execute `npx playwright test --grep "new OS, draft|public entry"`. Essa opção não inicia um servidor local.

## Tema Green

Após a migração, o tema neutral recebeu a paleta Green do shadcn e tokens semânticos para indicadores e etapas. O modo escuro usa verde mais claro nas ações e links para preservar contraste. Build (incluindo TypeScript) e lint passaram. A rodada direcionada em produção executou **4 testes E2E, todos aprovados**: legibilidade nos dois temas e estrutura acessível das telas/formulários/impressão, em desktop e celular. As auditorias axe desses cenários não encontraram violações. Capturas dos dois temas foram atualizadas; a página de ordens também foi conferida no navegador integrado. Os resultados completos abaixo registram a migração anterior.

## Migração completa para shadcn/ui

A rodada final após a migração usou o build de produção com `next start` na porta 3002. **24 testes E2E passaram; 2 variantes não aplicáveis foram omitidas**, em 2,4 minutos. Lint, TypeScript, formatação, build e os **28 testes unitários** também passaram. A consulta `npm audit --omit=dev` retornou zero avisos de produção; a árvore de desenvolvimento tem nove avisos altos na cadeia de `braces`, detalhados em [Arquitetura](arquitetura.md).

Todas as telas usam os componentes oficiais shadcn/ui (Nova/Radix), Tailwind 4 e tokens de tema neutral. O CSS visual anterior foi removido. Foram verificados quadro e tabela de OS, cadastro, clientes, recebimentos, ajustes, todas as abas do detalhe, edição de orçamento, aprovação, modais e estados de recuperação. Os dados e rascunhos existentes continuam usando o mesmo contrato de persistência.

As auditorias axe configuradas passaram em português e inglês, nos modos claro e escuro, em desktop e celular. Reflow passou entre 320 e 1440 px. O menu móvel usa Sheet com foco contido e retorno ao acionador; abas e seletores usam o teclado do Radix. A impressão foi verificada com emulação de mídia: documento visível em fundo branco e shell oculto. As capturas desta pasta foram atualizadas e inspecionadas visualmente, incluindo formulário, orçamento, operação e aprovação móvel escura.

## Ambiente

Windows, Node 24.21.0, Next.js 16.3.8, React 19.3.0, TypeScript 6.0.3. Testes de navegador com Playwright 1.63.0 e Microsoft Edge 154.0.4258.53 em modo headless. A rodada final usou `next start`, servindo o build de produção em `http://127.0.0.1:3002`.

## Resultado

| Verificação            | Resultado                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run lint`         | Passou, sem erros ou avisos de lint                                                             |
| `npm run typecheck`    | Passou                                                                                          |
| `npm test`             | 28 testes de domínio e preferências passaram                                                    |
| `npm run test:e2e`     | 24 testes passaram; 2 variantes não aplicáveis foram omitidas                                   |
| `npm run format:check` | Passou                                                                                          |
| `npm run build`        | Build de produção concluído                                                                     |
| `npm audit --omit=dev` | Zero avisos conhecidos de dependências de produção nessa consulta                               |
| HTTP e headers         | Página acessível; CSP, nosniff, Referrer-Policy, X-Frame-Options e Permissions-Policy presentes |

As duas variantes omitidas são intencionais: o teste de gaveta móvel não roda no desktop; a matriz completa de larguras roda uma vez no projeto desktop, sem repetição idêntica no projeto mobile. Não são casos que falharam ou foram desativados para esconder um problema.

## Jornadas verificadas

- Nova OS com cadastro e vínculo entre cliente e veículo; rascunho recuperado após recarregar.
- Orçamento com preço decimal e desconto, aprovação parcial e exclusão dos itens recusados da execução.
- Bloqueio de conclusão prematura; tarefas e duas conferências obrigatórias; entrega com saldo exige motivo.
- Recusa de recebimento maior que o saldo, quitação e entrega, com histórico recuperado após recarregar.
- Revisão do orçamento aprovado preservando a versão anterior, suspensão da execução e nova aprovação; recusa de todos os itens.
- Bloqueio por peça e liberação após registrar sua chegada.
- Busca, visão em lista, filtro por responsável, nenhum resultado e restauração.
- Falha simulada de gravação com conservação dos campos e nova tentativa bem-sucedida.
- Conteúdo local ilegível não sobrescrito automaticamente; restauração explícita recupera o cenário.
- Duas abas com o mesmo orçamento: a segunda gravação de uma revisão obsoleta é recusada e o formulário permanece preenchido.
- Prévia de impressão e fechamento de modal por Escape, com retorno de foco ao botão acionador.
- Navegação móvel com foco contido, fechamento por Escape e retorno ao botão do menu.

Os testes de domínio cobrem centavos/arredondamento, descontos inválidos, aceites duplicados ou desconhecidos, revisão após execução/recebimento, recebimentos idempotentes, pagamento após entrega, cancelamento, placas duplicadas, OS ativa duplicada, vínculo entre entidades e esquema de armazenamento.

## Layout e acessibilidade

Sem transbordamento horizontal do documento nas páginas de operação, nova OS, detalhe, clientes, recebimentos e ajustes nas larguras **320, 360, 768, 1024 e 1440 px**. Jornada completa também validada com viewport móvel de **390 × 844**. Tabelas de orçamento têm rolagem horizontal contida e intencional.

Reflow adicional em 720 × 500 CSS px aproxima o espaço de layout de uma janela 1440 × 1000 em zoom de 200%. Isso não substitui uma avaliação de zoom em diferentes navegadores, aumento de fonte pelo sistema ou dispositivos físicos.

Auditorias axe com regras WCAG 2 A/AA e 2.1 AA não apontaram violações nas telas testadas: operação, cadastro de OS, clientes, recebimentos, ajustes, abas do detalhe e aprovação simulada. Teclado e foco foram exercitados pelo Playwright. Não foi realizada avaliação humana com leitor de tela; ausência de violações automáticas não certifica conformidade integral.

Capturas em desktop e celular foram inspecionadas visualmente. Foram corrigidos contraste insuficiente nos textos secundários, continuidade do controle de falha simulada entre rotas, foco nos diálogos, acesso por teclado à navegação móvel e ordem visual do checklist em formulários estreitos.

Capturas úteis:

- [Operação desktop](screenshots/desktop-operacao.png)
- [Operação móvel](screenshots/mobile-operacao.png)
- [Orçamento desktop](screenshots/desktop-orcamento.png)
- [Aprovação móvel](screenshots/mobile-aprovacao.png)
- [Cadastro desktop](screenshots/desktop-nova-os.png)
- [Cadastro móvel](screenshots/mobile-nova-os.png)

## Inglês e modo escuro

Rodada complementar de 04/10/2026 na pasta atual do projeto, usando o build de produção. Os seis novos cenários E2E passaram (três em desktop e três em celular), além das jornadas existentes: **24 passaram e 2 variantes não aplicáveis foram omitidas**. Lint, TypeScript, build, formatação e os **28 testes unitários** passaram.

- Troca PT/EN e claro/escuro preserva o rascunho e o conteúdo persistido da oficina; recarregar mantém as preferências.
- Busca em inglês encontra as descrições do cenário; aprovação e recebimento funcionam com labels em inglês, mantendo enums de domínio estáveis.
- Histórico traduzido mostra a moeda com formatação inglesa sem conversão de valores; restauração preserva idioma e tema.
- Operação, nova OS, clientes, recebimentos, ajustes e modal de aprovação foram auditados com axe em inglês nos dois temas, em desktop e celular, sem violações nas regras configuradas. Nenhum erro de JavaScript capturado nesses cenários.
- Capturas de operação e aprovação foram inspecionadas; contraste dos textos secundários no modo escuro foi ajustado. Não houve transbordamento horizontal nas páginas verificadas.

Capturas adicionais:

- [Desktop em inglês — escuro](screenshots/desktop-en-dark.png)
- [Desktop em inglês — claro](screenshots/desktop-en-light.png)
- [Celular em inglês — escuro](screenshots/mobile-en-dark.png)
- [Celular em inglês — claro](screenshots/mobile-en-light.png)
- [Aprovação em inglês — celular escuro](screenshots/mobile-approval-dark.png)

## Observação de desempenho local

Medição do P0 anterior à inclusão de inglês e temas; não foi refeita para o bundle atual. Uma amostra por viewport, contexto novo de navegador, servidor de produção local, sem limitação artificial de CPU/rede. O viewport móvel foi executado no mesmo computador; não representa o desempenho de um telefone real.

| Medida observada                                 | Desktop 1440 × 1000 | Viewport 390 × 844 |
| ------------------------------------------------ | ------------------: | -----------------: |
| FCP                                              |              288 ms |              68 ms |
| LCP até o fim da coleta                          |              468 ms |             200 ms |
| Soma de layout shifts observados sem interação   |              0,0092 |             0,0729 |
| JavaScript transferido, codificado               |       275.921 bytes |      275.921 bytes |
| Total transferido, incluindo documento e headers |       308.219 bytes |      302.698 bytes |
| Requisições a origens externas                   |                   0 |                  0 |
| Erros de JavaScript capturados                   |                   0 |                  0 |

Não houve long tasks na janela curta de carregamento observada. Diferenças entre as amostras podem refletir aquecimento do processo e caches do servidor. Não foram medidos INP, percentil 75, tráfego real ou uma nota Lighthouse. O script soma os shifts da janela curta de observação; não implementa a janela de sessão completa de CLS. Não interpretar esses números como garantia de Core Web Vitals em produção pública.

Dados brutos e headers: [lab-metrics.json](lab-metrics.json). Reprodução com o servidor de produção aberto:

```powershell
node scripts/measure-lab.mjs
```

## Pendências reais

Autenticação, backend de negócio, isolamento entre oficinas, permissões reais, uploads, backup automático, agenda, estoque, integrações e auditoria de segurança de produção pertencem ao P1/P2 e não foram implementados aqui. A demonstração de restrição de acesso é apenas um estado visual.

Na medição inicial, o audit completo reportou cinco entradas altas derivadas de `braces` na cadeia de lint; a migração posterior registrou nove entradas, conforme a seção de dependências da arquitetura. A consulta retornou 3.0.3 como versão mais recente, sem correção compatível disponível nessa cadeia. Detalhes e justificativa para não aplicar um downgrade incompatível estão em [Arquitetura](arquitetura.md#dependências).

Persistência local não garante transações estritamente simultâneas entre abas nem backup automático. A revisão adicionou cópia/recuperação manual por exportação/importação JSON. O código implementa detecção de divergência e de versões de orçamento obsoletas para os cenários testados. Não foi realizado teste com dados pessoais reais ou operação comercial.
