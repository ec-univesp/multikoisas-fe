import { notFound } from 'next/navigation';
import { fetchProductBySlug, fetchProducts } from '@/entities/product';
import { ProductDetail } from '@/widgets/product-detail';

export const generateStaticParams = async () =>
  (await fetchProducts()).map((product) => ({ slug: product.slug }));

export const generateMetadata = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) return {};
  return { title: product.name, description: product.shortDescription };
};

const ProductPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) notFound();

  return <ProductDetail product={product} />;
};

export default ProductPage;
