import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { fetchProducts } from "@/entities/product";
import { ProductAdminPanel } from "@/features/product-admin";

export const metadata: Metadata = {
  title: "Produtos | MultiKoisas",
  description: "Produtos publicados na vitrine da MultiKoisas.",
};

const ProdutosPage = async () => {
  const products = await fetchProducts();

  return (
    <div>
      <PageBreadcrumb pageTitle="Produtos" />
      <ProductAdminPanel initialProducts={products} />
    </div>
  );
};

export default ProdutosPage;
