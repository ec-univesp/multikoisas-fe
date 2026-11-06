'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PencilIcon, TrashBinIcon } from '@/icons';
import { isHttpsUrl, type SocialNetwork } from '@/entities/social-network';

type SocialNetworkTableProps = {
  socialNetworks: readonly SocialNetwork[];
  onEdit: (socialNetwork: SocialNetwork) => void;
  onDelete: (socialNetwork: SocialNetwork) => void;
};

const actionButtonClassName =
  'flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100';

export const SocialNetworkTable = ({ socialNetworks, onEdit, onDelete }: SocialNetworkTableProps) => {
  if (socialNetworks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-theme-sm text-gray-500">Nenhuma rede cadastrada.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="relative overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-200">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500"
              >
                Rede social
              </TableCell>
              <TableCell isHeader className="px-5 py-3">
                <span className="sr-only">Ações</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {socialNetworks.map((socialNetwork) => (
              <TableRow key={socialNetwork.id}>
                <TableCell className="px-5 py-4 text-start">
                  <p className="text-theme-sm font-medium text-gray-800">{socialNetwork.name}</p>
                  <p className="break-all text-theme-xs text-gray-500">{socialNetwork.url}</p>
                  {!isHttpsUrl(socialNetwork.url) && (
                    <p className="mt-1 text-theme-xs text-error-500">Link sem https, não aparece na vitrine</p>
                  )}
                </TableCell>
                <TableCell className="px-5 py-4 text-end">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(socialNetwork)}
                      aria-label={`Editar ${socialNetwork.name}`}
                      title="Editar rede"
                      className={`${actionButtonClassName} hover:text-brand-500`}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(socialNetwork)}
                      aria-label={`Apagar ${socialNetwork.name}`}
                      title="Apagar rede"
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
