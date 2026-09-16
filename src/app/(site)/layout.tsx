import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'MultiKoisas — Tudo em um só lugar', template: '%s | MultiKoisas' },
  description:
    'Vitrine da MultiKoisas: utilidades para casa, cozinha, limpeza e organização. Veja os detalhes e compre nas nossas lojas parceiras.',
};

const darkModeBySystemPreference = `
(function () {
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  var apply = function () { document.documentElement.classList.toggle('dark', prefersDark.matches); };
  apply();
  prefersDark.addEventListener('change', apply);
})();
`;

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: darkModeBySystemPreference }} />
      {children}
    </>
  );
}
