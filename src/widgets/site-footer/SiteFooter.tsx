import { fetchSocialNetworks, SocialNetworkLinks, type SocialNetwork } from '@/entities/social-network';

const loadSocialNetworks = (): Promise<SocialNetwork[]> => fetchSocialNetworks().catch(() => []);

export const SiteFooter = async () => {
  const socialNetworks = await loadSocialNetworks();
  return (
    <footer className="border-t border-gray-200 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-gray-500 sm:px-6">
        {socialNetworks.length > 0 && (
          <nav aria-labelledby="site-footer-social">
            <h2 id="site-footer-social" className="font-medium text-gray-700">
              Siga a MultiKoisas
            </h2>
            <SocialNetworkLinks
              socialNetworks={socialNetworks}
              className="mt-2"
              linkClassName="border border-gray-200 text-gray-700 hover:border-brand-500 hover:text-brand-500"
            />
          </nav>
        )}
        <p>
          multikoisas — {new Date().getFullYear()}. Os produtos são vendidos pelas lojas parceiras.
        </p>
      </div>
    </footer>
  );
};
