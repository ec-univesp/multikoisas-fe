import { fetchProducts, type Product } from '@/entities/product';
import { VitrineFilter, VitrineHeading } from '@/features/vitrine-filter';

const loadProducts = (): Promise<Product[]> => fetchProducts().catch(() => []);

export const Vitrine = async () => {
  const products = await loadProducts();
  const categories = [...new Set(products.map((product) => product.category))].sort();

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
      <VitrineHeading />
      <VitrineFilter products={products} categories={categories} />
    </section>
  );
};
