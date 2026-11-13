'use client';

import { useState, type FormEvent } from 'react';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import {
  saveShowcaseAppearance,
  STORE_SETTINGS,
  useStoreSettings,
  type ShowcaseAppearance,
  type ShowcaseColumns,
} from '@/entities/store-settings';
import { isReadableAccentColor } from '@/shared/lib/accentColor';

type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

const SHOWCASE_COLUMNS: readonly ShowcaseColumns[] = [2, 3, 4];

const COLUMN_OPTIONS = SHOWCASE_COLUMNS.map((columns) => ({ value: String(columns), label: `${columns} colunas` }));

const ShowcaseAppearanceFields = ({ initialAppearance }: { initialAppearance: ShowcaseAppearance }) => {
  const [showcaseColumns, setShowcaseColumns] = useState(initialAppearance.showcaseColumns);
  const [accentColor, setAccentColor] = useState(initialAppearance.accentColor);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const isSaving = saveState === 'saving';
  const isColorTooDark = !isReadableAccentColor(accentColor);

  const markChanged = () => setSaveState((currentState) => (currentState === 'saving' ? currentState : 'idle'));

  const changeColumns = (value: string) => {
    setShowcaseColumns(
      (currentColumns) => SHOWCASE_COLUMNS.find((columns) => String(columns) === value) ?? currentColumns,
    );
    markChanged();
  };

  const changeAccentColor = (value: string) => {
    setAccentColor(value);
    markChanged();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState('saving');
    try {
      await saveShowcaseAppearance({ showcaseColumns, accentColor });
      setSaveState('saved');
    } catch {
      setSaveState('failed');
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="showcase-appearance-columns">Colunas na vitrine (computador)</Label>
        <Select
          id="showcase-appearance-columns"
          options={COLUMN_OPTIONS}
          placeholder="Escolha as colunas"
          defaultValue={String(initialAppearance.showcaseColumns)}
          onChange={changeColumns}
          disabled={isSaving}
          className="text-base"
        />
      </div>
      <div>
        <Label htmlFor="showcase-appearance-accent-color">Cor de destaque</Label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="showcase-appearance-accent-color"
            type="color"
            value={accentColor}
            onChange={(event) => changeAccentColor(event.target.value)}
            disabled={isSaving}
            aria-invalid={isColorTooDark}
            aria-describedby={isColorTooDark ? 'showcase-appearance-accent-color-error' : undefined}
            className="h-11 w-20 cursor-pointer rounded-lg border border-gray-300 bg-white p-1 text-base"
          />
          <Button variant="outline" disabled={isSaving} onClick={() => changeAccentColor(STORE_SETTINGS.accentColor)}>
            Voltar à cor padrão
          </Button>
        </div>
        {isColorTooDark && (
          <p id="showcase-appearance-accent-color-error" role="alert" className="mt-1.5 text-xs text-error-500">
            Cor muito escura: o texto da vitrine fica ilegível. Escolha uma cor mais clara.
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSaving || isColorTooDark}>
          Salvar aparência
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

export const ShowcaseAppearanceForm = ({ settings }: { settings?: ShowcaseAppearance }) => {
  const savedSettings = useStoreSettings();
  if (settings) return <ShowcaseAppearanceFields initialAppearance={settings} />;
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
          Não foi possível carregar a aparência da vitrine.
        </p>
        <Button variant="outline" onClick={savedSettings.retry}>
          Tentar de novo
        </Button>
      </div>
    );
  }
  return <ShowcaseAppearanceFields initialAppearance={savedSettings.settings} />;
};
