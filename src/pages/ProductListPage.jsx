import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import ProductCard from "../components/home/ProductCard";
import { findCategory, findSubcategory } from "../data/categories";

function ProductListPage({ path, search }) {
  const params = new URLSearchParams(search);
  const categoryValue = decodeURIComponent(path.replace("/category/", "")) || "";
  const subcategoryValue = params.get("subcategory") || "";
  const category = findCategory(categoryValue);
  const subcategory = findSubcategory(category, subcategoryValue);
  const products = [];
  const title = getPageTitle(category, subcategory);

  return (
    <div className="home-page">
      <Header />
      <main className="home-content">
        <section className="product-section">
          <div className="section-heading">
            <h2>{title}</h2>
          </div>

          {!category && <p className="empty-result">카테고리를 선택해주세요.</p>}

          {category && products.length === 0 && (
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

function getPageTitle(category, subcategory) {
  if (!category) {
    return "상품 목록";
  }

  if (subcategory) {
    return `${category.label} > ${subcategory.label} 상품`;
  }

  return `${category.label} 상품`;
}

export default ProductListPage;
