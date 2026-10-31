import { fetchProducts } from '@/entities/product';
import { VitrineFilter } from '@/features/vitrine-filter';

export const Vitrine = async () => {
  const products = await fetchProducts();
  const categories = [...new Set(products.map((product) => product.category))].sort();

  return (
    <section id="vitrine" className="mx-auto max-w-7xl scroll-mt-4 px-4 pb-12 lg:px-8">
      <h2 tabIndex={-1} className="sr-only">Vitrine de produtos</h2>
      <VitrineFilter products={products} categories={categories} />
    </section>
  );
};
