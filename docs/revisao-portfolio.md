# Revisão para portfólio — 04/10/2026

## Escopo

O Pátio é uma demonstração funcional de gestão de oficina com dados fictícios e persistência local. O critério de conclusão é permitir que um visitante explore a operação inteira, crie registros, encontre erros compreensíveis e recomece sem configuração. Não é um serviço contratado por oficinas reais.

## Resultado da revisão

| Área                        | Situação                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operação                    | Quadro/lista, pesquisa, etapas, responsáveis e indicadores funcionais                                                                              |
| Entrada                     | Cliente e veículo novos ou existentes, rascunho, quilometragem, checklist e previsão                                                               |
| Orçamento                   | Peças/mão de obra, quantidades decimais, descontos, versões e impressão                                                                            |
| Aprovação                   | Aprovação/recusa total ou parcial simulada; versão antiga não pode ser decidida                                                                    |
| Execução                    | Apenas itens aprovados; bloqueio por peça, tarefas e conferências finais                                                                           |
| Recebimento/entrega         | Lançamentos fictícios parciais, saldo, prevenção de pagamento duplicado e motivo para entrega com saldo                                            |
| Clientes/veículos           | Cadastro, **edição de cliente**, **cadastro e edição independente de veículos**, histórico e acesso à OS ativa                                     |
| Novo atendimento contextual | Cliente/veículo selecionados são levados à nova OS; rascunho anterior é preservado até descarte explícito                                          |
| Persistência/recuperação    | Exportação e **importação JSON validada**, prévia antes da substituição, recuperação de armazenamento corrompido e restauração dos exemplos        |
| Conflitos                   | Revisão desatualizada de orçamento/cadastro é recusada; importação é interrompida quando o cenário muda em outra aba                               |
| Apresentação                | Interface responsiva, claro/escuro, PT/EN, impressão, navegação por teclado e títulos por tela                                                     |
| Compartilhamento            | Metadados Open Graph/Twitter e imagem de apresentação gerada pelo Next.js                                                                          |
| Hospedagem                  | Build Next.js, Node 24.x, arquivos ignorados no deploy e roteiro Vercel; **publicado em [patio-gamma.vercel.app](https://patio-gamma.vercel.app)** |

## Lacunas resolvidas nesta revisão

- Era possível criar clientes, mas não corrigir nome/contato. Agora o cadastro é editável e mantém o histórico.
- Veículos só podiam ser criados ao abrir uma OS. Agora podem ser cadastrados e corrigidos no cliente, com validação de placa duplicada e vínculo.
- “Criar atendimento” abria um formulário sem o cliente escolhido. Agora preserva o contexto e evita apagar outro rascunho silenciosamente.
- A exportação JSON só servia para inspeção. Agora existe recuperação por arquivo de até 2 MB, resumo e confirmação, mantendo idioma/tema.
- A validação do arquivo cobre vínculos, placas/números duplicados, versões, decisões, tarefas e recebimentos incompatíveis; erros não substituem os dados atuais.
- URLs inválidas dentro da rota abrangente da demo passam pela página de não encontrado. IDs de OS são locais ao visitante: uma OS ausente usa o estado vazio de recuperação.
- Títulos por tela e prévia de compartilhamento foram adicionados. Os testes agora podem executar uma instância isolada do build de produção.

## Publicação concluída

A conta foi autenticada pelo usuário e o projeto `patio` foi criado em `felipehborges-projects`. O deploy de produção está **READY** em [patio-gamma.vercel.app](https://patio-gamma.vercel.app).

Acesso sem login, HTTPS, redirecionamento da raiz, rotas diretas de OS/clientes/recebimentos/ajustes, CSP, imagem social e resposta 404 para rota inválida foram conferidos no endereço público. O procedimento de atualização está em [Publicação na Vercel](publicacao-vercel.md).

Não restam bloqueios identificados para disponibilizar esta demo de portfólio. O deploy foi feito pela CLI; conectar um repositório Git para publicação automática é uma melhoria de manutenção, não um requisito funcional.

## O que seria necessário para uso real

Esses itens não bloqueiam a demo de portfólio, mas precisam existir antes de operar dados de uma oficina:

- Autenticação, usuários e permissões reais, isolamento por oficina.
- Backend com banco compartilhado, autorização por operação, transações, auditoria e backups.
- Portal externo de aprovação com acesso seguro, prazo de validade e registro verificável da decisão.
- Uploads com limites/validação e armazenamento de imagens; hoje são ilustrações.
- Integrações de cobrança, mensagens e documentos fiscais, se fizerem parte do produto contratado.
- Monitoramento, recuperação de falhas e cuidados com dados pessoais.

Estoque, compras, agenda, caixa/despesas e relatórios gerenciais são expansões de produto. Para esta demo focada no atendimento, não é necessário adicioná-los antes de publicar. Recebimentos atuais não constituem contabilidade nem conciliação bancária.

## Limites mantidos explícitos

O visitante pode editar e cancelar atendimentos conforme as regras, mas não apagar seu histórico. Preferências e registros pertencem ao navegador/origem; limpar os dados inicia outro cenário. A sincronização local não oferece transações entre abas estritamente simultâneas. Não existe login fictício sugerindo segurança real nem envio de mensagens, arquivos ou pagamentos a terceiros.

Veja os comandos e evidências atualizados em [Validação](validacao.md).
