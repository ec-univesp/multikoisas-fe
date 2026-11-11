'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import { isHttpsUrl, isWhatsApp, withScheme, type SocialNetwork } from '@/entities/social-network';
import type { SocialNetworkValues } from './socialNetworkApi';

const NAME_TAKEN_MESSAGE = 'Já existe uma rede com esse nome.';

const collapseSpaces = (text: string): string => text.trim().replace(/\s+/g, ' ');

const normalizeName = (name: string): string =>
  collapseSpaces(name)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR');

// The name goes in the PUT and DELETE path; the Spring firewall refuses these characters and the names "." and "..".
const isUnsafeInPath = (name: string): boolean => /[/\\%;]/.test(name) || ['.', '..'].includes(collapseSpaces(name));

const nameErrorOf = (name: string, isRepeated: boolean): string | null => {
  if (!name.trim()) return 'Informe o nome da rede.';
  if (isUnsafeInPath(name)) return 'Use um nome sem / \\ % ; e diferente de "." ou "..".';
  return isRepeated ? NAME_TAKEN_MESSAGE : null;
};

const isWhatsAppName = (name: string): boolean => normalizeName(name).replace(/\s/g, '') === 'whatsapp';

const WHATSAPP_NUMBER_LINK = /^(?:https:\/\/)?wa\.me\/55(\d{10,11})$/;

// Area code without zero; mobile numbers start with 9, landlines with 2 to 8.
const BRAZILIAN_NUMBER = /^[1-9]{2}(?:9\d{8}|[2-8]\d{7})$/;

const whatsAppNumberOf = (text: string): string | null => {
  const digits = text.replace(/\D/g, '');
  const hasPlusSign = text.trim().startsWith('+');
  if (hasPlusSign && !digits.startsWith('55')) return null;
  const localDigits = hasPlusSign || /^55\d{10,11}$/.test(digits) ? digits.slice(2) : digits;
  return BRAZILIAN_NUMBER.test(localDigits) ? localDigits : null;
};

const isPhoneText = (text: string): boolean => /^[\d\s()+.-]*$/.test(text);

// The store owner types the number; a wa.me link saved before (like wa.me/message/...) still works.
const whatsAppLinkOf = (text: string): string | null => {
  const trimmedText = text.trim();
  if (isPhoneText(trimmedText)) {
    const number = whatsAppNumberOf(trimmedText);
    return number ? `https://wa.me/55${number}` : null;
  }
  const link = withScheme(trimmedText);
  return isHttpsUrl(link) && isWhatsApp({ id: 0, name: '', url: link }) ? link : null;
};

const initialUrlOf = (socialNetwork: SocialNetwork | null): string => {
  if (!socialNetwork) return '';
  const savedNumber = isWhatsAppName(socialNetwork.name) ? WHATSAPP_NUMBER_LINK.exec(socialNetwork.url)?.[1] : null;
  return savedNumber ?? socialNetwork.url;
};

const linkToSave = (name: string, url: string): string | null => {
  if (isWhatsAppName(name)) return whatsAppLinkOf(url);
  return isHttpsUrl(url.trim()) ? url.trim() : null;
};

type FieldErrors = { name: string | null; url: string | null };

const validate = ({ name, url }: SocialNetworkValues, otherSocialNetworks: readonly SocialNetwork[]): FieldErrors => {
  const isRepeated = otherSocialNetworks.some(
    (socialNetwork) => normalizeName(socialNetwork.name) === normalizeName(name),
  );
  const urlError = isWhatsAppName(name)
    ? 'Informe o número com DDD, como (11) 98765-4321.'
    : 'Informe um link completo, começando com https://.';
  return {
    name: nameErrorOf(name, isRepeated),
    url: linkToSave(name, url) ? null : urlError,
  };
};

type SocialNetworkFormModalProps = {
  onClose: () => void;
  socialNetworks: readonly SocialNetwork[];
  editingSocialNetwork: SocialNetwork | null;
  onSave: (values: SocialNetworkValues) => Promise<void>;
};

export const SocialNetworkFormModal = ({
  onClose,
  socialNetworks,
  editingSocialNetwork,
  onSave,
}: SocialNetworkFormModalProps) => {
  const [name, setName] = useState(editingSocialNetwork?.name ?? '');
  const [url, setUrl] = useState(initialUrlOf(editingSocialNetwork));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({ name: null, url: null });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const closeUnlessSaving = () => {
    if (!isSaving) onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const otherSocialNetworks = socialNetworks.filter((socialNetwork) => socialNetwork !== editingSocialNetwork);
    const validationErrors = editingSocialNetwork
      ? { ...validate({ name, url }, otherSocialNetworks), name: null }
      : validate({ name, url }, otherSocialNetworks);
    setFieldErrors(validationErrors);
    const link = linkToSave(name, url);
    if (validationErrors.name || !link) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave({ name: editingSocialNetwork?.name ?? collapseSpaces(name), url: link });
      onClose();
    } catch {
      setSaveError('Não foi possível salvar a rede. Tente de novo.');
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={closeUnlessSaving} className="m-4 max-w-[480px]">
      <div className="relative w-full max-w-[480px] rounded-3xl bg-white p-4 lg:p-8">
        <h4 className="mb-1 text-2xl font-semibold text-gray-800">
          {editingSocialNetwork ? 'Editar rede' : 'Nova rede'}
        </h4>
        <p className="mb-6 text-sm text-gray-500">
          Aparece como botão no rodapé da vitrine. A vitrine leva alguns minutos para mostrar a mudança.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 px-1">
            <div>
              <Label htmlFor="social-network-name">Nome da rede</Label>
              <Input
                id="social-network-name"
                type="text"
                defaultValue={name}
                onChange={(event) => setName(event.target.value)}
                disabled={Boolean(editingSocialNetwork)}
                aria-describedby={editingSocialNetwork ? 'social-network-name-hint' : undefined}
                error={Boolean(fieldErrors.name)}
                className="text-base"
              />
              {editingSocialNetwork && (
                <p id="social-network-name-hint" className="mt-1.5 text-xs text-gray-500">
                  O nome não pode ser alterado; apague e cadastre de novo para trocar.
                </p>
              )}
              {fieldErrors.name && (
                <p role="alert" className="mt-1.5 text-xs text-error-500">
                  {fieldErrors.name}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="social-network-url">{isWhatsAppName(name) ? 'Número do WhatsApp' : 'Link'}</Label>
              <Input
                id="social-network-url"
                type={isWhatsAppName(name) ? 'tel' : 'url'}
                inputMode={isWhatsAppName(name) ? 'tel' : 'url'}
                placeholder={isWhatsAppName(name) ? '(11) 98765-4321' : 'https://'}
                defaultValue={url}
                onChange={(event) => setUrl(event.target.value)}
                error={Boolean(fieldErrors.url)}
                className="text-base"
              />
              {fieldErrors.url && (
                <p role="alert" className="mt-1.5 text-xs text-error-500">
                  {fieldErrors.url}
                </p>
              )}
            </div>
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
              {isSaving ? 'Salvando...' : 'Salvar rede'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
