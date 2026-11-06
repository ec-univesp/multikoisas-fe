import type { Metadata } from 'next';
import { ProductPageContent } from './ProductPageContent';

export const metadata = {
  title: 'Detalhes do produto',
  description: 'Fotos, descrição e lojas parceiras onde comprar o produto da MultiKoisas.',
} satisfies Metadata;

const ProductPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  return <ProductPageContent slug={slug} />;
};

export default ProductPage;
