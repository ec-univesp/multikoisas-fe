import { AboutSection } from '@/widgets/about-section';
import { Hero } from '@/widgets/hero';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';

const HomePage = () => (
  <>
    <SiteHeader />
    <main>
      <Hero />
      <AboutSection />
    </main>
    <SiteFooter />
  </>
);

export default HomePage;
