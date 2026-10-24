import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { SalesChannelAdminScreen } from "@/features/sales-channel-admin";

export const metadata: Metadata = {
  title: "Canais de venda | MultiKoisas",
  description: "Lojas e redes onde os produtos da vitrine da MultiKoisas são vendidos.",
};

const CanaisPage = () => (
  <div>
    <PageBreadcrumb pageTitle="Canais de venda" />
    <SalesChannelAdminScreen />
  </div>
);

export default CanaisPage;
