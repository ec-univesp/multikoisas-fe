import { Outfit } from 'next/font/google';
import { LocalApiProvider } from '@/shared/local-api/LocalApiProvider';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], display: 'swap' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${outfit.className} bg-neutral-50`}>
        <LocalApiProvider>{children}</LocalApiProvider>
      </body>
    </html>
  );
}
