'use client';

import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import { useModal } from '@/hooks/useModal';
import { PlusIcon } from '@/icons';
import type { Category } from '@/entities/product';
import { CategoryFormModal } from './CategoryFormModal';
import { DeleteCategoryModal } from './DeleteCategoryModal';
import { CategoryTable } from './CategoryTable';
import {
  CategoryInUseError,
  CategoryNotFoundError,
  createCategory,
  deleteCategory,
  renameCategory,
} from './categoryApi';

type CategoryAdminPanelProps = {
  initialCategories: readonly Category[];
};

export const CategoryAdminPanel = ({ initialCategories }: CategoryAdminPanelProps) => {
  const [categories, setCategories] = useState<Category[]>([...initialCategories]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const formModal = useModal();
  const deleteModal = useModal();

  const openCreateModal = () => {
    setEditingCategory(null);
    formModal.openModal();
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    formModal.openModal();
  };

  const openDeleteModal = (category: Category) => {
    setDeletingCategory(category);
    setFeedbackMessage(null);
    deleteModal.openModal();
  };

  const saveCategory = async (name: string) => {
    setFeedbackMessage(null);
    if (!editingCategory) {
      const createdCategory = await createCategory(name);
      setCategories((currentCategories) => [...currentCategories, createdCategory]);
      return;
    }
    try {
      const renamedCategory = await renameCategory(editingCategory, name);
      setCategories((currentCategories) =>
        currentCategories.map((candidate) =>
          candidate.id === renamedCategory.id ? renamedCategory : candidate,
        ),
      );
    } catch (error) {
      if (!(error instanceof CategoryNotFoundError)) throw error;
      setCategories((currentCategories) =>
        currentCategories.filter((candidate) => candidate.id !== editingCategory.id),
      );
      setFeedbackMessage('Essa categoria já tinha sido apagada. A lista foi atualizada.');
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteCategory(deletingCategory);
      setCategories((currentCategories) =>
        currentCategories.filter((candidate) => candidate.id !== deletingCategory.id),
      );
      setDeletingCategory(null);
    } catch (error) {
      setFeedbackMessage(
        error instanceof CategoryInUseError
          ? 'Esta categoria tem produtos. Troque a categoria desses produtos antes de apagar.'
          : 'Não foi possível apagar a categoria. Recarregue a página e tente de novo.',
      );
    } finally {
      setIsDeleting(false);
      deleteModal.closeModal();
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <p className="text-theme-sm text-gray-500">
          {categories.length}{' '}
          {categories.length === 1 ? 'categoria cadastrada' : 'categorias cadastradas'}
        </p>
        <Button size="sm" startIcon={<PlusIcon />} onClick={openCreateModal}>
          Nova categoria
        </Button>
      </div>

      {feedbackMessage && (
        <p role="alert" className="mb-4 text-sm text-error-500">
          {feedbackMessage}
        </p>
      )}

      <CategoryTable categories={categories} onEdit={openEditModal} onDelete={openDeleteModal} />

      {formModal.isOpen && (
        <CategoryFormModal
          isOpen
          onClose={formModal.closeModal}
          existingCategory={editingCategory ?? undefined}
          categories={categories}
          onSave={saveCategory}
        />
      )}

      <DeleteCategoryModal
        isOpen={deleteModal.isOpen}
        onClose={isDeleting ? () => undefined : deleteModal.closeModal}
        category={deletingCategory}
        onConfirm={confirmDeleteCategory}
        isDeleting={isDeleting}
      />
    </div>
  );
};
