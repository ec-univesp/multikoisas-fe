import { topSearchedCategories } from "@/data/dashboard-metrics";

export const TopSearchedCategories = () => {
  const highestVolume = Math.max(...topSearchedCategories.map((category) => category.volume));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Categorias mais buscadas na vitrine
      </h3>
      <ul className="mt-4 space-y-3">
        {topSearchedCategories.map((category) => (
          <li key={category.term}>
            <div className="flex items-center justify-between text-theme-sm">
              <span className="text-gray-700">{category.term}</span>
              <span className="font-medium text-gray-800">
                {category.volume.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-brand-500"
                style={{ width: `${(category.volume / highestVolume) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
