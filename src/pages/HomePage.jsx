import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import HeroBanner from "../components/home/HeroBanner";
import ProductSection from "../components/home/ProductSection";
import { productSections } from "../data/productData";

function HomePage() {
  return (
    <div className="home-page">
      <Header />
      <main>
        <HeroBanner />
        <div className="home-content">
          {productSections.map((section) => (
            <ProductSection
              key={section.title}
              title={section.title}
              products={section.products}
            />
          ))}
          <button className="more-button" type="button">
            더보기
            <span aria-hidden="true">⌄</span>
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
