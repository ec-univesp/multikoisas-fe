'use client';

import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { PencilIcon, TrashBinIcon } from '@/icons';
import { isAdminRole, type UserAccount } from './userApi';

type UserTableProps = {
  users: readonly UserAccount[];
  onEdit: (user: UserAccount) => void;
  onDelete: (user: UserAccount) => void;
};

const actionButtonClassName = 'flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100';

const headerClassName = 'px-5 py-3 text-start text-theme-xs font-medium text-gray-500';

export const UserTable = ({ users, onEdit, onDelete }: UserTableProps) => {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-theme-sm text-gray-500">Nenhum usuário cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="relative overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-200">
            <TableRow>
              <TableCell isHeader className={headerClassName}>
                Usuário
              </TableCell>
              <TableCell isHeader className={headerClassName}>
                E-mail
              </TableCell>
              <TableCell isHeader className={headerClassName}>
                Perfil
              </TableCell>
              <TableCell isHeader className="px-5 py-3">
                <span className="sr-only">Ações</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800">
                  {user.username}
                </TableCell>
                <TableCell className="px-5 py-4 text-start text-theme-sm break-all text-gray-500">
                  {user.email}
                </TableCell>
                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500">
                  {isAdminRole(user.role) ? 'Administrador' : 'Usuário'}
                </TableCell>
                <TableCell className="px-5 py-4 text-end">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      aria-label={`Editar ${user.username}`}
                      title="Editar usuário"
                      className={`${actionButtonClassName} hover:text-brand-500`}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(user)}
                      aria-label={`Apagar ${user.username}`}
                      title="Apagar usuário"
                      className={`${actionButtonClassName} hover:text-error-500`}
                    >
                      <TrashBinIcon />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
