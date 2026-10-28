import { fetchProducts, ProductCardV2 } from '@/entities/product';

const PRIORITY_IMAGE_COUNT = 4;

export const VitrineV2 = async () => {
  const products = await fetchProducts();

  return (
    <section id="vitrine" className="mx-auto max-w-7xl scroll-mt-4 px-4 pb-12 lg:px-8">
      <h2 className="sr-only">Vitrine de produtos</h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {products.map((product, position) => (
          <li key={product.slug}>
            <ProductCardV2 product={product} hasPriorityImage={position < PRIORITY_IMAGE_COUNT} />
          </li>
        ))}
      </ul>
    </section>
  );
};
