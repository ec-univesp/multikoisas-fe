import type { Metadata } from "next";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { MonthlyClicksChart } from "@/components/dashboard/MonthlyClicksChart";
import { StoreClicksDistribution } from "@/components/dashboard/StoreClicksDistribution";
import { TopClickedProducts } from "@/components/dashboard/TopClickedProducts";
import { TopSearchedCategories } from "@/components/dashboard/TopSearchedCategories";
import { getProducts } from "@/entities/product";

export const metadata: Metadata = {
  title: "Painel | MultiKoisas",
  description: "Painel administrativo da vitrine MultiKoisas.",
};

export default function AdminDashboardPage() {
  const publishedProductsCount = getProducts().length;

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <DashboardMetrics publishedProductsCount={publishedProductsCount} />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <MonthlyClicksChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <StoreClicksDistribution />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <TopClickedProducts />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <TopSearchedCategories />
      </div>
    </div>
  );
}
