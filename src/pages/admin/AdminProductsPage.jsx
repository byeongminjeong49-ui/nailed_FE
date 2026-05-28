import { useEffect, useMemo, useState } from "react";
import { getAdminProducts } from "../../api/adminApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const PRODUCT_STATUS_LABELS = {
  ON_SALE: "판매중",
  SOLD: "판매완료",
  DELETED: "삭제됨",
};

const PRODUCT_STATUS_CLASS_NAMES = {
  ON_SALE: "mint",
  SOLD: "blue",
  DELETED: "gray",
};

function toAssetUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function formatDate(value) {
  if (!value) return "-";
  if (typeof value === "string" && value.length >= 10) return value.slice(0, 10);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toISOString().slice(0, 10);
}

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price)) return "-";
  return `${price.toLocaleString("ko-KR")}원`;
}

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 0) return [];

  const start = Math.max(0, currentPage - 2);
  const end = Math.min(totalPages - 1, start + 4);
  const adjustedStart = Math.max(0, end - 4);

  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index,
  );
}

function ProductThumbnail({ product }) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = toAssetUrl(product.thumbnailUrl);

  if (!imageUrl || hasError) {
    return (
      <span
        aria-label="상품 이미지 없음"
        style={{
          width: 42,
          height: 42,
          display: "inline-grid",
          placeItems: "center",
          borderRadius: 6,
          background: "#f0f1f2",
          color: "#888",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        없음
      </span>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={product.title || "상품 이미지"}
      loading="lazy"
      onError={() => setHasError(true)}
      style={{
        width: 42,
        height: 42,
        display: "block",
        borderRadius: 6,
        objectFit: "cover",
        background: "#f0f1f2",
      }}
    />
  );
}

function AdminProductsPage() {
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [productStatus, setProductStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [products, setProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const pageNumbers = useMemo(
    () => getPageNumbers(pageInfo.pageNumber, pageInfo.totalPages),
    [pageInfo.pageNumber, pageInfo.totalPages],
  );

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      setLoading(true);
      setErrorMessage("");

      try {
        const data = await getAdminProducts({
          page,
          size,
          keyword: appliedKeyword,
          productStatus,
        });

        if (ignore) return;

        setProducts(Array.isArray(data?.content) ? data.content : []);
        setPageInfo({
          pageNumber: data?.pageNumber ?? page,
          pageSize: data?.pageSize ?? size,
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0,
          first: data?.first ?? true,
          last: data?.last ?? true,
        });
      } catch (error) {
        if (ignore) return;

        setProducts([]);
        setPageInfo((current) => ({
          ...current,
          pageNumber: 0,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        }));
        setErrorMessage(error.message || "상품 목록을 불러오지 못했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      ignore = true;
    };
  }, [appliedKeyword, page, productStatus, size]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    setPage(0);
    setAppliedKeyword(keyword.trim());
  }

  function handleReset() {
    setKeyword("");
    setAppliedKeyword("");
    setProductStatus("");
    setPage(0);
  }

  function handleStatusChange(event) {
    setProductStatus(event.target.value);
    setPage(0);
  }

  function handleSizeChange(event) {
    setSize(Number(event.target.value));
    setPage(0);
  }

  return (
    <div className="admin-page">
      <div className="admin-page-title">
        <h1>상품 관리</h1>
        <p>등록된 상품을 조회하고 판매 상태 기준으로 확인합니다.</p>
      </div>

      <div className="admin-content-main">
        <section className="admin-card search-filter-card">
          <form className="filter-row" onSubmit={handleSearchSubmit}>
            <div className="filter-field search-field">
              <label htmlFor="admin-product-search">상품 검색</label>
              <div className="filter-input">
                <input
                  id="admin-product-search"
                  type="search"
                  placeholder="상품명, 브랜드, 판매자 검색"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </div>
            </div>

            <div className="filter-field">
              <label htmlFor="admin-product-status">판매 상태</label>
              <select id="admin-product-status" value={productStatus} onChange={handleStatusChange}>
                <option value="">전체</option>
                <option value="ON_SALE">판매중</option>
                <option value="SOLD">판매완료</option>
                <option value="DELETED">삭제됨</option>
              </select>
            </div>

            <button className="admin-primary-button" type="submit">
              검색
            </button>
          </form>

          <div className="filter-tabs">
            <button
              className={!productStatus ? "is-active" : ""}
              type="button"
              onClick={() => {
                setProductStatus("");
                setPage(0);
              }}
            >
              전체
            </button>
            {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
              <button
                className={productStatus === value ? "is-active" : ""}
                type="button"
                key={value}
                onClick={() => {
                  setProductStatus(value);
                  setPage(0);
                }}
              >
                {label}
              </button>
            ))}
            <button className="reset-button" type="button" onClick={handleReset}>
              초기화
            </button>
          </div>
        </section>

        <section className="admin-card table-card">
          <div className="table-card-header">
            <h2>
              상품 목록 <span>(총 {pageInfo.totalElements}건)</span>
            </h2>
          </div>

          {errorMessage && <p className="admin-inquiry-message">{errorMessage}</p>}

          <div className="admin-table-wrap">
            <table className="admin-table" style={{ minWidth: 1180 }}>
              <thead>
                <tr>
                  <th>이미지</th>
                  <th>상품ID</th>
                  <th>상품명</th>
                  <th>브랜드</th>
                  <th>카테고리</th>
                  <th>가격</th>
                  <th>상태</th>
                  <th>조회</th>
                  <th>찜</th>
                  <th>판매자</th>
                  <th>등록일</th>
                  <th>수정일</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="12" className="admin-inquiry-empty">
                      상품 목록을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="admin-inquiry-empty">
                      상품 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={String(product.productId)}>
                      <td>
                        <ProductThumbnail product={product} />
                      </td>
                      <td>{product.productId ?? "-"}</td>
                      <td title={product.title || ""}>{product.title || "-"}</td>
                      <td>{product.brandName || "-"}</td>
                      <td>{product.categoryPath || product.categoryName || "-"}</td>
                      <td>{formatPrice(product.price)}</td>
                      <td>
                        <span className={`status-badge ${PRODUCT_STATUS_CLASS_NAMES[product.productStatus] || "gray"}`}>
                          {PRODUCT_STATUS_LABELS[product.productStatus] || product.productStatus || "-"}
                        </span>
                      </td>
                      <td>{product.viewCount ?? 0}</td>
                      <td>{product.wishlistCount ?? 0}</td>
                      <td>{product.sellerNickname || product.sellerUserid || "-"}</td>
                      <td>{formatDate(product.createdAt)}</td>
                      <td>{formatDate(product.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-pagination">
            <button
              type="button"
              disabled={pageInfo.first || loading}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              이전
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                className={pageInfo.pageNumber === pageNumber ? "is-active" : ""}
                type="button"
                key={pageNumber}
                disabled={loading}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={pageInfo.last || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              다음
            </button>
            <select value={size} onChange={handleSizeChange} disabled={loading}>
              <option value="10">10개씩 보기</option>
              <option value="20">20개씩 보기</option>
              <option value="50">50개씩 보기</option>
            </select>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminProductsPage;
