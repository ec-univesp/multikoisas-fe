<div align="center">

# MultiKoisas

**Tudo em um só lugar.**

Vitrine de afiliados da MultiKoisas, loja física de utilidades para casa, cozinha, limpeza e organização.
O site mostra os produtos e leva o visitante para comprar nas lojas parceiras — a venda acontece lá, não aqui.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-estrito-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11-F69220?style=flat-square&logo=pnpm&logoColor=white)

![Testes](https://img.shields.io/badge/testes-53-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Cobertura](https://img.shields.io/badge/cobertura-100%25-22C55E?style=flat-square)
![Lighthouse](https://img.shields.io/badge/Lighthouse-99_·_100_·_100_·_100-0CCE6B?style=flat-square&logo=lighthouse&logoColor=white)
![Arquitetura](https://img.shields.io/badge/arquitetura-Feature--Sliced_Design-4F46E5?style=flat-square)

![Mercado Livre](https://img.shields.io/badge/Mercado_Livre-FFE600?style=flat-square&logo=mercadopago&logoColor=2D3277)
![Shopee](https://img.shields.io/badge/Shopee-D0401C?style=flat-square&logo=shopee&logoColor=white)
![AliExpress](https://img.shields.io/badge/AliExpress-C92704?style=flat-square&logo=alibabadotcom&logoColor=white)

Projeto integrador da UNIVESP · time Squad PI2

</div>

---

## Duas superfícies, um projeto

| Endereço | O que é |
| --- | --- |
| `/` | Vitrine pública: produtos com filtro por categoria e busca |
| `/produto/<slug>` | Página do produto: fotos, descrição e um botão por loja parceira |
| `/admin` | Painel administrativo |
| `/admin/produtos` | Lista dos produtos publicados |

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

Com isso resolvido, são três passos:

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

**As fotos dos produtos não carregam** — elas vêm do Pexels por URL, então a primeira carga precisa de internet. Depois ficam em cache.

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

## Onde fica cada coisa

```
src/
  app/
    (site)/        páginas públicas: vitrine e detalhe do produto
    (admin)/       páginas do painel
  widgets/         blocos de página: hero, vitrine, rodapé, detalhe
  features/        interações: filtro e busca da vitrine
  entities/        o produto: tipo, catálogo, validação e card
  components/      biblioteca de componentes do projeto (botão, tabela, modal...)
  data/            products.json — o catálogo
```

A regra de dependência é de cima para baixo: `app` usa `widgets`, que usa `features`, que usa `entities`. Nunca o contrário.

**Reuse o que já existe.** Antes de criar um componente, procure em `src/components/` — o template traz botão, tabela, modal, formulário, badge e mais. Escrever de novo o que já está pronto gera inconsistência visual e manutenção em dobro.

## Como os produtos são cadastrados hoje

Ainda não existe banco de dados. O catálogo é o arquivo `src/data/products.json`, e cada produto tem esta forma:

```json
{
  "slug": "garrafa-termica-1l",
  "name": "Garrafa Térmica 1L",
  "category": "Cozinha",
  "shortDescription": "Aparece no card da vitrine.",
  "longDescription": "Aparece na página do produto.",
  "images": ["https://images.pexels.com/photos/..."],
  "storeLinks": [
    { "store": "mercado-livre", "url": "https://..." },
    { "store": "shopee", "url": "https://..." }
  ]
}
```

A primeira loja da lista é a principal: é o botão que aparece no card da vitrine.

O arquivo é validado quando o projeto compila. Produto sem link de compra, sem imagem, com campo vazio ou com `slug` repetido **derruba o build** em vez de chegar quebrado no site. Se o build falhar reclamando de um produto, a mensagem diz qual e o que está faltando.

Para acrescentar uma loja nova (Amazon, por exemplo), basta uma entrada em `STORE_PRESENTATION`, em `src/entities/product/types.ts`, com o nome, o texto do botão e as cores dela. Todos os botões do site passam a reconhecê-la.

## Regras que o projeto não quebra

- **Nenhum preço na vitrine.** Quem vende é a loja parceira.
- **O botão de compra sempre diz o nome da loja** ("Comprar na Shopee"), nunca um "Comprar" genérico: o visitante precisa saber para onde está indo.
- **Mobile primeiro.** Projete em 375px de largura antes de pensar no desktop, com alvos de toque de pelo menos 44 pixels.
- **Tema claro.** Não há modo escuro em nenhuma das duas superfícies.
- **Textos em português**, sempre.
- **Testes junto com o código**, com cobertura mínima de 90%.

## Publicação

O site é publicado no Netlify. A configuração está em `netlify.toml`: comando de build, versão do Node e o plugin do Next.js, que é quem faz as rotas estáticas e a otimização de imagem funcionarem lá.

Para conectar pela primeira vez: no Netlify, **Add new site → Import an existing project**, escolha este repositório e confirme. As configurações de build vêm do `netlify.toml`, não precisa preencher nada na tela.

Depois de conectar, confira em **Site configuration → Build & deploy** qual branch está marcada como produção. Apontar para a branch errada faz o site servir uma versão antiga indefinidamente, sem nenhum erro aparecer.

Cada Pull Request ganha um endereço de prévia automático, para o time revisar antes de aprovar.

## Como contribuir

Toda branch nasce da `developer` e volta para ela por Pull Request. A `main` só recebe versões prontas para publicação.

```bash
git checkout developer
git pull
git checkout -b feat/nome-do-que-voce-vai-fazer
```

Mensagens de commit em inglês, no padrão Conventional Commits: `feat:` para funcionalidade nova, `fix:` para correção, `docs:` para documentação, `test:` para teste, `refactor:` quando o comportamento não muda. Um assunto por commit.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Vitest com Testing Library · pnpm

Vitrine e painel compartilham a mesma biblioteca de componentes, para as duas superfícies falarem a mesma língua.
