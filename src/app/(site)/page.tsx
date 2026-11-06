import { AboutSection } from '@/widgets/about-section';
import { FeaturedProducts } from '@/widgets/featured-products';
import { HowToBuy } from '@/widgets/how-to-buy';
import { StoreLocation } from '@/widgets/store-location';

const HomePage = () => (
  <>
    <AboutSection />
    <FeaturedProducts />
    <HowToBuy />
    <StoreLocation />
  </>
);

export default HomePage;
