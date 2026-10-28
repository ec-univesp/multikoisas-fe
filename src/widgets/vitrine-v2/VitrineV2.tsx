import { fetchProducts } from '@/entities/product';
import { VitrineFilterV2 } from '@/features/vitrine-filter';

export const VitrineV2 = async () => {
  const products = await fetchProducts();
  const categories = [...new Set(products.map((product) => product.category))].sort();

  return (
    <section id="vitrine" className="mx-auto max-w-7xl scroll-mt-4 px-4 pb-12 lg:px-8">
      <h2 className="sr-only">Vitrine de produtos</h2>
      <VitrineFilterV2 products={products} categories={categories} />
    </section>
  );
};
