'use client';

import { useState } from 'react';
import InputField from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { isHttpsUrl } from '@/entities/social-network';
import { STORE_SETTINGS, type StoreSettings } from '@/entities/store-settings';

type ValidatedField = 'googleReviewsUrl' | 'googleRating' | 'googleReviewCount';

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

const errorOf = (field: ValidatedField, value: string): string | null => {
  if (value === '') return null;
  const validation = VALIDATIONS[field];
  return validation.isValid(value) ? null : validation.message;
};

const ValidatedInput = ({
  field,
  label,
  type,
  defaultValue,
  min,
  max,
  step,
}: {
  field: ValidatedField;
  label: string;
  type: 'url' | 'number';
  defaultValue: string | number | null;
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
        defaultValue={defaultValue ?? ''}
        min={min}
        max={max}
        step={step}
        error={error !== null}
        aria-invalid={error !== null}
        aria-describedby={error ? errorId : undefined}
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

export const StoreSettingsForm = ({ settings = STORE_SETTINGS }: { settings?: StoreSettings }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="store-settings-address">Endereço</Label>
      <InputField id="store-settings-address" defaultValue={settings.address ?? ''} className="text-base" />
    </div>
    <ValidatedInput
      field="googleReviewsUrl"
      label="Link das avaliações no Google"
      type="url"
      defaultValue={settings.googleReviewsUrl}
    />
    <div className="grid gap-4 sm:grid-cols-2">
      <ValidatedInput
        field="googleRating"
        label="Nota no Google"
        type="number"
        defaultValue={settings.googleRating}
        min="0"
        max="5"
        step={0.1}
      />
      <ValidatedInput
        field="googleReviewCount"
        label="Quantidade de avaliações"
        type="number"
        defaultValue={settings.googleReviewCount}
        min="0"
        step={1}
      />
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled aria-describedby="store-settings-save-unavailable">
        Salvar dados
      </Button>
      <p id="store-settings-save-unavailable" className="text-sm text-gray-500">
        Salvar os dados da loja ainda não está disponível: a API não guarda as configurações da loja.
      </p>
    </div>
  </div>
);
