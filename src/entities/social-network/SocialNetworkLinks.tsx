import { SocialNetworkIcon } from './SocialNetworkIcon';
import type { SocialNetwork } from './types';

type SocialNetworkLinksProps = {
  socialNetworks: readonly SocialNetwork[];
  className: string;
  linkClassName: string;
};

export const SocialNetworkLinks = ({ socialNetworks, className, linkClassName }: SocialNetworkLinksProps) => (
  <ul className={`flex flex-wrap gap-2 ${className}`}>
    {socialNetworks.map((socialNetwork) => (
      <li key={socialNetwork.id}>
        <a
          href={socialNetwork.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 ${linkClassName}`}
        >
          <SocialNetworkIcon name={socialNetwork.name} />
          {socialNetwork.name}
        </a>
      </li>
    ))}
  </ul>
);
