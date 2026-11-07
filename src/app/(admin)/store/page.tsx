import type { Metadata } from 'next';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { LocalDataReset } from '@/features/local-data-reset';
import { ShowcaseAppearanceForm } from '@/features/showcase-appearance-form';
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
    <section aria-labelledby="showcase-appearance-title" className="mb-8">
      <h3 id="showcase-appearance-title" className="mb-4 text-lg font-semibold text-gray-800">
        Aparência da vitrine
      </h3>
      <ShowcaseAppearanceForm />
    </section>
    <section aria-labelledby="social-networks-title" className="mb-8">
      <h3 id="social-networks-title" className="mb-4 text-lg font-semibold text-gray-800">
        Redes sociais
      </h3>
      <SocialNetworkAdminScreen />
    </section>
    <section aria-labelledby="sample-data-title">
      <h3 id="sample-data-title" className="mb-4 text-lg font-semibold text-gray-800">
        Dados de exemplo
      </h3>
      <LocalDataReset />
    </section>
  </div>
);

export default StorePage;
