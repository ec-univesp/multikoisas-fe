"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { STORE_PRESENTATION } from "@/entities/product";
import { storeClickDistribution } from "@/data/dashboard-metrics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});


export const StoreClicksDistribution = () => {
  const labels = storeClickDistribution.map(
    (share) => STORE_PRESENTATION[share.store].name,
  );
  const colors = storeClickDistribution.map((share) =>
    STORE_PRESENTATION[share.store].brandColor,
  );
  const series = storeClickDistribution.map((share) => share.clicks);

  const options: ApexOptions = {
    chart: { fontFamily: "Outfit, sans-serif", type: "donut" },
    labels,
    colors,
    legend: { position: "bottom", fontFamily: "Outfit" },
    dataLabels: {
      formatter: (value: number) => `${value.toFixed(0)}%`,
      style: { fontSize: "14px", fontWeight: 700, colors: ["#FFFFFF"] },
      dropShadow: { enabled: false },
    },
    stroke: { width: 2, colors: ["#FFFFFF"] },
    tooltip: {
      theme: "light",
      fillSeriesColor: false,
      y: { formatter: (value: number) => `${value} cliques` },
    },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Distribuição de cliques por loja parceira
      </h3>
      <div className="mt-4 flex justify-center">
        <ReactApexChart options={options} series={series} type="donut" height={280} />
      </div>
    </div>
  );
};
