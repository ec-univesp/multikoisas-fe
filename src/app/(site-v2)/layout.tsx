import { VitrineSearchProvider } from '@/features/vitrine-filter';
import { SiteFooter } from '@/widgets/site-footer';

const forceLightTheme = `document.documentElement.classList.remove('dark');`;

export default function SiteV2Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <script dangerouslySetInnerHTML={{ __html: forceLightTheme }} />
      <VitrineSearchProvider>
        <main className="flex-1">{children}</main>
      </VitrineSearchProvider>
      <SiteFooter />
    </div>
  );
}
