import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { fetchCategories, fetchProducts } from "@/entities/product";
import { ProductAdminPanel } from "@/features/product-admin";

export const metadata: Metadata = {
  title: "Produtos | MultiKoisas",
  description: "Produtos publicados na vitrine da MultiKoisas.",
};

const ProdutosPage = async () => {
  const [products, categories] = await Promise.all([
    fetchProducts({ fresh: true }),
    fetchCategories({ fresh: true }),
  ]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Produtos" />
      <ProductAdminPanel initialProducts={products} categories={categories} />
    </div>
  );
};

export default ProdutosPage;
