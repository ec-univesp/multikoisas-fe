'use client';

import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import type { Category } from '@/entities/product';

type DeleteCategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onConfirm: () => void;
  isDeleting: boolean;
};

export const DeleteCategoryModal = ({
  isOpen,
  onClose,
  category,
  onConfirm,
  isDeleting,
}: DeleteCategoryModalProps) => {
  if (!category) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-[480px]">
      <div className="relative w-full max-w-[480px] rounded-3xl bg-white p-6">
        <h4 className="mb-2 text-xl font-semibold text-gray-800">Apagar categoria</h4>
        <p className="mb-6 text-sm text-gray-500">
          Tem certeza que deseja apagar <span className="font-medium text-gray-700">{category.name}</span>?
          Essa ação não pode ser desfeita.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-error-500 hover:bg-error-600"
          >
            {isDeleting ? 'Apagando...' : 'Apagar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
