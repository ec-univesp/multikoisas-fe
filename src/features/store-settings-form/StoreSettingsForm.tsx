'use client';

import { useState, type FormEvent } from 'react';
import InputField from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { saveStoreSettings, useStoreSettings, type StoreSettingsValues } from '@/entities/store-settings';

type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

const StoreSettingsFields = ({ initialSettings }: { initialSettings: StoreSettingsValues }) => {
  const [initialAddress] = useState(() => initialSettings.address ?? '');
  const [address, setAddress] = useState(initialAddress);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const changeAddress = (value: string) => {
    setAddress(value);
    setSaveState((currentState) => (currentState === 'saving' ? currentState : 'idle'));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState('saving');
    try {
      await saveStoreSettings({ address: address.trim() || null });
      setSaveState('saved');
    } catch {
      setSaveState('failed');
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="store-settings-address">Endereço</Label>
        <InputField
          id="store-settings-address"
          defaultValue={initialAddress}
          onChange={(event) => changeAddress(event.target.value)}
          className="text-base"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saveState === 'saving'}>
          Salvar dados
        </Button>
        {saveState === 'saved' && (
          <p role="status" className="text-sm text-success-700">
            Dados salvos.
          </p>
        )}
        {saveState === 'failed' && (
          <p role="alert" className="text-sm text-error-500">
            Não foi possível salvar os dados.
          </p>
        )}
      </div>
    </form>
  );
};

export const StoreSettingsForm = ({ settings }: { settings?: StoreSettingsValues }) => {
  const savedSettings = useStoreSettings();
  if (settings) return <StoreSettingsFields initialSettings={settings} />;
  if (savedSettings.status === 'loading') {
    return (
      <p role="status" className="text-sm text-gray-500">
        Carregando...
      </p>
    );
  }
  if (savedSettings.status === 'error') {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-error-500">
          Não foi possível carregar os dados da loja.
        </p>
        <Button variant="outline" onClick={savedSettings.retry}>
          Tentar de novo
        </Button>
      </div>
    );
  }
  return <StoreSettingsFields initialSettings={savedSettings.settings} />;
};
