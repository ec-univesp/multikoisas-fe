<div align="center">

# MultiKoisas

**Tudo em um só lugar.**

Vitrine de afiliados da MultiKoisas, loja física de utilidades para casa, cozinha, limpeza e organização.
O site mostra os produtos e leva o visitante para comprar nas lojas parceiras: a venda acontece lá, não aqui.

[![Site no ar](https://img.shields.io/badge/site-multikoisas.netlify.app-0CCE6B?style=flat-square&logo=netlify&logoColor=white)](https://multikoisas.netlify.app)
[![API](https://img.shields.io/badge/API-Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black)](https://multikoisas-univesp.onrender.com/swagger-ui/index.html)
[![Tarefas](https://img.shields.io/badge/tarefas-Linear-5E6AD2?style=flat-square&logo=linear&logoColor=white)](https://linear.app/skimpara/project/pi2-site-multikoisas-f810dc2fae75)
![Versão](https://img.shields.io/badge/versão-0.14.0-4F46E5?style=flat-square)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-estrito-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11-F69220?style=flat-square&logo=pnpm&logoColor=white)
![MSW](https://img.shields.io/badge/MSW-API_simulada_nos_testes-FF6A33?style=flat-square&logo=mockserviceworker&logoColor=white)
![Spring Boot](https://img.shields.io/badge/back--end-Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)

![Testes](https://img.shields.io/badge/testes-626-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Cobertura](https://img.shields.io/badge/cobertura-98%25-22C55E?style=flat-square)
![Lighthouse desktop](https://img.shields.io/badge/Lighthouse_desktop-100_·_96_·_100_·_100-0CCE6B?style=flat-square&logo=lighthouse&logoColor=white)
![Arquitetura](https://img.shields.io/badge/arquitetura-Feature--Sliced_Design-4F46E5?style=flat-square)

Projeto integrador da UNIVESP · time Squad PI2

</div>

---

## Links

| O quê                         | Onde                                                                    |
| ----------------------------- | ----------------------------------------------------------------------- |
| Site no ar                    | <https://multikoisas.netlify.app>                                       |
| Painel administrativo         | <https://multikoisas.netlify.app/panel>                                 |
| API do projeto (back-end)     | <https://multikoisas-univesp.onrender.com>                              |
| Documentação da API (Swagger) | <https://multikoisas-univesp.onrender.com/swagger-ui/index.html>        |
| Código do back-end            | <https://github.com/pi2alunos/multikoisas-univesp>                      |
| Quadro de tarefas do time     | <https://linear.app/skimpara/project/pi2-site-multikoisas-f810dc2fae75> |

## Duas superfícies, um projeto

| Endereço                | O que é                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `/`                     | Página inicial: a loja, produtos em destaque, como comprar, avaliações do Google e mapa |
| `/showcase`             | Vitrine com todos os produtos, busca e filtro por categoria                             |
| `/product/<slug>`       | Página do produto: fotos, descrição e os botões das lojas onde comprar                  |
| `/panel`                | Login do painel                                                                         |
| `/admin/products`       | Produtos: criar, editar, apagar, fotos, categoria e links de compra                     |
| `/admin/categories`     | Categorias                                                                              |
| `/admin/sales-channels` | Canais de venda (Shopee, Mercado Livre, Magalu...)                                      |
| `/admin/users`          | Usuários do painel                                                                      |
| `/store`                | Configurações de site: descrição, endereço, logo e foto da loja, redes sociais e WhatsApp |

## Como o front fala com a API

Os dados vêm da API do time, um serviço Spring Boot publicado no Render (<https://multikoisas-univesp.onrender.com>, Swagger em `/swagger-ui/index.html`).

- **Tudo passa pelo próprio site.** As telas chamam `/api/...`, e o `next.config.ts` repassa essas chamadas para a API. A API não libera chamadas vindas de outros domínios (CORS), então o navegador fala só com o domínio do site.
- **Leitura é livre, gravação pede login.** O `src/proxy.ts` deixa passar toda leitura. Gravação só sai do painel: precisa vir do mesmo site, ter sessão válida e mirar um recurso da loja; o proxy põe o token da API (`Authorization: Bearer`) antes de repassar.
- **Login do painel.** `/panel` manda usuário e senha para `POST /auth/login` da API. A sessão fica em dois cookies httpOnly (a sessão assinada com `SESSION_SECRET` e o token da API) e dura o mesmo que o token, no máximo 8 horas.
- **Endereço configurável.** A variável `MULTIKOISAS_API_URL` troca o endereço da API. Sem ela, o projeto usa o do Render.
- **Testes não tocam a API real.** O banco é compartilhado com o time: os testes usam uma cópia simulada do contrato (`src/shared/local-api/`, ligada ao MSW em `src/test/msw/`).
- **Avaliações do Google.** A nota, o total e o resumo das avaliações vêm da Places API do Google, lidos no servidor uma vez por dia.

### Testar a API no Postman ou no Bruno

Importe `collections/multikoisas-api.postman_collection.json` no Postman (**Import**) ou no Bruno (**Import Collection → Postman Collection**). Preencha `username` e `password` nas variáveis da coleção e rode **0 - Login**: o token fica salvo e vai sozinho nas rotas que pedem login. As requisições com **(grava no banco)** no nome alteram o banco real do time.

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

Abra <http://localhost:3000> e a vitrine aparece. O painel fica em <http://localhost:3000/panel>.

### Variáveis de ambiente

Copie o `.env.example` para `.env.local` e preencha. Nenhuma delas vai para o repositório.

| Variável                | Para quê                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `MULTIKOISAS_API_URL`   | Endereço da API do time; sem ela, <https://multikoisas-univesp.onrender.com>                                  |
| `SESSION_SECRET`        | Texto aleatório com 32 caracteres ou mais (`openssl rand -base64 48`); em `pnpm dev` há um de desenvolvimento |
| `GOOGLE_PLACES_API_KEY` | Chave da Places API (New); sem ela a seção de avaliações do Google não aparece                                |

O login do painel usa as contas cadastradas na API (as mesmas de **Usuários** no painel).

### Se algo der errado

**`pnpm: command not found`**: o corepack não foi habilitado. Rode `corepack enable pnpm` e abra um terminal novo.

**A porta 3000 já está em uso**: outro projeto está rodando nela. Suba em outra porta com `pnpm dev --port 3001`.

**No macOS, o git reclama da licença do Xcode**: aponte as ferramentas de linha de comando para a instalação leve com
`sudo xcode-select --switch /Library/Developer/CommandLineTools`.

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

## Arquitetura: Feature-Sliced Design

O código segue o [Feature-Sliced Design](https://feature-sliced.design): o projeto é dividido em camadas, e cada camada só importa das camadas abaixo dela. Assim, mexer numa tela não quebra o que vem de baixo, e cada pedaço tem um lugar óbvio.

```
app  →  widgets  →  features  →  entities  →  shared
```

| Camada         | O que mora aqui                                                             | Exemplos neste projeto                                                         |
| -------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/app`      | Rotas do Next.js e layouts. Só monta a página com os blocos de baixo.       | `(site)/` vitrine pública, `(admin)/` painel, `(auth)/` login                  |
| `src/widgets`  | Blocos grandes de página, que juntam features e entities.                   | `site-header`, `featured-products`, `google-reviews`, `site-footer`            |
| `src/features` | Uma ação do usuário, com o seu estado e formulário.                         | `product-admin`, `user-admin`, `showcase-filter`, `social-network-admin`       |
| `src/entities` | Os conceitos do negócio: tipo, leitura da API e o componente que os mostra. | `product`, `sales-channel`, `social-network`, `store-settings`, `google-place` |
| `src/shared`   | O que não sabe nada do negócio.                                             | `api/` (cliente HTTP), `local-api/` (API simulada), `ui/`                      |

`src/components` é a biblioteca de componentes que veio do template TailAdmin (botão, tabela, modal, campos de formulário) e funciona como parte do `shared`: antes de criar um componente, procure lá.

Cada módulo guarda os testes ao lado, em `tests/unit/` (função ou componente isolado) e `tests/integration/` (tela conversando com a API simulada pelo MSW).
