import { fetchSocialNetworks, type SocialNetwork } from '@/entities/social-network';

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
            <ul className="mt-2 flex flex-wrap gap-2">
              {socialNetworks.map((socialNetwork) => (
                <li key={socialNetwork.id}>
                  <a
                    href={socialNetwork.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center rounded-lg border border-gray-200 px-4 text-gray-700 hover:border-brand-500 hover:text-brand-500"
                  >
                    {socialNetwork.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <p>
          multikoisas — {new Date().getFullYear()}. Os produtos são vendidos pelas lojas parceiras.
        </p>
      </div>
    </footer>
  );
};
