import { useEffect, useState } from "react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import HeroBanner from "../components/home/HeroBanner";
import ProductSection from "../components/home/ProductSection";
import { getNewProducts, getPopularProducts } from "../api/productApi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function toCardShape(p) {
  return {
    id: p.productId,
    name: p.title,
    price: p.price,
    imageUrl: p.thumbnailUrl || null,
    brandName: p.brandName || null,
    size: p.size || null,
  };
}

function HomePage() {
  const [newProducts, setNewProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);

  useEffect(() => {
    getNewProducts()
      .then((data) => setNewProducts((data ?? []).map(toCardShape)))
      .catch(() => {});

    getPopularProducts()
      .then((data) => setPopularProducts((data ?? []).map(toCardShape)))
      .catch(() => {});
  }, []);

  return (
    <div className="home-page">
      <Header />
      <main>
        <HeroBanner />
        <div className="home-content">
          <ProductSection title="인기 TOP 10" products={popularProducts} />
          <ProductSection title="최신 상품" products={newProducts} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
