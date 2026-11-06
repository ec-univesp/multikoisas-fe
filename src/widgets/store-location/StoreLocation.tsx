import { Navigation } from 'lucide-react';
import { STORE_SETTINGS, type StoreSettings } from '@/entities/store-settings';

export const StoreLocation = ({ settings = STORE_SETTINGS }: { settings?: StoreSettings } = {}) => {
  const address = settings.address?.trim();
  if (!address) return null;

  const encodedAddress = encodeURIComponent(address);

  return (
    <section id="location" className="mx-auto max-w-7xl scroll-mt-4 px-4 py-6 lg:px-8">
      <div className="grid gap-6 rounded-xl bg-white p-5 shadow-theme-xs lg:grid-cols-2 lg:items-center lg:p-10">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-store-navy sm:text-3xl">Onde estamos</h2>
          <address className="mt-3 text-gray-700 not-italic">{address}</address>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex h-11 w-fit items-center gap-2 rounded-lg bg-store-yellow px-3 text-sm font-bold text-store-navy-950 hover:brightness-95"
          >
            <Navigation aria-hidden className="size-4" />
            Como chegar
          </a>
        </div>
        <iframe
          src={`https://www.google.com/maps?q=${encodedAddress}&output=embed`}
          title="Mapa da loja MultiKoisas"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="aspect-[4/3] w-full rounded-lg border-0"
        />
      </div>
    </section>
  );
};
