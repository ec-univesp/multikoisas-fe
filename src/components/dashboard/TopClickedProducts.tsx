import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTopClickedProducts } from "@/data/dashboard-metrics";

export const TopClickedProducts = () => {
  const rankedProducts = getTopClickedProducts();

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Produtos que mais levaram gente para a loja
      </h3>
      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-200">
            <TableRow>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500"
              >
                Produto
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500"
              >
                Categoria
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-end text-theme-xs font-medium text-gray-500"
              >
                Cliques
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {rankedProducts.map((product) => (
              <TableRow key={product.name}>
                <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-gray-800">
                  {product.name}
                </TableCell>
                <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500">
                  {product.category}
                </TableCell>
                <TableCell className="px-4 py-3 text-end text-theme-sm font-medium text-gray-800">
                  {product.clicks.toLocaleString("pt-BR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
