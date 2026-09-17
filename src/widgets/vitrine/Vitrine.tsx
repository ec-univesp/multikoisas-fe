import { getCategories, getProducts } from '@/entities/product';
import { VitrineFilter } from '@/features/vitrine-filter';

export const Vitrine = () => (
  <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
    <h2 className="text-2xl font-semibold text-gray-800">Produtos</h2>
    <div className="mt-6">
      <VitrineFilter products={getProducts()} categories={getCategories()} />
    </div>
  </section>
);
