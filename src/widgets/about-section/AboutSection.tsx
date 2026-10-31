import { fetchSocialNetworks, type SocialNetwork } from '@/entities/social-network';

const loadSocialNetworks = (): Promise<SocialNetwork[]> => fetchSocialNetworks().catch(() => []);

const PURCHASE_FACTS = [
  'Você escolhe o produto aqui na vitrine.',
  'O pagamento é feito na loja parceira escolhida.',
  'A entrega e o acompanhamento do pedido ficam com a loja parceira.',
];

export const AboutSection = async () => {
  const socialNetworks = await loadSocialNetworks();

  return (
    <section id="sobre" className="mx-auto max-w-7xl scroll-mt-4 px-4 pb-12 lg:px-8">
      <div className="grid gap-6 rounded-xl bg-white p-5 shadow-theme-xs lg:grid-cols-12 lg:items-center lg:p-10">
        <div className="lg:col-span-7">
          <h2 className="text-2xl font-extrabold tracking-tight text-store-navy">
            Sobre a MultiKoisas e nossas lojas parceiras
          </h2>
          <p className="mt-3 text-gray-700">
            A MultiKoisas é uma loja de utilidades para casa, cozinha, limpeza, ferragens e organização.
          </p>
          <p className="mt-2 text-gray-600">
            Aqui na vitrine você encontra o produto certo e conclui a compra direto na loja parceira da sua
            preferência.
          </p>
          {socialNetworks.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {socialNetworks.map((socialNetwork) => (
                <li key={socialNetwork.id}>
                  <a
                    href={socialNetwork.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center rounded-lg bg-gray-100 px-4 text-sm font-bold text-store-navy hover:bg-store-navy hover:text-white"
                  >
                    {socialNetwork.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl bg-gray-50 p-5 lg:col-span-5">
          <h3 id="como-funciona-a-compra" className="font-bold text-store-navy">
            Como funciona a compra
          </h3>
          <ul aria-labelledby="como-funciona-a-compra" className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
            {PURCHASE_FACTS.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
