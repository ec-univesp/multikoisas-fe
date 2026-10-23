import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { ProductAdminScreen } from "@/features/product-admin";

export const metadata: Metadata = {
  title: "Produtos | MultiKoisas",
  description: "Produtos publicados na vitrine da MultiKoisas.",
};

const ProdutosPage = () => (
  <div>
    <PageBreadcrumb pageTitle="Produtos" />
    <ProductAdminScreen />
  </div>
);

export default ProdutosPage;
