import { useState, useEffect } from "react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import ProductCard from "../components/home/ProductCard";
import { findCategory, findSubcategory, resolveDbCode } from "../data/categories";
import { getProductList } from "../api/productApi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function toCardShape(p) {
  return {
    id: p.productId,
    name: p.title,
    price: p.price,
    imageUrl: p.thumbnailUrl ? `${API_BASE}${p.thumbnailUrl}` : null,
    likes: p.wishlistCount,
    seller: "",
  };
}

function ProductListPage({ path, search }) {
  const params = new URLSearchParams(search);
  const categoryValue = decodeURIComponent(path.replace("/category/", "")) || "";
  const subcategoryValue = params.get("subcategory") || "";
  const category = findCategory(categoryValue);
  const subcategory = findSubcategory(category, subcategoryValue);
  const title = getPageTitle(category, subcategory);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!category) return;

    const targetCode = resolveDbCode(category, subcategoryValue);
    if (!targetCode) return;

    setLoading(true);
    setError(null);
    setProducts([]);

    // /api/products/categories → code 로 groupId 찾기 → 상품 조회
    fetch(`${API_BASE}/api/products/categories`)
      .then((r) => r.json())
      .then((res) => {
        const cats = Array.isArray(res.data) ? res.data : [];
        const found = cats.find((c) => c.code === targetCode);
        if (!found) {
          setLoading(false);
          return null;
        }
        return getProductList(found.groupId, 0, 40);
      })
      .then((data) => {
        if (data === null || data === undefined) return;
        const list = Array.isArray(data) ? data : (data.content ?? []);
        setProducts(list.map(toCardShape));
      })
      .catch(() => setError("상품을 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [categoryValue, subcategoryValue]);

  return (
    <div className="home-page">
      <Header />
      <main className="home-content">
        <section className="product-section">
          <div className="section-heading">
            <h2>{title}</h2>
          </div>

          {!category && <p className="empty-result">카테고리를 선택해주세요.</p>}
          {category && loading && <p className="empty-result">불러오는 중…</p>}
          {category && !loading && error && <p className="empty-result">{error}</p>}
          {category && !loading && !error && products.length === 0 && (
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
  if (!category) return "상품 목록";
  if (subcategory) return `${category.label} > ${subcategory.label} 상품`;
  return `${category.label} 상품`;
}

export default ProductListPage;
