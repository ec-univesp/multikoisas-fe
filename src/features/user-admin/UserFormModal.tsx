'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import { EmailTakenError, UsernameTakenError, isAdminRole, type UserAccount, type UserValues } from './userApi';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'USER', label: 'Usuário' },
];

// The username goes in the PUT and DELETE path.
const isSafeUsername = (username: string): boolean => /^[\w.-]+$/.test(username) && !['.', '..'].includes(username);

const usernameErrorOf = (username: string): string | null => {
  if (!username) return 'Informe o nome de usuário.';
  return isSafeUsername(username) ? null : 'Use só letras, números, ponto, hífen ou sublinhado.';
};

type FieldErrors = { username: string | null; email: string | null; password: string | null };

const NO_ERRORS: FieldErrors = { username: null, email: null, password: null };

const validate = ({ username, email, password }: UserValues, isEditing: boolean): FieldErrors => ({
  username: isEditing ? null : usernameErrorOf(username),
  email: /^\S+@\S+$/.test(email) ? null : 'Informe um e-mail válido.',
  password: isEditing || password.trim() ? null : 'Informe a senha.',
});

const FieldError = ({ message }: { message: string | null }) =>
  message ? (
    <p role="alert" className="mt-1.5 text-xs text-error-500">
      {message}
    </p>
  ) : null;

type UserFormModalProps = {
  onClose: () => void;
  editingUser: UserAccount | null;
  onSave: (values: UserValues) => Promise<void>;
};

export const UserFormModal = ({ onClose, editingUser, onSave }: UserFormModalProps) => {
  const [username, setUsername] = useState(editingUser?.username ?? '');
  const [email, setEmail] = useState(editingUser?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(editingUser && isAdminRole(editingUser.role) ? 'ADMIN' : 'USER');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(NO_ERRORS);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const closeUnlessSaving = () => {
    if (!isSaving) onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = { username: username.trim(), email: email.trim(), password, role };
    const validationErrors = validate(values, Boolean(editingUser));
    setFieldErrors(validationErrors);
    if (validationErrors.username || validationErrors.email || validationErrors.password) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(values);
      onClose();
    } catch (error) {
      if (error instanceof UsernameTakenError) {
        setFieldErrors({ ...NO_ERRORS, username: 'Este nome de usuário já está em uso.' });
      } else if (error instanceof EmailTakenError) {
        setFieldErrors({ ...NO_ERRORS, email: 'Este e-mail já está em uso.' });
      } else {
        setSaveError('Não foi possível salvar o usuário. Tente de novo.');
      }
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={closeUnlessSaving} className="m-4 max-w-[480px]">
      <div className="relative w-full max-w-[480px] rounded-3xl bg-white p-4 lg:p-8">
        <h4 className="mb-6 text-2xl font-semibold text-gray-800">{editingUser ? 'Editar usuário' : 'Novo usuário'}</h4>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 px-1">
            <div>
              <Label htmlFor="user-username">Nome de usuário</Label>
              <Input
                id="user-username"
                type="text"
                defaultValue={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={Boolean(editingUser)}
                error={Boolean(fieldErrors.username)}
                className="text-base"
              />
              <FieldError message={fieldErrors.username} />
            </div>
            <div>
              <Label htmlFor="user-email">E-mail</Label>
              <Input
                id="user-email"
                type="email"
                defaultValue={email}
                onChange={(event) => setEmail(event.target.value)}
                error={Boolean(fieldErrors.email)}
                className="text-base"
              />
              <FieldError message={fieldErrors.email} />
            </div>
            <div>
              <Label htmlFor="user-password">Senha</Label>
              <Input
                id="user-password"
                type="password"
                placeholder={editingUser ? 'Deixe em branco para manter' : undefined}
                onChange={(event) => setPassword(event.target.value)}
                error={Boolean(fieldErrors.password)}
                className="text-base"
              />
              <FieldError message={fieldErrors.password} />
            </div>
            <div>
              <Label htmlFor="user-role">Perfil</Label>
              <Select
                id="user-role"
                options={ROLE_OPTIONS}
                placeholder="Escolha o perfil"
                defaultValue={role}
                onChange={setRole}
                className="text-base"
              />
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
              {isSaving ? 'Salvando...' : 'Salvar usuário'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
