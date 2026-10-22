'use client';

import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import { useModal } from '@/hooks/useModal';
import { PlusIcon } from '@/icons';
import type { Category, Product } from '@/entities/product';
import { ProductFormModal } from './ProductFormModal';
import { DeleteProductModal } from './DeleteProductModal';
import { ProductTable } from './ProductTable';
import { createProduct, deleteProduct, updateProduct } from './productApi';
import type { ProductFormValues } from './types';

type ProductAdminPanelProps = {
  initialProducts: readonly Product[];
  categories: readonly Category[];
};

export const ProductAdminPanel = ({ initialProducts, categories }: ProductAdminPanelProps) => {
  const [products, setProducts] = useState<Product[]>([...initialProducts]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    setDeleteError(null);
    deleteModal.openModal();
  };

  const saveProduct = async (values: ProductFormValues) => {
    if (!editingProduct) {
      const createdProduct = await createProduct(values, categories);
      setProducts((currentProducts) => [...currentProducts, createdProduct]);
      return;
    }
    const updatedProduct = await updateProduct(editingProduct, values, categories);
    setProducts((currentProducts) =>
      currentProducts.map((candidate) =>
        candidate.id === updatedProduct.id ? updatedProduct : candidate,
      ),
    );
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct);
    } catch {
      setDeleteError('Não foi possível apagar o produto. Tente de novo.');
      deleteModal.closeModal();
      return;
    }
    setProducts((currentProducts) =>
      currentProducts.filter((candidate) => candidate.id !== deletingProduct.id),
    );
    deleteModal.closeModal();
    setDeletingProduct(null);
  };

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

      {deleteError && (
        <p role="alert" className="mb-4 text-sm text-error-500">
          {deleteError}
        </p>
      )}

      <ProductTable products={products} onEdit={openEditModal} onDelete={openDeleteModal} />

      <ProductFormModal
        key={editingProduct?.id ?? 'novo-produto'}
        isOpen={formModal.isOpen}
        onClose={formModal.closeModal}
        existingProduct={editingProduct ?? undefined}
        categories={categories}
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
