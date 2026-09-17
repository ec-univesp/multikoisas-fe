import Badge from "@/components/ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, BoxCubeIcon, EyeIcon, GroupIcon } from "@/icons";
import {
  calculateChangePercentage,
  calculateClickRate,
  currentMonthClicks,
  monthlyVisitors,
  previousMonthClicks,
} from "@/data/dashboard-metrics";

type DashboardMetricsProps = {
  publishedProductsCount: number;
};

const formatPercentage = (value: number): string => `${value.toFixed(1)}%`;

const formatWholeNumber = (value: number): string => value.toLocaleString("pt-BR");

export const DashboardMetrics = ({ publishedProductsCount }: DashboardMetricsProps) => {
  const visitorsChange = calculateChangePercentage(
    monthlyVisitors.current,
    monthlyVisitors.previous,
  );
  const clicksChange = calculateChangePercentage(currentMonthClicks, previousMonthClicks);

  const currentClickRate = calculateClickRate(currentMonthClicks, monthlyVisitors.current);
  const previousClickRate = calculateClickRate(previousMonthClicks, monthlyVisitors.previous);
  const clickRateChange = calculateChangePercentage(currentClickRate, previousClickRate);

  const cards = [
    {
      label: "Produtos publicados",
      value: formatWholeNumber(publishedProductsCount),
      icon: <BoxCubeIcon className="text-gray-800 size-6" />,
      change: null,
    },
    {
      label: "Visitantes no mês",
      value: formatWholeNumber(monthlyVisitors.current),
      icon: <GroupIcon className="text-gray-800 size-6" />,
      change: visitorsChange,
    },
    {
      label: "Cliques para as lojas",
      value: formatWholeNumber(currentMonthClicks),
      icon: <EyeIcon className="text-gray-800 size-6" />,
      change: clicksChange,
    },
    {
      label: "Taxa de clique",
      value: formatPercentage(currentClickRate),
      icon: <ArrowUpIcon className="text-gray-800 size-6" />,
      change: clickRateChange,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
            {card.icon}
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500">{card.label}</span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm">{card.value}</h4>
            </div>
            {card.change && (
              <Badge color={card.change.trend === "up" ? "success" : "error"}>
                {card.change.trend === "up" ? (
                  <ArrowUpIcon />
                ) : (
                  <ArrowDownIcon className="text-error-500" />
                )}
                {formatPercentage(card.change.percentage)}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
