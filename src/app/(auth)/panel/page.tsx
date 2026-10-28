import type { Metadata } from 'next';
import { LoginForm } from '@/features/admin-auth';

export const metadata: Metadata = {
  title: 'Entrar | Multikoisas',
  robots: { index: false },
};

export default function PanelPage() {
  return <LoginForm />;
}
