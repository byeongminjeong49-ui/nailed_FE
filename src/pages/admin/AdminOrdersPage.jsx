import { useEffect, useMemo, useState } from "react";
import { getAdminOrders } from "../../api/adminApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const ORDER_STATUS_LABELS = {
  REQUESTED: "주문접수",
  PAID: "결제완료",
  SHIPPING: "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "취소",
};

const ORDER_STATUS_CLASS_NAMES = {
  REQUESTED: "orange",
  PAID: "mint",
  SHIPPING: "blue",
  DELIVERED: "gray",
  CANCELLED: "red",
};

const PAGE_SIZE = 10;
const ORDER_SORT = "orderId,asc";

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

function sortByIdAsc(items, field) {
  return [...items].sort((a, b) => Number(a?.[field] ?? 0) - Number(b?.[field] ?? 0));
}

function OrderThumbnail({ order }) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = toAssetUrl(order.productThumbnailUrl);

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
      alt={order.productTitle || "상품 이미지"}
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

function AdminOrdersPage() {
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [orders, setOrders] = useState([]);
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

    async function loadOrders() {
      setLoading(true);
      setErrorMessage("");

      try {
        const data = await getAdminOrders({
          page,
          size: PAGE_SIZE,
          keyword: appliedKeyword,
          orderStatus,
          dateFrom: appliedDateFrom,
          dateTo: appliedDateTo,
          sort: ORDER_SORT,
        });

        if (ignore) return;

        const content = Array.isArray(data?.content) ? data.content : [];
        setOrders(sortByIdAsc(content, "orderId"));
        setPageInfo({
          pageNumber: data?.pageNumber ?? page,
          pageSize: data?.pageSize ?? PAGE_SIZE,
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0,
          first: data?.first ?? true,
          last: data?.last ?? true,
        });
      } catch (error) {
        if (ignore) return;

        setOrders([]);
        setPageInfo((current) => ({
          ...current,
          pageNumber: 0,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        }));
        setErrorMessage(error.message || "주문 목록을 불러오지 못했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      ignore = true;
    };
  }, [appliedDateFrom, appliedDateTo, appliedKeyword, orderStatus, page]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    setPage(0);
    setAppliedKeyword(keyword.trim());
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
  }

  function handleReset() {
    setKeyword("");
    setAppliedKeyword("");
    setOrderStatus("");
    setDateFrom("");
    setDateTo("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
    setPage(0);
  }

  function handleStatusChange(event) {
    setOrderStatus(event.target.value);
    setPage(0);
  }

  return (
    <div className="admin-page admin-orders-page">
      <div className="admin-page-title">
        <h1>주문 관리</h1>
        <p>주문 정보를 조회하고 주문 상태와 기간 기준으로 확인합니다.</p>
      </div>

      <div className="admin-content-main">
        <section className="admin-card search-filter-card">
          <form className="filter-row admin-filter-row-date" onSubmit={handleSearchSubmit}>
            <div className="filter-field search-field">
              <label htmlFor="admin-order-search">주문 검색</label>
              <div className="filter-input">
                <input
                  id="admin-order-search"
                  type="search"
                  placeholder="주문번호, 상품명, 구매자, 판매자 검색"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </div>
            </div>

            <div className="filter-field">
              <label htmlFor="admin-order-status">주문 상태</label>
              <select id="admin-order-status" value={orderStatus} onChange={handleStatusChange}>
                <option value="">전체</option>
                <option value="REQUESTED">주문접수</option>
                <option value="PAID">결제완료</option>
                <option value="SHIPPING">배송중</option>
                <option value="DELIVERED">배송완료</option>
                <option value="CANCELLED">취소</option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="admin-order-date-from">시작일</label>
              <input
                id="admin-order-date-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>

            <div className="filter-field">
              <label htmlFor="admin-order-date-to">종료일</label>
              <input
                id="admin-order-date-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>

            <button className="admin-primary-button" type="submit">
              검색
            </button>
          </form>

          <div className="filter-tabs">
            <button
              className={!orderStatus ? "is-active" : ""}
              type="button"
              onClick={() => {
                setOrderStatus("");
                setPage(0);
              }}
            >
              전체
            </button>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <button
                className={orderStatus === value ? "is-active" : ""}
                type="button"
                key={value}
                onClick={() => {
                  setOrderStatus(value);
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
              주문 목록 <span>(총 {pageInfo.totalElements}건)</span>
            </h2>
          </div>

          {errorMessage && <p className="admin-inquiry-message">{errorMessage}</p>}

          <div className="admin-table-wrap">
            <table className="admin-table admin-order-table">
              <thead>
                <tr>
                  <th>주문번호</th>
                  <th>이미지</th>
                  <th>상품명</th>
                  <th>구매자</th>
                  <th>판매자</th>
                  <th>주문상태</th>
                  <th>상품금액</th>
                  <th>최종결제금액</th>
                  <th>결제일</th>
                  <th>완료일</th>
                  <th>수정일</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" className="admin-inquiry-empty">
                      주문 목록을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="admin-inquiry-empty">
                      주문 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={String(order.orderId)}>
                      <td>{String(order.orderId || "-")}</td>
                      <td>
                        <OrderThumbnail order={order} />
                      </td>
                      <td title={order.productTitle || ""}>
                        {order.productTitle || "-"}
                        {order.productId != null && (
                          <span style={{ display: "block", marginTop: 2, color: "#888", fontSize: 11 }}>
                            상품ID {String(order.productId)}
                          </span>
                        )}
                      </td>
                      <td title={order.buyerId || ""}>{order.buyerNickname || order.buyerUserid || "-"}</td>
                      <td title={order.sellerId || ""}>{order.sellerNickname || order.sellerUserid || "-"}</td>
                      <td>
                        <span className={`status-badge ${ORDER_STATUS_CLASS_NAMES[order.orderStatus] || "gray"}`}>
                          {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus || "-"}
                        </span>
                      </td>
                      <td>{formatPrice(order.product?.price)}</td>
                      <td>{formatPrice(order.finalPrice)}</td>
                      <td>{formatDate(order.paidAt)}</td>
                      <td>{formatDate(order.completedAt)}</td>
                      <td>{formatDate(order.updatedAt)}</td>
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
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminOrdersPage;
