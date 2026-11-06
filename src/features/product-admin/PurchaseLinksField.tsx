import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import { isStoreChannelName } from '@/entities/product';
import type { SalesChannel } from '@/entities/sales-channel';
import { PlusIcon, TrashBinIcon } from '@/icons';
import type { PurchaseLinkDraft } from './types';

const PURCHASE_LINKS_ERROR_ID = 'purchase-links-error';

type PurchaseLinksFieldProps = {
  purchaseLinks: readonly PurchaseLinkDraft[];
  salesChannels: readonly SalesChannel[];
  error?: string;
  invalidRowKeys: readonly number[];
  disabled: boolean;
  onAdd: () => void;
  onChange: (key: number, changes: Partial<PurchaseLinkDraft>) => void;
  onRemove: (key: number) => void;
};

export const PurchaseLinksField = ({
  purchaseLinks,
  salesChannels,
  error,
  invalidRowKeys,
  disabled,
  onAdd,
  onChange,
  onRemove,
}: PurchaseLinksFieldProps) => {
  const optionsFor = (purchaseLink: PurchaseLinkDraft) =>
    salesChannels
      .filter(
        (salesChannel) =>
          isStoreChannelName(salesChannel.name) || String(salesChannel.id) === purchaseLink.salesChannelId,
      )
      .map((salesChannel) => ({ value: String(salesChannel.id), label: salesChannel.name }));

  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-gray-700">Onde comprar</legend>
      <p className="mb-3 text-xs text-gray-500">Cada loja vira um botão de compra na vitrine.</p>

      <ul className="flex flex-col gap-3">
        {purchaseLinks.map((purchaseLink, index) => {
          const position = index + 1;
          const isInvalid = invalidRowKeys.includes(purchaseLink.key);
          return (
            <li key={purchaseLink.key} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="sm:w-48">
                <Label htmlFor={`purchase-link-store-${purchaseLink.key}`}>{`Loja ${position}`}</Label>
                <Select
                  id={`purchase-link-store-${purchaseLink.key}`}
                  placeholder="Escolha a loja"
                  options={optionsFor(purchaseLink)}
                  defaultValue={purchaseLink.salesChannelId}
                  onChange={(salesChannelId) => onChange(purchaseLink.key, { salesChannelId })}
                  disabled={disabled}
                  className="text-base"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`purchase-link-url-${purchaseLink.key}`}>{`Link da loja ${position}`}</Label>
                <Input
                  id={`purchase-link-url-${purchaseLink.key}`}
                  type="url"
                  placeholder="https://"
                  defaultValue={purchaseLink.url}
                  onChange={(event) => onChange(purchaseLink.key, { url: event.target.value })}
                  disabled={disabled}
                  error={isInvalid}
                  aria-invalid={isInvalid || undefined}
                  aria-describedby={isInvalid ? PURCHASE_LINKS_ERROR_ID : undefined}
                  className="text-base"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(purchaseLink.key)}
                disabled={disabled}
                aria-label={`Remover loja ${position}`}
                title="Remover loja"
                className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-lg border border-gray-300 text-gray-600 hover:text-error-500"
              >
                <TrashBinIcon />
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p id={PURCHASE_LINKS_ERROR_ID} role="alert" className="mt-1.5 text-xs text-error-500">
          {error}
        </p>
      )}

      {salesChannels.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          Não foi possível carregar as lojas. Recarregue a página para mexer nos links.
        </p>
      ) : (
        <Button
          size="sm"
          variant="outline"
          startIcon={<PlusIcon />}
          onClick={onAdd}
          disabled={disabled}
          className="mt-3"
        >
          Adicionar loja
        </Button>
      )}
    </fieldset>
  );
};
