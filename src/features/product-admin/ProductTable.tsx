'use client';

import Image from 'next/image';
import Link from 'next/link';
import Badge from '@/components/ui/badge/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PencilIcon, TrashBinIcon } from '@/icons';
import { STORE_PRESENTATION } from '@/entities/product';
import type { Product } from '@/entities/product';

type ProductTableProps = {
  products: readonly Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export const ProductTable = ({ products, onEdit, onDelete }: ProductTableProps) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-theme-sm text-gray-500">Nenhum produto cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-200">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500"
              >
                Produto
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500"
              >
                Categoria
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500"
              >
                Lojas
              </TableCell>
              <TableCell isHeader className="px-5 py-3">
                <span className="sr-only">Ações</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {products.map((product) => (
              <TableRow key={product.slug}>
                <TableCell className="px-5 py-4 text-start">
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
                    <div>
                      <Link
                        href={`/produto/${product.slug}`}
                        className="block text-theme-sm font-medium text-gray-800 hover:text-brand-500"
                      >
                        {product.name}
                      </Link>
                      <span className="block text-theme-xs text-gray-500">
                        {product.shortDescription}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500">
                  {product.category}
                </TableCell>
                <TableCell className="px-5 py-4 text-start">
                  <div className="flex flex-wrap gap-1.5">
                    {product.storeLinks.map((storeLink) => (
                      <Badge key={storeLink.store} size="sm" color="light">
                        {STORE_PRESENTATION[storeLink.store].name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-end">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      aria-label={`Editar ${product.name}`}
                      title="Editar produto"
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product)}
                      aria-label={`Apagar ${product.name}`}
                      title="Apagar produto"
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-error-500"
                    >
                      <TrashBinIcon />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
