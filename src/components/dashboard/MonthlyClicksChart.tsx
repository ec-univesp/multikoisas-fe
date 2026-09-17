"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { monthlyStoreClicks } from "@/data/dashboard-metrics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export const MonthlyClicksChart = () => {
  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 220,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: {
      categories: monthlyStoreClicks.map((point) => point.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: { formatter: (value: number) => `${value} cliques` },
    },
  };

  const series = [
    {
      name: "Cliques para as lojas",
      data: monthlyStoreClicks.map((point) => point.clicks),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Cliques para as lojas ao longo do ano
      </h3>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <ReactApexChart options={options} series={series} type="bar" height={220} />
        </div>
      </div>
    </div>
  );
};
