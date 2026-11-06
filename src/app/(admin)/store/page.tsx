import type { Metadata } from 'next';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { SocialNetworkAdminScreen } from '@/features/social-network-admin';
import { StoreLogoField } from '@/features/store-logo';
import { StoreSettingsForm } from '@/features/store-settings-form';

export const metadata: Metadata = {
  title: 'Configurações de site | MultiKoisas',
  description: 'Configurações do site da MultiKoisas.',
};

const StorePage = () => (
  <div>
    <PageBreadcrumb pageTitle="Configurações de site" />
    <section aria-labelledby="store-logo-title" className="mb-8">
      <h3 id="store-logo-title" className="mb-4 text-lg font-semibold text-gray-800">
        Logo da vitrine
      </h3>
      <StoreLogoField />
    </section>
    <section aria-labelledby="store-settings-title" className="mb-8">
      <h3 id="store-settings-title" className="mb-4 text-lg font-semibold text-gray-800">
        Dados da loja
      </h3>
      <StoreSettingsForm />
    </section>
    <section aria-labelledby="social-networks-title">
      <h3 id="social-networks-title" className="mb-4 text-lg font-semibold text-gray-800">
        Redes sociais
      </h3>
      <SocialNetworkAdminScreen />
    </section>
  </div>
);

export default StorePage;
