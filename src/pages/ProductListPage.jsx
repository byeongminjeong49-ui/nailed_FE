import { useState, useEffect } from "react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import ProductCard from "../components/home/ProductCard";
import { findCategory, findSubcategory, resolveDbCode } from "../data/categories";
import { getProductListByCode } from "../api/productApi";

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
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 카테고리 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(0);
    setTotalPages(0);
  }, [categoryValue, subcategoryValue]);

  // 상품 조회
  useEffect(() => {
    if (!category) return;
    const targetCode = resolveDbCode(category, subcategoryValue);
    if (!targetCode) return;

    setLoading(true);
    setError(null);
    setProducts([]);

    getProductListByCode(targetCode, currentPage, 20)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.content ?? []);
        setProducts(list.map(toCardShape));
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => setError("상품을 불러오는 데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [categoryValue, subcategoryValue, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

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

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  const maxVisible = 5;
  let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages - 1, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(0, end - maxVisible + 1);
  }

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="pagination">
      <button
        className="page-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        &lt;
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`page-btn${p === currentPage ? " active" : ""}`}
          onClick={() => onPageChange(p)}
        >
          {p + 1}
        </button>
      ))}
      <button
        className="page-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
      >
        &gt;
      </button>
    </div>
  );
}

function getPageTitle(category, subcategory) {
  if (!category) return "상품 목록";
  if (subcategory) return `${category.label} > ${subcategory.label} 상품`;
  return `${category.label} 상품`;
}

export default ProductListPage;
