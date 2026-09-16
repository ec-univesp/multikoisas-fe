import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/entities/product';
import { ProductDetail } from '@/widgets/product-detail';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';

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

  return (
    <>
      <SiteHeader />
      <main>
        <ProductDetail product={product} />
      </main>
      <SiteFooter />
    </>
  );
};

export default ProductPage;
