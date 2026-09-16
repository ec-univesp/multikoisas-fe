import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProducts, STORE_LABELS } from "@/entities/product";

export const metadata: Metadata = {
  title: "Produtos | MultiKoisas",
  description: "Produtos publicados na vitrine da MultiKoisas.",
};

const ProdutosPage = () => {
  const products = getProducts();

  return (
    <div>
      <PageBreadcrumb pageTitle="Produtos" />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-200 dark:border-gray-800">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Produto
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Categoria
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Lojas
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {products.map((product) => (
                <TableRow key={product.slug}>
                  <TableCell className="px-5 py-4 text-start">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-gray-800">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/produto/${product.slug}`}
                          className="block text-theme-sm font-medium text-gray-800 hover:text-brand-blue dark:text-white/90"
                        >
                          {product.name}
                        </Link>
                        <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                          {product.shortDescription}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    {product.category}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start">
                    <div className="flex flex-wrap gap-1.5">
                      {product.storeLinks.map((storeLink) => (
                        <Badge key={storeLink.store} size="sm" color="light">
                          {STORE_LABELS[storeLink.store]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ProdutosPage;
