# Publicação do Pátio na Vercel

**Publicado em 04/10/2026:** [patio-gamma.vercel.app](https://patio-gamma.vercel.app). Projeto `patio`, equipe `felipehborges-projects`. O acesso ao domínio de produção foi verificado sem sessão de login.

O projeto funciona como demonstração pública: cada visitante recebe seu próprio cenário fictício no navegador. Não precisa de login, banco, chaves de API nem variáveis obrigatórias.

## Configuração

| Campo                  | Valor                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| Framework Preset       | Next.js                                                                                                    |
| Node.js                | 24.x, fixado em `package.json`                                                                             |
| Root Directory         | `outputs/patio` se publicar este repositório inteiro; `./` se o repositório contiver apenas a pasta do app |
| Install Command        | `npm ci`                                                                                                   |
| Build Command          | `npm run build`                                                                                            |
| Output Directory       | Padrão do Next.js, sem sobrescrever                                                                        |
| Variáveis obrigatórias | Nenhuma                                                                                                    |

Não use `output: export`: as rotas da demo usam o App Router com renderização no servidor. A Vercel detecta o Next.js automaticamente. O comando local `npm start` usa a porta 3002; a plataforma cuida do runtime de hospedagem.

## Pelo terminal

Execute **dentro de `outputs/patio`**, onde está o `package.json` do Pátio:

```powershell
npx vercel login
npx vercel
```

Selecione sua conta/equipe e crie um projeto para o Pátio. A pasta do código é `./`. O primeiro comando autentica; o segundo vincula a pasta e cria uma prévia. Confira a URL retornada antes de publicar em produção:

```powershell
npx vercel --prod
```

A URL `*.vercel.app` é atribuída pela plataforma. O endereço atribuído nesta publicação é `patio-gamma.vercel.app`. `.vercel/` não entra no Git; `.vercelignore` exclui dependências locais, resultados de teste e documentação do envio pela CLI.

## Pelo GitHub

Crie/push um repositório com o app e o `package-lock.json`, importe-o em **Add New → Project** na Vercel e use a configuração da tabela. A revisão local não criou um repositório remoto nem publicou commits. Os deploys seguintes podem acompanhar os pushes da branch de produção.

## Conferência da URL publicada

1. Abrir a raiz em janela anônima: deve entrar em `/demo` com seis atendimentos.
2. Abrir diretamente `/demo/ordens/1042`, `/demo/clientes` e `/demo/ajustes` e recarregar.
3. Aprovar um orçamento, concluir tarefas e conferências, registrar recebimento e entregar.
4. Recarregar e confirmar que os registros permanecem; outra sessão deve ter dados próprios.
5. Exportar/importar um cenário e restaurar os exemplos.
6. Testar celular, PT/EN, tema escuro e impressão.
7. Conferir console, HTTPS, `/opengraph-image` e prévia do compartilhamento. As URLs da imagem usam as variáveis automáticas `VERCEL_PROJECT_PRODUCTION_URL`/`VERCEL_URL`.

O app mantém `noindex` por ser um ambiente de demonstração; a página do seu portfólio pode ser indexada e apontar para ele. Isso não impede abrir ou compartilhar o link. Os dados salvos no localhost não são transferidos automaticamente para o domínio publicado: exporte/importe e use somente informações fictícias.

## Validação local do build publicado

```powershell
npm run build
$env:PLAYWRIGHT_PRODUCTION = "1"
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_PRODUCTION
```

O Playwright inicia o build de produção na porta 3003 e o encerra ao terminar. Não reutiliza o servidor de desenvolvimento da porta 3002. Edge instalado é o padrão; `PLAYWRIGHT_CHANNEL=chrome` seleciona Chrome instalado.

## Referências

- [Next.js na Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Configuração de build e diretório raiz](https://vercel.com/docs/builds/configure-a-build)
- [Node.js suportado](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Login da CLI](https://vercel.com/docs/cli/login)
- [Deploy pela CLI](https://vercel.com/docs/cli/deploy)
