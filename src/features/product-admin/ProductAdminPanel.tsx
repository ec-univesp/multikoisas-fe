'use client';

import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import { useModal } from '@/hooks/useModal';
import { PlusIcon } from '@/icons';
import type { Product } from '@/entities/product';
import { ProductFormModal } from './ProductFormModal';
import { DeleteProductModal } from './DeleteProductModal';
import { ProductTable } from './ProductTable';

type ProductAdminPanelProps = {
  initialProducts: readonly Product[];
};

export const ProductAdminPanel = ({ initialProducts }: ProductAdminPanelProps) => {
  const [products, setProducts] = useState<Product[]>([...initialProducts]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const formModal = useModal();
  const deleteModal = useModal();

  const openCreateModal = () => {
    setEditingProduct(null);
    formModal.openModal();
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    formModal.openModal();
  };

  const openDeleteModal = (product: Product) => {
    setDeletingProduct(product);
    deleteModal.openModal();
  };

  const saveProduct = (product: Product) => {
    // TODO: API - persist product creation/update
    setProducts((currentProducts) => {
      const isEditingExistingProduct = currentProducts.some(
        (candidate) => candidate.slug === product.slug,
      );
      return isEditingExistingProduct
        ? currentProducts.map((candidate) =>
            candidate.slug === product.slug ? product : candidate,
          )
        : [...currentProducts, product];
    });
  };

  const confirmDeleteProduct = () => {
    if (!deletingProduct) return;
    // TODO: API - persist product deletion
    setProducts((currentProducts) =>
      currentProducts.filter((candidate) => candidate.slug !== deletingProduct.slug),
    );
    deleteModal.closeModal();
    setDeletingProduct(null);
  };

  const existingSlugsForForm = products
    .filter((product) => product.slug !== editingProduct?.slug)
    .map((product) => product.slug);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <p className="text-theme-sm text-gray-500">
          {products.length}{' '}
          {products.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
        </p>
        <Button size="sm" startIcon={<PlusIcon />} onClick={openCreateModal}>
          Novo produto
        </Button>
      </div>

      <ProductTable products={products} onEdit={openEditModal} onDelete={openDeleteModal} />

      <ProductFormModal
        key={editingProduct?.slug ?? 'novo-produto'}
        isOpen={formModal.isOpen}
        onClose={formModal.closeModal}
        existingProduct={editingProduct ?? undefined}
        existingSlugs={existingSlugsForForm}
        onSave={saveProduct}
      />

      <DeleteProductModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        product={deletingProduct}
        onConfirm={confirmDeleteProduct}
      />
    </div>
  );
};
