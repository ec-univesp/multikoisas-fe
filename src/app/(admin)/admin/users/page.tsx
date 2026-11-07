import type { Metadata } from 'next';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { UserAdminScreen } from '@/features/user-admin';

export const metadata: Metadata = {
  title: 'Usuários | MultiKoisas',
  description: 'Contas de acesso ao painel da MultiKoisas.',
};

const UsersPage = () => (
  <div>
    <PageBreadcrumb pageTitle="Usuários" />
    <UserAdminScreen />
  </div>
);

export default UsersPage;
