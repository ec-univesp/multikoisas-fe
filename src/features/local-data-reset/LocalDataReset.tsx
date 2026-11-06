'use client';

import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import { useModal } from '@/hooks/useModal';
import { resetDatabase } from '@/shared/local-api/persistence';

export const LocalDataReset = () => {
  const resetModal = useModal();
  const [isResetting, setIsResetting] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const closeUnlessResetting = () => {
    if (!isResetting) resetModal.closeModal();
  };

  const restoreSampleData = async () => {
    setIsResetting(true);
    setHasFailed(false);
    try {
      await resetDatabase();
      window.location.reload();
    } catch {
      setHasFailed(true);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <p className="mb-4 text-sm text-gray-500">
        Os dados do site ficam guardados neste navegador. Restaure para voltar aos produtos de exemplo.
      </p>
      <Button size="sm" variant="outline" onClick={resetModal.openModal}>
        Restaurar dados iniciais
      </Button>
      <Modal isOpen={resetModal.isOpen} onClose={closeUnlessResetting} className="m-4 max-w-[480px]">
        <div className="relative w-full max-w-[480px] rounded-3xl bg-white p-6">
          <h4 className="mb-2 text-xl font-semibold text-gray-800">Restaurar dados iniciais?</h4>
          <p className="mb-6 text-sm text-gray-500">
            Isso apaga tudo que foi cadastrado neste navegador e volta para os dados de exemplo.
          </p>
          {hasFailed && (
            <p role="alert" className="mb-4 text-sm text-error-500">
              Não foi possível restaurar os dados. Recarregue a página e tente de novo.
            </p>
          )}
          <div className="flex items-center justify-end gap-3">
            <Button size="sm" variant="outline" onClick={resetModal.closeModal} disabled={isResetting}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={restoreSampleData}
              disabled={isResetting}
              className="bg-error-500 hover:bg-error-600"
            >
              {isResetting ? 'Restaurando...' : 'Restaurar'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
