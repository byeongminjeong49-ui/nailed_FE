import { useEffect, useState } from "react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import ProductCard from "../components/home/ProductCard";
import { searchProducts } from "../api/productApi";
import { isValidSearchKeyword, normalizeSearchKeyword } from "../utils/search";

function toCardShape(product) {
  return {
    id: product.productId,
    name: product.title,
    price: product.price,
    imageUrl: product.thumbnailUrl || null,
    brandName: product.brandName || null,
    size: product.size || null,
    wishlistCount: product.wishlistCount ?? 0,
    productStatus: product.productStatus || null,
  };
}

function SearchResultPage({ search }) {
  const keyword = normalizeSearchKeyword(new URLSearchParams(search).get("keyword") || "");
  const isValidKeyword = isValidSearchKeyword(keyword);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isValidKeyword) {
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }

    let ignore = false;

    setLoading(true);
    setError(null);
    setProducts([]);

    searchProducts({ keyword, page: 0, size: 20 })
      .then((data) => {
        if (ignore) return;

        const list = Array.isArray(data) ? data : (data.content ?? []);
        setProducts(list.map(toCardShape));
      })
      .catch((err) => {
        if (ignore) return;

        setError(err.message || "검색 결과를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [keyword, isValidKeyword]);

  return (
    <div className="home-page">
      <Header />
      <main className="home-content">
        <section className="product-section">
          <div className="section-heading">
            <h2>{isValidKeyword ? `'${keyword}' 검색 결과` : "검색 결과"}</h2>
          </div>

          {!isValidKeyword && (
            <p className="empty-result">두 글자 이상의 검색어를 입력해주세요.</p>
          )}

          {isValidKeyword && loading && (
            <p className="empty-result">검색 결과를 불러오는 중입니다.</p>
          )}

          {isValidKeyword && !loading && error && (
            <p className="empty-result">{error}</p>
          )}

          {isValidKeyword && !loading && !error && products.length === 0 && (
            <p className="empty-result">검색 결과가 없습니다.</p>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id ?? product.productId} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default SearchResultPage;
