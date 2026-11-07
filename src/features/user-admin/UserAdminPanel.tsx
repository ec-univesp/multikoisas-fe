'use client';

import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import { useModal } from '@/hooks/useModal';
import { PlusIcon } from '@/icons';
import { UserFormModal } from './UserFormModal';
import { DeleteUserModal } from './DeleteUserModal';
import { UserTable } from './UserTable';
import {
  type UserAccount,
  type UserValues,
  createUser,
  deleteUser,
  fetchAllUsers,
  isAdminRole,
  updateUser,
} from './userApi';

type UserAdminPanelProps = {
  initialUsers: readonly UserAccount[];
};

export const UserAdminPanel = ({ initialUsers }: UserAdminPanelProps) => {
  const [users, setUsers] = useState<UserAccount[]>([...initialUsers]);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const formModal = useModal();
  const deleteModal = useModal();

  const openFormModal = (user: UserAccount | null) => {
    setEditingUser(user);
    setFeedbackMessage(null);
    formModal.openModal();
  };

  const openDeleteModal = (user: UserAccount) => {
    setDeletingUser(user);
    setFeedbackMessage(null);
    deleteModal.openModal();
  };

  const addUser = async (values: UserValues) => {
    await createUser(values);
    try {
      setUsers(await fetchAllUsers());
    } catch {
      setFeedbackMessage('O usuário foi salvo, mas a lista não atualizou. Recarregue a página.');
    }
  };

  const saveUser = async (values: UserValues) => {
    if (!editingUser) return addUser(values);
    const updatedUser = await updateUser(editingUser, values);
    if (isAdminRole(updatedUser.role) !== isAdminRole(values.role)) {
      setFeedbackMessage('O perfil não foi alterado. Tente de novo.');
    }
    setUsers((currentUsers) =>
      currentUsers.map((candidate) => (candidate.id === editingUser.id ? updatedUser : candidate)),
    );
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteUser(deletingUser);
      setUsers((currentUsers) => currentUsers.filter((candidate) => candidate.id !== deletingUser.id));
      setDeletingUser(null);
    } catch {
      setFeedbackMessage('Não foi possível apagar o usuário. Recarregue a página e tente de novo.');
    } finally {
      setIsDeleting(false);
      deleteModal.closeModal();
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <p className="text-theme-sm text-gray-500">
          {users.length} {users.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
        </p>
        <Button size="sm" startIcon={<PlusIcon />} onClick={() => openFormModal(null)}>
          Novo usuário
        </Button>
      </div>

      {feedbackMessage && (
        <p role="alert" className="mb-4 text-sm text-error-500">
          {feedbackMessage}
        </p>
      )}

      <UserTable users={users} onEdit={openFormModal} onDelete={openDeleteModal} />

      {formModal.isOpen && <UserFormModal onClose={formModal.closeModal} editingUser={editingUser} onSave={saveUser} />}

      <DeleteUserModal
        isOpen={deleteModal.isOpen}
        onClose={isDeleting ? () => undefined : deleteModal.closeModal}
        user={deletingUser}
        onConfirm={confirmDeleteUser}
        isDeleting={isDeleting}
      />
    </div>
  );
};
