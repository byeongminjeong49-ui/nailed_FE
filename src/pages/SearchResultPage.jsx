import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import ProductCard from "../components/home/ProductCard";
import { isValidSearchKeyword, normalizeSearchKeyword } from "../utils/search";

function SearchResultPage({ search }) {
  const keyword = normalizeSearchKeyword(new URLSearchParams(search).get("keyword") || "");
  const isValidKeyword = isValidSearchKeyword(keyword);
  const products = [];

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

          {isValidKeyword && products.length === 0 && (
            <p className="empty-result">상품 데이터가 없습니다.</p>
          )}

          {products.length > 0 && (
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
