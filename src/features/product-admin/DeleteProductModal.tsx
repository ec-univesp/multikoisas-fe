'use client';

import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import type { Product } from '@/entities/product';

type DeleteProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: () => void;
};

export const DeleteProductModal = ({
  isOpen,
  onClose,
  product,
  onConfirm,
}: DeleteProductModalProps) => {
  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-[480px]">
      <div className="relative w-full max-w-[480px] rounded-3xl bg-white p-6">
        <h4 className="mb-2 text-xl font-semibold text-gray-800">Apagar produto</h4>
        <p className="mb-6 text-sm text-gray-500">
          Tem certeza que deseja apagar <span className="font-medium text-gray-700">{product.name}</span>?
          Essa ação não pode ser desfeita e o produto sairá da vitrine.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className="bg-error-500 hover:bg-error-600"
          >
            Apagar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
