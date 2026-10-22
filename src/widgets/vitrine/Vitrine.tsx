import { fetchProducts } from '@/entities/product';
import { VitrineFilter } from '@/features/vitrine-filter';

export const Vitrine = async () => {
  const products = await fetchProducts();
  const categories = [...new Set(products.map((product) => product.category))].sort();

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <h2 className="text-2xl font-semibold text-gray-800">Produtos</h2>
      <div className="mt-6">
        <VitrineFilter products={products} categories={categories} />
      </div>
    </section>
  );
};
