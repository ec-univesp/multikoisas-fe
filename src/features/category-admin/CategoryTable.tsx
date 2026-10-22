'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PencilIcon, TrashBinIcon } from '@/icons';
import type { Category } from '@/entities/product';

type CategoryTableProps = {
  categories: readonly Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export const CategoryTable = ({ categories, onEdit, onDelete }: CategoryTableProps) => {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-theme-sm text-gray-500">Nenhuma categoria cadastrada.</p>
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
                Categoria
              </TableCell>
              <TableCell isHeader className="px-5 py-3">
                <span className="sr-only">Ações</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800">
                  {category.name}
                </TableCell>
                <TableCell className="px-5 py-4 text-end">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(category)}
                      aria-label={`Editar ${category.name}`}
                      title="Renomear categoria"
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-500"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(category)}
                      aria-label={`Apagar ${category.name}`}
                      title="Apagar categoria"
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
