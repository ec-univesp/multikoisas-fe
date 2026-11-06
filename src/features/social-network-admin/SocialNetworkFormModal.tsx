'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import { isHttpsUrl, type SocialNetwork } from '@/entities/social-network';
import { SocialNetworkNameTakenError, type SocialNetworkValues } from './socialNetworkApi';

const NAME_TAKEN_MESSAGE = 'Já existe uma rede com esse nome.';

const collapseSpaces = (text: string): string => text.trim().replace(/\s+/g, ' ');

const normalizeName = (name: string): string =>
  collapseSpaces(name)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR');

// O nome vai no caminho do PUT e do DELETE; o firewall do Spring recusa esses caracteres e os nomes "." e "..".
const isUnsafeInPath = (name: string): boolean => /[/\\%;]/.test(name) || ['.', '..'].includes(collapseSpaces(name));

const nameErrorOf = (name: string, isRepeated: boolean): string | null => {
  if (!name.trim()) return 'Informe o nome da rede.';
  if (isUnsafeInPath(name)) return 'Use um nome sem / \\ % ; e diferente de "." ou "..".';
  return isRepeated ? NAME_TAKEN_MESSAGE : null;
};

type FieldErrors = { name: string | null; url: string | null };

const validate = ({ name, url }: SocialNetworkValues, otherSocialNetworks: readonly SocialNetwork[]): FieldErrors => {
  const isRepeated = otherSocialNetworks.some(
    (socialNetwork) => normalizeName(socialNetwork.name) === normalizeName(name),
  );
  return {
    name: nameErrorOf(name, isRepeated),
    url: isHttpsUrl(url.trim()) ? null : 'Informe um link completo, começando com https://.',
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
  const [url, setUrl] = useState(editingSocialNetwork?.url ?? '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({ name: null, url: null });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const closeUnlessSaving = () => {
    if (!isSaving) onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const otherSocialNetworks = socialNetworks.filter((socialNetwork) => socialNetwork !== editingSocialNetwork);
    const validationErrors = validate({ name, url }, otherSocialNetworks);
    setFieldErrors(validationErrors);
    if (validationErrors.name || validationErrors.url) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const savedName = name === editingSocialNetwork?.name ? name : collapseSpaces(name);
      await onSave({ name: savedName, url: url.trim() });
      onClose();
    } catch (error) {
      if (error instanceof SocialNetworkNameTakenError) {
        setFieldErrors({ name: NAME_TAKEN_MESSAGE, url: null });
      } else {
        setSaveError('Não foi possível salvar a rede. Tente de novo.');
      }
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
                error={Boolean(fieldErrors.name)}
                className="text-base"
              />
              {fieldErrors.name && (
                <p role="alert" className="mt-1.5 text-xs text-error-500">
                  {fieldErrors.name}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="social-network-url">Link</Label>
              <Input
                id="social-network-url"
                type="url"
                placeholder="https://"
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
