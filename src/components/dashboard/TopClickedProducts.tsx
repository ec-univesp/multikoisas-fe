import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProductBySlug } from "@/entities/product";
import { getTopClickedProducts } from "@/data/dashboard-metrics";

export const TopClickedProducts = () => {
  const rankedProducts = getTopClickedProducts()
    .map((entry) => {
      const product = getProductBySlug(entry.slug);
      return product ? { product, clicks: entry.clicks } : null;
    })
    .filter((entry) => entry !== null);

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
            {rankedProducts.map(({ product, clicks }) => (
              <TableRow key={product.slug}>
                <TableCell className="px-4 py-3 text-start">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <span className="text-theme-sm font-medium text-gray-800">
                      {product.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500">
                  {product.category}
                </TableCell>
                <TableCell className="px-4 py-3 text-end text-theme-sm font-medium text-gray-800">
                  {clicks.toLocaleString("pt-BR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
