'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import type { SalesChannel } from '@/entities/sales-channel';

const collapseSpaces = (name: string): string => name.trim().replace(/\s+/g, ' ');

export const normalizeSalesChannelName = (name: string): string =>
  collapseSpaces(name)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR');

const validateSalesChannelName = (
  name: string,
  salesChannels: readonly SalesChannel[],
): string | null => {
  if (!name.trim()) return 'Informe o nome do canal.';
  const isRepeated = salesChannels.some(
    (salesChannel) => normalizeSalesChannelName(salesChannel.name) === normalizeSalesChannelName(name),
  );
  return isRepeated ? 'Já existe um canal com esse nome.' : null;
};

type SalesChannelFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  salesChannels: readonly SalesChannel[];
  onSave: (name: string) => Promise<void>;
};

export const SalesChannelFormModal = ({
  isOpen,
  onClose,
  salesChannels,
  onSave,
}: SalesChannelFormModalProps) => {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const closeUnlessSaving = () => {
    if (!isSaving) onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateSalesChannelName(name, salesChannels);
    setNameError(validationError);
    if (validationError) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(collapseSpaces(name));
      onClose();
    } catch {
      setSaveError('Não foi possível salvar o canal. Tente de novo.');
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeUnlessSaving} className="m-4 max-w-[480px]">
      <div className="relative w-full max-w-[480px] rounded-3xl bg-white p-4 lg:p-8">
        <h4 className="mb-1 text-2xl font-semibold text-gray-800">Novo canal</h4>
        <p className="mb-6 text-sm text-gray-500">Loja ou rede onde os produtos são vendidos.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-1">
            <Label htmlFor="sales-channel-name">Nome do canal</Label>
            <Input
              id="sales-channel-name"
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
              {isSaving ? 'Salvando...' : 'Salvar canal'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
