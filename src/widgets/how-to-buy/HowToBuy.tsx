import { MousePointerClick, ShieldCheck, ShoppingBag } from 'lucide-react';
import { fetchProducts, toStoresPhrase, type Product } from '@/entities/product';

const loadProducts = (): Promise<Product[]> => fetchProducts().catch(() => []);

const storeStepDescription = (storesPhrase: string | null): string =>
  storesPhrase
    ? `Conclua a compra ${storesPhrase} pelo botão da loja que preferir.`
    : 'Conclua a compra pelo botão da loja que preferir.';

export const HowToBuy = async () => {
  const storesPhrase = toStoresPhrase(await loadProducts());
  const purchaseSteps = [
    {
      title: 'Escolha o produto',
      description: 'Veja fotos, categoria e descrição de cada item aqui na vitrine.',
      Icon: MousePointerClick,
    },
    { title: 'Sua plataforma favorita', description: storeStepDescription(storesPhrase), Icon: ShoppingBag },
    {
      title: 'Compre com segurança',
      description: 'Pagamento e entrega ficam com a loja parceira, onde você acompanha o pedido.',
      Icon: ShieldCheck,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
      <div className="rounded-xl bg-white p-5 shadow-theme-xs lg:p-6">
        <h2 className="text-xl font-extrabold tracking-tight text-store-navy">
          Você escolhe na nossa vitrine e compra onde preferir!
        </h2>
        <ol aria-label="Como comprar" className="mt-4 grid gap-3 md:grid-cols-3">
          {purchaseSteps.map(({ title, description, Icon }, position) => (
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
};
