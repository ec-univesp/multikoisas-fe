import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { CategoryAdminScreen } from "@/features/category-admin";

export const metadata: Metadata = {
  title: "Categorias | MultiKoisas",
  description: "Categorias usadas para organizar os produtos da vitrine da MultiKoisas.",
};

const CategoriasPage = () => (
  <div>
    <PageBreadcrumb pageTitle="Categorias" />
    <CategoryAdminScreen />
  </div>
);

export default CategoriasPage;
