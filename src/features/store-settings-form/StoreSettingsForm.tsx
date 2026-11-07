'use client';

import { useState, type FormEvent } from 'react';
import InputField from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { isHttpsUrl } from '@/entities/social-network';
import { saveStoreSettings, useStoreSettings, type StoreSettingsValues } from '@/entities/store-settings';

type ValidatedField = 'googleReviewsUrl' | 'googleRating' | 'googleReviewCount';
type FormValues = Record<'address' | ValidatedField, string>;
type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

const RATING_PATTERN = /^\d(\.\d)?$/;
const WHOLE_NUMBER_PATTERN = /^\d+$/;

const VALIDATIONS: Record<ValidatedField, { isValid: (value: string) => boolean; message: string }> = {
  googleReviewsUrl: { isValid: isHttpsUrl, message: 'Use um link que comece com https://.' },
  googleRating: {
    isValid: (value) => RATING_PATTERN.test(value) && Number(value) <= 5,
    message: 'A nota vai de 0 a 5, com até uma casa decimal.',
  },
  googleReviewCount: {
    isValid: (value) => WHOLE_NUMBER_PATTERN.test(value),
    message: 'Use um número inteiro a partir de 0.',
  },
};

const VALIDATED_FIELDS: ValidatedField[] = ['googleReviewsUrl', 'googleRating', 'googleReviewCount'];

const errorOf = (field: ValidatedField, value: string): string | null => {
  if (value === '') return null;
  const validation = VALIDATIONS[field];
  return validation.isValid(value) ? null : validation.message;
};

const toFormValues = (settings: StoreSettingsValues): FormValues => ({
  address: settings.address ?? '',
  googleReviewsUrl: settings.googleReviewsUrl ?? '',
  googleRating: settings.googleRating === null ? '' : String(settings.googleRating),
  googleReviewCount: settings.googleReviewCount === null ? '' : String(settings.googleReviewCount),
});

const toNumberOrNull = (value: string) => (value.trim() === '' ? null : Number(value));

const toSettingsValues = (values: FormValues): StoreSettingsValues => ({
  address: values.address.trim() || null,
  googleReviewsUrl: values.googleReviewsUrl.trim() || null,
  googleRating: toNumberOrNull(values.googleRating),
  googleReviewCount: toNumberOrNull(values.googleReviewCount),
});

const ValidatedInput = ({
  field,
  label,
  type,
  defaultValue,
  onChange,
  min,
  max,
  step,
}: {
  field: ValidatedField;
  label: string;
  type: 'url' | 'number';
  defaultValue: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  step?: number;
}) => {
  const [error, setError] = useState<string | null>(null);
  const inputId = `store-settings-${field}`;
  const errorId = `${inputId}-error`;

  return (
    <div>
      <Label htmlFor={inputId}>{label}</Label>
      <InputField
        id={inputId}
        type={type}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        error={error !== null}
        aria-invalid={error !== null}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => setError(errorOf(field, event.target.value.trim()))}
        className="text-base"
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-error-500">
          {error}
        </p>
      )}
    </div>
  );
};

const StoreSettingsFields = ({ initialSettings }: { initialSettings: StoreSettingsValues }) => {
  const [initialValues] = useState(() => toFormValues(initialSettings));
  const [values, setValues] = useState(initialValues);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const hasInvalidField = VALIDATED_FIELDS.some((field) => errorOf(field, values[field].trim()) !== null);

  const changeValue = (field: keyof FormValues) => (value: string) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setSaveState((currentState) => (currentState === 'saving' ? currentState : 'idle'));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveState('saving');
    try {
      await saveStoreSettings(toSettingsValues(values));
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
          defaultValue={initialValues.address}
          onChange={(event) => changeValue('address')(event.target.value)}
          className="text-base"
        />
      </div>
      <ValidatedInput
        field="googleReviewsUrl"
        label="Link das avaliações no Google"
        type="url"
        defaultValue={initialValues.googleReviewsUrl}
        onChange={changeValue('googleReviewsUrl')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ValidatedInput
          field="googleRating"
          label="Nota no Google"
          type="number"
          defaultValue={initialValues.googleRating}
          onChange={changeValue('googleRating')}
          min="0"
          max="5"
          step={0.1}
        />
        <ValidatedInput
          field="googleReviewCount"
          label="Quantidade de avaliações"
          type="number"
          defaultValue={initialValues.googleReviewCount}
          onChange={changeValue('googleReviewCount')}
          min="0"
          step={1}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saveState === 'saving' || hasInvalidField}>
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
