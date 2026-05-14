import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import ProductCard from "../components/home/ProductCard";
import { mockProducts } from "../data/productData";
import { isValidSearchKeyword, normalizeSearchKeyword, searchProducts } from "../utils/search";

function SearchResultPage({ search }) {
  const keyword = normalizeSearchKeyword(new URLSearchParams(search).get("keyword") || "");
  const isValidKeyword = isValidSearchKeyword(keyword);
  // TODO: 백엔드 상품 검색 API 연동 시 mockProducts 대신 GET /api/products/search 응답으로 교체
  const products = isValidKeyword ? searchProducts(mockProducts, keyword) : [];

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
            <p className="empty-result">검색 결과가 없습니다.</p>
          )}

          {products.length > 0 && (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
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
