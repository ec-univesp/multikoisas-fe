'use client';

import Badge from '@/components/ui/badge/Badge';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { PlusIcon, TrashBinIcon } from '@/icons';
import { STORE_PRESENTATION } from '@/entities/product';
import type { StoreSlug } from '@/entities/product';
import type { StoreLinkFormValue } from './types';

const storeOptions = (Object.keys(STORE_PRESENTATION) as StoreSlug[]).map((store) => ({
  value: store,
  label: STORE_PRESENTATION[store].name,
}));

export const createEmptyStoreLink = (): StoreLinkFormValue => ({
  id: crypto.randomUUID(),
  store: 'mercado-livre',
  url: '',
});

type StoreLinksFieldProps = {
  storeLinks: StoreLinkFormValue[];
  onChange: (storeLinks: StoreLinkFormValue[]) => void;
  generalError?: string;
  urlErrors?: Record<number, string>;
};

export const StoreLinksField = ({
  storeLinks,
  onChange,
  generalError,
  urlErrors,
}: StoreLinksFieldProps) => {
  const addStoreLink = () => onChange([...storeLinks, createEmptyStoreLink()]);

  const removeStoreLink = (index: number) =>
    onChange(storeLinks.filter((_, position) => position !== index));

  const updateStoreLink = (index: number, update: Partial<StoreLinkFormValue>) =>
    onChange(
      storeLinks.map((storeLink, position) =>
        position === index ? { ...storeLink, ...update } : storeLink,
      ),
    );

  const makeStoreLinkPrimary = (index: number) => {
    const target = storeLinks[index];
    const remaining = storeLinks.filter((_, position) => position !== index);
    onChange([target, ...remaining]);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="mb-0">Lojas onde o produto é vendido</Label>
        <Button size="sm" variant="outline" startIcon={<PlusIcon />} onClick={addStoreLink}>
          Adicionar loja
        </Button>
      </div>
      <p className="mt-1 text-theme-xs text-gray-500">
        A primeira loja da lista é a que aparece no botão de compra do card da vitrine.
      </p>

      {generalError && <p className="mt-2 text-sm text-error-500">{generalError}</p>}

      <div className="mt-3 flex flex-col gap-3">
        {storeLinks.map((storeLink, index) => (
          <div key={storeLink.id} className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-2">
              {index === 0 ? (
                <Badge size="sm" color="primary">
                  Loja principal
                </Badge>
              ) : (
                <button
                  type="button"
                  onClick={() => makeStoreLinkPrimary(index)}
                  className="text-theme-xs font-medium text-brand-500 hover:text-brand-600"
                >
                  Tornar principal
                </button>
              )}
              <button
                type="button"
                onClick={() => removeStoreLink(index)}
                aria-label={`Remover loja ${STORE_PRESENTATION[storeLink.store].name}`}
                title="Remover loja"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-error-500"
              >
                <TrashBinIcon />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <Label htmlFor={`store-link-store-${index}`}>Loja</Label>
                <Select
                  id={`store-link-store-${index}`}
                  options={storeOptions}
                  defaultValue={storeLink.store}
                  onChange={(value) => updateStoreLink(index, { store: value as StoreSlug })}
                  className="text-base"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor={`store-link-url-${index}`}>Endereço do produto na loja</Label>
                <Input
                  id={`store-link-url-${index}`}
                  type="text"
                  defaultValue={storeLink.url}
                  onChange={(event) => updateStoreLink(index, { url: event.target.value })}
                  error={Boolean(urlErrors?.[index])}
                  hint={urlErrors?.[index]}
                  className="text-base"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
