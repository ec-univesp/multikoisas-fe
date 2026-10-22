import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { fetchCategories } from "@/entities/product";
import { CategoryAdminPanel } from "@/features/category-admin";

export const metadata: Metadata = {
  title: "Categorias | MultiKoisas",
  description: "Categorias usadas para organizar os produtos da vitrine da MultiKoisas.",
};

const CategoriasPage = async () => {
  const categories = await fetchCategories({ fresh: true });

  return (
    <div>
      <PageBreadcrumb pageTitle="Categorias" />
      <CategoryAdminPanel initialCategories={categories} />
    </div>
  );
};

export default CategoriasPage;
