import type { Metadata } from 'next';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { SocialNetworkAdminScreen } from '@/features/social-network-admin';

export const metadata: Metadata = {
  title: 'Configurações de site | MultiKoisas',
  description: 'Configurações do site da MultiKoisas.',
};

const StorePage = () => (
  <div>
    <PageBreadcrumb pageTitle="Configurações de site" />
    <section aria-labelledby="social-networks-title">
      <h3 id="social-networks-title" className="mb-4 text-lg font-semibold text-gray-800">
        Redes sociais
      </h3>
      <SocialNetworkAdminScreen />
    </section>
  </div>
);

export default StorePage;
