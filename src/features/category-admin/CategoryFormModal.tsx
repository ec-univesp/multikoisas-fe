'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import type { Category } from '@/entities/product';

const collapseSpaces = (name: string): string => name.trim().replace(/\s+/g, ' ');

const normalizeName = (name: string): string =>
  collapseSpaces(name)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR');

const validateCategoryName = (
  name: string,
  otherCategories: readonly Category[],
): string | null => {
  if (!name.trim()) return 'Informe o nome da categoria.';
  const isRepeated = otherCategories.some(
    (category) => normalizeName(category.name) === normalizeName(name),
  );
  return isRepeated ? 'Já existe uma categoria com esse nome.' : null;
};

type CategoryFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  existingCategory?: Category;
  categories: readonly Category[];
  onSave: (name: string) => Promise<void>;
};

export const CategoryFormModal = ({
  isOpen,
  onClose,
  existingCategory,
  categories,
  onSave,
}: CategoryFormModalProps) => {
  const [name, setName] = useState(existingCategory?.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const closeUnlessSaving = () => {
    if (!isSaving) onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const otherCategories = categories.filter((category) => category.id !== existingCategory?.id);
    const validationError = validateCategoryName(name, otherCategories);
    setNameError(validationError);
    if (validationError) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(collapseSpaces(name));
      onClose();
    } catch {
      setSaveError('Não foi possível salvar a categoria. Tente de novo.');
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeUnlessSaving} className="m-4 max-w-[480px]">
      <div className="relative w-full max-w-[480px] rounded-3xl bg-white p-4 lg:p-8">
        <h4 className="mb-1 text-2xl font-semibold text-gray-800">
          {existingCategory ? 'Editar categoria' : 'Nova categoria'}
        </h4>
        <p className="mb-6 text-sm text-gray-500">O nome aparece no filtro da vitrine.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-1">
            <Label htmlFor="category-name">Nome da categoria</Label>
            <Input
              id="category-name"
              type="text"
              defaultValue={name}
              onChange={(event) => setName(event.target.value)}
              error={Boolean(nameError)}
              className="text-base"
            />
            {nameError && (
              <p role="alert" className="mt-1.5 text-xs text-error-500">
                {nameError}
              </p>
            )}
          </div>

          {saveError && (
            <p role="alert" className="mt-4 px-1 text-sm text-error-500">
              {saveError}
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 px-1">
            <Button size="sm" variant="outline" onClick={closeUnlessSaving} disabled={isSaving}>
              Cancelar
            </Button>
            <Button size="sm" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar categoria'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
