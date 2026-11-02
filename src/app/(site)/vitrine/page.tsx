import type { Metadata } from 'next';
import { Vitrine } from '@/widgets/vitrine';

export const metadata = {
  title: 'Vitrine de produtos',
  description:
    'Todos os produtos da MultiKoisas com busca e categorias. Veja os detalhes e compre na loja parceira que preferir.',
} satisfies Metadata;

const VitrinePage = () => <Vitrine />;

export default VitrinePage;
