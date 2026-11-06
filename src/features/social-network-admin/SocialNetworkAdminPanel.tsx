'use client';

import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import { useModal } from '@/hooks/useModal';
import { PlusIcon } from '@/icons';
import type { SocialNetwork } from '@/entities/social-network';
import { SocialNetworkFormModal } from './SocialNetworkFormModal';
import { DeleteSocialNetworkModal } from './DeleteSocialNetworkModal';
import { SocialNetworkTable } from './SocialNetworkTable';
import {
  type SocialNetworkValues,
  createSocialNetwork,
  deleteSocialNetwork,
  fetchAllSocialNetworks,
  updateSocialNetwork,
} from './socialNetworkApi';

type SocialNetworkAdminPanelProps = {
  initialSocialNetworks: readonly SocialNetwork[];
};

export const SocialNetworkAdminPanel = ({ initialSocialNetworks }: SocialNetworkAdminPanelProps) => {
  const [socialNetworks, setSocialNetworks] = useState<SocialNetwork[]>([...initialSocialNetworks]);
  const [editingSocialNetwork, setEditingSocialNetwork] = useState<SocialNetwork | null>(null);
  const [deletingSocialNetwork, setDeletingSocialNetwork] = useState<SocialNetwork | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const formModal = useModal();
  const deleteModal = useModal();

  const openFormModal = (socialNetwork: SocialNetwork | null) => {
    setEditingSocialNetwork(socialNetwork);
    setFeedbackMessage(null);
    formModal.openModal();
  };

  const openDeleteModal = (socialNetwork: SocialNetwork) => {
    setDeletingSocialNetwork(socialNetwork);
    setFeedbackMessage(null);
    deleteModal.openModal();
  };

  const addSocialNetwork = async (values: SocialNetworkValues) => {
    await createSocialNetwork(values);
    try {
      setSocialNetworks(await fetchAllSocialNetworks());
    } catch {
      setFeedbackMessage('A rede foi salva, mas a lista não atualizou. Recarregue a página.');
    }
  };

  const saveSocialNetwork = async (values: SocialNetworkValues) => {
    if (!editingSocialNetwork) return addSocialNetwork(values);
    const updatedSocialNetwork = await updateSocialNetwork(editingSocialNetwork, values);
    setSocialNetworks((currentSocialNetworks) =>
      currentSocialNetworks.map((candidate) =>
        candidate.id === editingSocialNetwork.id ? updatedSocialNetwork : candidate,
      ),
    );
  };

  const confirmDeleteSocialNetwork = async () => {
    if (!deletingSocialNetwork || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteSocialNetwork(deletingSocialNetwork);
      setSocialNetworks((currentSocialNetworks) =>
        currentSocialNetworks.filter((candidate) => candidate.id !== deletingSocialNetwork.id),
      );
      setDeletingSocialNetwork(null);
    } catch {
      setFeedbackMessage('Não foi possível apagar a rede. Recarregue a página e tente de novo.');
    } finally {
      setIsDeleting(false);
      deleteModal.closeModal();
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <p className="text-theme-sm text-gray-500">
          {socialNetworks.length}{' '}
          {socialNetworks.length === 1 ? 'rede cadastrada' : 'redes cadastradas'}
        </p>
        <Button size="sm" startIcon={<PlusIcon />} onClick={() => openFormModal(null)}>
          Nova rede
        </Button>
      </div>

      {feedbackMessage && (
        <p role="alert" className="mb-4 text-sm text-error-500">
          {feedbackMessage}
        </p>
      )}

      <SocialNetworkTable
        socialNetworks={socialNetworks}
        onEdit={openFormModal}
        onDelete={openDeleteModal}
      />

      {formModal.isOpen && (
        <SocialNetworkFormModal
          onClose={formModal.closeModal}
          socialNetworks={socialNetworks}
          editingSocialNetwork={editingSocialNetwork}
          onSave={saveSocialNetwork}
        />
      )}

      <DeleteSocialNetworkModal
        isOpen={deleteModal.isOpen}
        onClose={isDeleting ? () => undefined : deleteModal.closeModal}
        socialNetwork={deletingSocialNetwork}
        onConfirm={confirmDeleteSocialNetwork}
        isDeleting={isDeleting}
      />
    </div>
  );
};
