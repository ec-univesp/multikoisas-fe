'use client';

import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import { useModal } from '@/hooks/useModal';
import { PlusIcon } from '@/icons';
import { fetchSalesChannels, type SalesChannel } from '@/entities/sales-channel';
import { SalesChannelFormModal } from './SalesChannelFormModal';
import { DeleteSalesChannelModal } from './DeleteSalesChannelModal';
import { SalesChannelTable } from './SalesChannelTable';
import { SalesChannelIdTakenError, createSalesChannel, deleteSalesChannel } from './salesChannelApi';

type SalesChannelAdminPanelProps = {
  initialSalesChannels: readonly SalesChannel[];
};

const nextSalesChannelId = (salesChannels: readonly SalesChannel[]): number =>
  Math.max(0, ...salesChannels.map((salesChannel) => salesChannel.id)) + 1;

export const SalesChannelAdminPanel = ({ initialSalesChannels }: SalesChannelAdminPanelProps) => {
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([...initialSalesChannels]);
  const [deletingSalesChannel, setDeletingSalesChannel] = useState<SalesChannel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const formModal = useModal();
  const deleteModal = useModal();

  const openDeleteModal = (salesChannel: SalesChannel) => {
    setDeletingSalesChannel(salesChannel);
    setFeedbackMessage(null);
    deleteModal.openModal();
  };

  const saveSalesChannel = async (name: string) => {
    setFeedbackMessage(null);
    try {
      const createdSalesChannel = await createSalesChannel({ id: nextSalesChannelId(salesChannels), name });
      setSalesChannels((currentSalesChannels) => [...currentSalesChannels, createdSalesChannel]);
    } catch (error) {
      if (!(error instanceof SalesChannelIdTakenError)) throw error;
      setSalesChannels(await fetchSalesChannels({ fresh: true, fromBrowser: true }));
      setFeedbackMessage('Outra pessoa criou um canal ao mesmo tempo. Tente de novo.');
    }
  };

  const confirmDeleteSalesChannel = async () => {
    if (!deletingSalesChannel || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteSalesChannel(deletingSalesChannel);
      setSalesChannels((currentSalesChannels) =>
        currentSalesChannels.filter((candidate) => candidate.id !== deletingSalesChannel.id),
      );
      setDeletingSalesChannel(null);
    } catch {
      setFeedbackMessage(
        'Não foi possível apagar o canal. Se ele tiver produtos vinculados, desvincule antes.',
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
          {salesChannels.length}{' '}
          {salesChannels.length === 1 ? 'canal cadastrado' : 'canais cadastrados'}
        </p>
        <Button size="sm" startIcon={<PlusIcon />} onClick={formModal.openModal}>
          Novo canal
        </Button>
      </div>

      {feedbackMessage && (
        <p role="alert" className="mb-4 text-sm text-error-500">
          {feedbackMessage}
        </p>
      )}

      <SalesChannelTable salesChannels={salesChannels} onDelete={openDeleteModal} />

      {formModal.isOpen && (
        <SalesChannelFormModal
          isOpen
          onClose={formModal.closeModal}
          salesChannels={salesChannels}
          onSave={saveSalesChannel}
        />
      )}

      <DeleteSalesChannelModal
        isOpen={deleteModal.isOpen}
        onClose={isDeleting ? () => undefined : deleteModal.closeModal}
        salesChannel={deletingSalesChannel}
        onConfirm={confirmDeleteSalesChannel}
        isDeleting={isDeleting}
      />
    </div>
  );
};
