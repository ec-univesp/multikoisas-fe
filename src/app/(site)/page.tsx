import { AboutSection } from '@/widgets/about-section';
import { fetchGooglePlace } from '@/entities/google-place';
import { FeaturedProducts } from '@/widgets/featured-products';
import { GoogleReviews } from '@/widgets/google-reviews';
import { HowToBuy } from '@/widgets/how-to-buy';
import { StoreLocation } from '@/widgets/store-location';

const HomePage = async () => (
  <>
    <AboutSection />
    <FeaturedProducts />
    <HowToBuy />
    <GoogleReviews place={await fetchGooglePlace()} />
    <StoreLocation />
  </>
);

export default HomePage;
