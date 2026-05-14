import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import ProductCard from "../components/home/ProductCard";
import { findCategory, findSubcategory } from "../data/categories";
import { mockProducts } from "../data/productData";
import { filterProductsByCategory } from "../utils/category";

function ProductListPage({ path, search }) {
  const params = new URLSearchParams(search);
  const categoryValue = decodeURIComponent(path.replace("/category/", "")) || "";
  const subcategoryValue = params.get("subcategory") || "";
  const category = findCategory(categoryValue);
  const subcategory = findSubcategory(category, subcategoryValue);
  // TODO: IA 문서 기준 API 확정 후 카테고리 상품 목록 mock data를 실제 API 응답으로 교체
  const products = category
    ? filterProductsByCategory(mockProducts, category.value, subcategory?.value || "")
    : [];
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
            <p className="empty-result">해당 카테고리에 상품이 없습니다.</p>
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
