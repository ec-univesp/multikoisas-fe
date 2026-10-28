import { BadgeCheck, MousePointerClick, ShieldCheck, ShoppingBag } from 'lucide-react';

const PURCHASE_STEPS = [
  {
    title: 'Escolha o produto',
    description: 'Veja fotos, categoria e descrição de cada item aqui na vitrine.',
    Icon: MousePointerClick,
  },
  {
    title: 'Sua plataforma favorita',
    description: 'Siga para a Shopee ou o Mercado Livre pelo botão da loja que preferir.',
    Icon: ShoppingBag,
  },
  {
    title: 'Compre com segurança',
    description: 'Pagamento e entrega ficam com a loja parceira, onde você acompanha o pedido.',
    Icon: ShieldCheck,
  },
];

export const HeroV2 = () => (
  <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
    <div className="rounded-xl bg-white p-5 shadow-theme-xs lg:p-8">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-store-yellow px-3 py-1 text-xs font-bold tracking-wider text-store-navy-950 uppercase">
        <BadgeCheck aria-hidden className="size-4" />
        Vitrine digital oficial
      </span>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-store-navy sm:text-3xl">
        Você escolhe na nossa vitrine e compra onde preferir!
      </h1>
      <p className="mt-2 max-w-3xl text-gray-600">
        Utilidades para casa, cozinha, limpeza, ferragens e organização. Escolha seus itens aqui e finalize a compra
        na loja parceira da sua preferência.
      </p>
      <ol aria-label="Como comprar" className="mt-6 grid gap-3 md:grid-cols-3">
        {PURCHASE_STEPS.map(({ title, description, Icon }, position) => (
          <li key={title} className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-store-navy text-lg font-extrabold text-white"
            >
              {position + 1}
            </span>
            <div>
              <h3 className="flex items-center gap-1.5 font-bold text-store-navy">
                <Icon aria-hidden className="size-4" />
                {title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  </section>
);
