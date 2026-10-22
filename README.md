<div align="center">

# MultiKoisas

**Tudo em um só lugar.**

Vitrine de afiliados da MultiKoisas, loja física de utilidades para casa, cozinha, limpeza e organização.
O site mostra os produtos e leva o visitante para comprar nas lojas parceiras — a venda acontece lá, não aqui.

[![Site no ar](https://img.shields.io/badge/site-multikoisas.netlify.app-0CCE6B?style=flat-square&logo=netlify&logoColor=white)](https://multikoisas.netlify.app)
[![API](https://img.shields.io/badge/API-Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black)](https://multikoisas-univesp.onrender.com/swagger-ui/index.html)
![Versão](https://img.shields.io/badge/versão-0.2.0-4F46E5?style=flat-square)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-estrito-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11-F69220?style=flat-square&logo=pnpm&logoColor=white)

![Testes](https://img.shields.io/badge/testes-89-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Cobertura](https://img.shields.io/badge/cobertura-97%25-22C55E?style=flat-square)
![Lighthouse desktop](https://img.shields.io/badge/Lighthouse_desktop-100_·_96_·_100_·_100-0CCE6B?style=flat-square&logo=lighthouse&logoColor=white)
![Arquitetura](https://img.shields.io/badge/arquitetura-Feature--Sliced_Design-4F46E5?style=flat-square)

Projeto integrador da UNIVESP · time Squad PI2

</div>

---

## Links

| O quê | Onde |
| --- | --- |
| Site no ar | <https://multikoisas.netlify.app> |
| Painel administrativo | <https://multikoisas.netlify.app/admin> |
| API do projeto (back-end) | <https://multikoisas-univesp.onrender.com> |
| Documentação da API (Swagger) | <https://multikoisas-univesp.onrender.com/swagger-ui/index.html> |
| Código do back-end | <https://github.com/pi2alunos/multikoisas-univesp> |
| Quadro de tarefas do time | santi, projeto `UNIV` — <https://getsanti.app/p/UNIV> |

## Duas superfícies, um projeto

| Endereço | O que é |
| --- | --- |
| `/` | Vitrine pública: produtos da API com filtro por categoria e busca |
| `/produto/<slug>` | Página do produto: descrição completa e onde comprar |
| `/admin` | Painel com o total de produtos publicados e métricas de cliques (ainda de exemplo) |
| `/admin/produtos` | Criar, editar e apagar produtos, escolhendo a categoria |
| `/admin/categorias` | Criar, renomear e apagar categorias |

O endereço do produto é o nome dele seguido do id na API, como `/produto/garrafa-termica-1l-12`.

## Como o front fala com a API

O catálogo vem da API do time, um serviço Spring Boot publicado no Render.

- **Leitura no servidor.** A vitrine e o painel buscam produtos e categorias em `src/entities/product/api.ts`, que roda no servidor do Next.js. A vitrine guarda o resultado por 5 minutos; o painel lê sempre o dado mais recente.
- **Escrita pelo navegador, através do próprio site.** As telas do painel chamam `/api/...`, e o `next.config.ts` repassa essas chamadas para a API. Assim o navegador fala só com o domínio do site: a API não libera chamadas vindas de outros domínios (CORS), então a chamada direta seria bloqueada.
- **Endereço configurável.** A variável de ambiente `MULTIKOISAS_API_URL` troca o endereço da API. Sem ela, o projeto usa <https://multikoisas-univesp.onrender.com>.

| Recurso da API | Uso no front |
| --- | --- |
| `GET /produto`, `POST /produto`, `PUT /produto/{id}`, `DELETE /produto/{id}` | vitrine, página do produto e cadastro de produtos |
| `GET /categoria`, `POST /categoria`, `PUT /categoria/{id}`, `DELETE /categoria/{id}` | filtro da vitrine e cadastro de categorias |
| `GET /categoriaproduto`, `POST /categoriaproduto`, `DELETE /categoriaproduto` | categoria de cada produto |

### O que você precisa saber antes de usar

- **A primeira visita do dia pode demorar.** O Render desliga a API quando ela fica parada, e ela leva cerca de 1 minuto para voltar.
- **A vitrine atualiza em até 5 minutos.** Um produto criado ou renomeado no painel aparece na vitrine depois desse intervalo.
- **O painel grava direto no banco do time.** Ainda não há login. Para testar, crie um produto ou uma categoria de teste e apague no final.
- **Fotos e botões de compra ainda não vêm da API.** Os produtos mostram uma imagem genérica e o aviso "Links de compra em breve" até o back-end expor esses dados.

## Situação do projeto

Tarefas no santi, projeto `UNIV`.

**Pronto**
- Vitrine, página do produto e painel lendo produtos e categorias da API.
- Cadastro de produtos no painel (criar, editar, apagar e escolher categoria).
- Cadastro de categorias no painel.

**Em andamento**
- Testes de integração simulando a API com MSW.
- Redes sociais da loja no rodapé da vitrine.
- Cadastro de canais de venda e de redes sociais no painel.

**Esperando o back-end**
- Fotos dos produtos: falta a API permitir ler a imagem.
- Botões "Comprar na loja": falta a API liberar os links por canal de venda.
- Login do painel: falta a API ter autenticação.

Os problemas encontrados na API estão no santi com a etiqueta `backend`, cada um com o arquivo, como reproduzir e a correção sugerida.

## Como rodar na sua máquina

Você precisa de **Node.js 20 ou mais novo** e **pnpm**. Para conferir o que já tem instalado:

```bash
node --version
pnpm --version
```

Se o `pnpm` não estiver instalado, a forma mais simples é pelo próprio Node:

```bash
corepack enable pnpm
```

Com isso resolvido:

```bash
git clone https://github.com/ec-univesp/multikoisas-fe.git
cd multikoisas-fe
pnpm install
pnpm dev
```

Abra <http://localhost:3000> e a vitrine aparece. O painel fica em <http://localhost:3000/admin>.

O servidor recarrega sozinho a cada arquivo salvo — não precisa reiniciar nada enquanto desenvolve.

### Se algo der errado

**`pnpm: command not found`** — o corepack não foi habilitado. Rode `corepack enable pnpm` e abra um terminal novo.

**A porta 3000 já está em uso** — outro projeto está rodando nela. Suba em outra porta com `pnpm dev --port 3001`.

**A vitrine demora ou dá erro na primeira carga** — a API estava dormindo no Render. Espere cerca de 1 minuto e recarregue a página.

**No macOS, o git reclama da licença do Xcode** — aponte as ferramentas de linha de comando para a instalação leve:
`sudo xcode-select --switch /Library/Developer/CommandLineTools`

## Comandos disponíveis

```bash
pnpm dev             # servidor de desenvolvimento
pnpm build           # compila para produção
pnpm start           # roda o que foi compilado (use depois do build)
pnpm lint            # procura problemas de código
pnpm typecheck       # confere os tipos do TypeScript
pnpm test            # roda os testes uma vez
pnpm test:watch      # roda os testes e fica observando os arquivos
pnpm test:coverage   # roda os testes e mede a cobertura (mínimo de 90%)
```

Antes de pedir revisão de um Pull Request, os quatro precisam passar: `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`.

Os testes nunca chamam a API de verdade: as respostas são simuladas, para nada ser gravado no banco do time.

## Onde fica cada coisa

```
src/
  app/
    (site)/        páginas públicas: vitrine e detalhe do produto
    (admin)/       páginas do painel: produtos, categorias e métricas
  widgets/         blocos de página: hero, vitrine, rodapé, detalhe
  features/
    product-admin/   cadastro de produtos no painel
    category-admin/  cadastro de categorias no painel
    vitrine-filter/  filtro por categoria e busca da vitrine
  entities/
    product/       o produto: tipo, leitura da API (api.ts) e card
  components/      biblioteca de componentes do projeto (botão, tabela, modal, formulário...)
```

A regra de dependência é de cima para baixo: `app` usa `widgets`, que usa `features`, que usa `entities`. Nunca o contrário.

**Reuse o que já existe.** Antes de criar um componente, procure em `src/components/` — o template traz botão, tabela, modal, formulário, badge e mais. Escrever de novo o que já está pronto gera inconsistência visual e manutenção em dobro.

Para acrescentar uma loja parceira nova (Amazon, por exemplo), basta uma entrada em `STORE_PRESENTATION`, em `src/entities/product/types.ts`, com o nome, o texto do botão e as cores dela.

## Regras que o projeto não quebra

- **Nenhum preço na vitrine.** Quem vende é a loja parceira.
- **O botão de compra sempre diz o nome da loja** ("Comprar na Shopee"), nunca um "Comprar" genérico: o visitante precisa saber para onde está indo.
- **Mobile primeiro.** Projete em 375px de largura antes de pensar no desktop, com alvos de toque de pelo menos 44 pixels.
- **Tema claro.** Não há modo escuro em nenhuma das duas superfícies.
- **Textos em português**, sempre.
- **Testes junto com o código**, com cobertura mínima de 90%.
- **O front não altera o back-end.** Problema encontrado na API vira tarefa no santi para o time do back-end.

## Publicação

O site está no ar em <https://multikoisas.netlify.app>, publicado pelo Netlify a partir da branch `main`. A configuração está em `netlify.toml`: comando de build, versão do Node e o plugin do Next.js, que é quem faz as rotas estáticas, a atualização a cada 5 minutos e o repasse de `/api` funcionarem lá.

O build busca o catálogo na API para gerar as páginas de produto. Se a API estiver dormindo, o deploy leva cerca de 1 minuto a mais.

Cada Pull Request ganha um endereço de prévia automático (`deploy-preview-<número>--multikoisas.netlify.app`), para o time revisar antes de aprovar.

Para conectar pela primeira vez: no Netlify, **Add new site → Import an existing project**, escolha este repositório e confirme. As configurações de build vêm do `netlify.toml`, não precisa preencher nada na tela. Depois confira em **Site configuration → Build & deploy** se a branch de produção é a `main`: apontar para a branch errada faz o site servir uma versão antiga sem nenhum erro aparecer.

## Como contribuir

Toda branch nasce da `developer` e volta para ela por Pull Request. A `main` só recebe versões prontas para publicação, também por Pull Request.

```bash
git checkout developer
git pull
git checkout -b feat/UNIV-<número>-nome-do-que-voce-vai-fazer
```

O número é o da tarefa no santi. Mensagens de commit em inglês, no padrão Conventional Commits: `feat:` para funcionalidade nova, `fix:` para correção, `docs:` para documentação, `test:` para teste, `refactor:` quando o comportamento não muda. Um assunto por commit.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Vitest com Testing Library · pnpm · API Spring Boot no Render

Vitrine e painel compartilham a mesma biblioteca de componentes, para as duas superfícies falarem a mesma língua.
