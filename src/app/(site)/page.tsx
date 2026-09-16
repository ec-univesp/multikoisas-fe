import { AboutSection } from '@/widgets/about-section';
import { Hero } from '@/widgets/hero';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';
import { Vitrine } from '@/widgets/vitrine';

const HomePage = () => (
  <>
    <SiteHeader />
    <main>
      <Hero />
      <Vitrine />
      <AboutSection />
    </main>
    <SiteFooter />
  </>
);

export default HomePage;
