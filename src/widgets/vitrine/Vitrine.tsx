import { fetchProducts, type Product } from '@/entities/product';
import { VitrineFilter, VitrineHeading } from '@/features/vitrine-filter';

const loadProducts = (): Promise<Product[]> => fetchProducts().catch(() => []);

export const Vitrine = async () => {
  const products = await loadProducts();
  const categories = [...new Set(products.map((product) => product.category))].sort();

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 pb-12 lg:px-8">
      <VitrineHeading />
      <p className="mt-1 mb-4 text-gray-600">Busque pelo nome ou escolha uma categoria. Abra o produto para ver todos os detalhes.</p>
      <VitrineFilter products={products} categories={categories} />
    </section>
  );
};
