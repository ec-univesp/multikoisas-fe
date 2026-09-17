import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/entities/product';
import { ProductDetail } from '@/widgets/product-detail';

export const generateStaticParams = () => getProducts().map((product) => ({ slug: product.slug }));

export const generateMetadata = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return { title: product.name, description: product.shortDescription };
};

const ProductPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return <ProductDetail product={product} />;
};

export default ProductPage;
