'use client';

import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import { useModal } from '@/hooks/useModal';
import { PlusIcon } from '@/icons';
import type { Category, Product } from '@/entities/product';
import { ProductFormModal } from './ProductFormModal';
import { DeleteProductModal } from './DeleteProductModal';
import { ProductTable } from './ProductTable';
import { CategoryLinkError, createProduct, deleteProduct, updateProduct } from './productApi';
import type { ProductFormValues } from './types';

type ProductAdminPanelProps = {
  initialProducts: readonly Product[];
  categories: readonly Category[];
};

export const ProductAdminPanel = ({ initialProducts, categories }: ProductAdminPanelProps) => {
  const [products, setProducts] = useState<Product[]>([...initialProducts]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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
    setFeedbackMessage(null);
    deleteModal.openModal();
  };

  const showSavedProduct = (savedProduct: Product) =>
    setProducts((currentProducts) =>
      currentProducts.some((candidate) => candidate.id === savedProduct.id)
        ? currentProducts.map((candidate) =>
            candidate.id === savedProduct.id ? savedProduct : candidate,
          )
        : [...currentProducts, savedProduct],
    );

  const saveProduct = async (values: ProductFormValues) => {
    setFeedbackMessage(null);
    try {
      showSavedProduct(
        editingProduct
          ? await updateProduct(editingProduct, values, categories)
          : await createProduct(values, categories),
      );
    } catch (error) {
      if (!(error instanceof CategoryLinkError)) throw error;
      showSavedProduct(error.product);
      setFeedbackMessage('Produto salvo, mas sem categoria. Edite o produto para escolher de novo.');
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProduct || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deletingProduct);
      setProducts((currentProducts) =>
        currentProducts.filter((candidate) => candidate.id !== deletingProduct.id),
      );
      setDeletingProduct(null);
    } catch {
      setFeedbackMessage('Não foi possível apagar o produto. Recarregue a página e tente de novo.');
    } finally {
      setIsDeleting(false);
      deleteModal.closeModal();
    }
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

      {feedbackMessage && (
        <p role="alert" className="mb-4 text-sm text-error-500">
          {feedbackMessage}
        </p>
      )}

      <ProductTable products={products} onEdit={openEditModal} onDelete={openDeleteModal} />

      {formModal.isOpen && (
        <ProductFormModal
          isOpen
          onClose={formModal.closeModal}
          existingProduct={editingProduct ?? undefined}
          categories={categories}
          onSave={saveProduct}
        />
      )}

      <DeleteProductModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        product={deletingProduct}
        onConfirm={confirmDeleteProduct}
        isDeleting={isDeleting}
      />
    </div>
  );
};
