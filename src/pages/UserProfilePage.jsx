import { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Footer from "../components/common/Footer";
import Header from "../components/common/Header";
import { checkNickname } from "../api/authApi";
import { cancelOrder } from "../api/orderApi";
import {
  fetchMyProfile,
  fetchMyProducts,
  fetchOrders,
  fetchSettlements,
  fetchWishlist,
  updateMyProfile,
  uploadMyProfileImage,
  withdrawMe,
  fetchAccountInfo,
  updateAccountInfo,
} from "../api/myPageApi";
import { fetchMyInquiries, fetchMyInquiryDetail } from "../api/inquiryApi";
import { getSellerProducts, getUserHome } from "../api/productApi";
import { getSellerReviews } from "../api/reviewApi";
import "../styles/review.css";
import "../styles/product-detail.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const DEFAULT_COMMISSION_RATE = 0.02;
const PROFILE_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png"];
const NICKNAME_CHANGE_INTERVAL_DAYS = 30;
const NICKNAME_CHANGED_KEY = "nailed_nickname_changed_at";
const DEFAULT_PROFILE_IMAGE_URL = "/images/profileImg/default-profile.png";


const GRADE = { BRONZE: "브론즈", SILVER: "실버", GOLD: "골드", DIAMOND: "다이아" };

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function toAssetUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function getProductImageUrl(product) {
  if (product?.thumbnailUrl) {
    return toAssetUrl(product.thumbnailUrl);
  }

  if (product?.imageUrl) {
    return toAssetUrl(product.imageUrl);
  }

  if (Array.isArray(product?.imageUrls)) {
    return toAssetUrl(product.imageUrls.find(Boolean) ?? "");
  }

  return "";
}

function getTabFromPath(pathname) {
  if (pathname === "/mypage/orders") return "orders";
  if (pathname === "/mypage/wishlist") return "wishlist";
  if (pathname === "/mypage/selling") return "selling";
  if (pathname === "/mypage/settlements") return "settlements";
  if (pathname === "/mypage/reviews") return "reviews";
  if (pathname === "/mypage/inquiries") return "inquiries";
  if (pathname === "/mypage/account") return "account";
  if (pathname === "/mypage/withdraw") return "withdraw";
  if (pathname === "/mypage/refunds") return "refunds";
  return "products";
}

function getPathFromTab(tab) {
  if (tab === "orders") return "/mypage/orders";
  if (tab === "wishlist") return "/mypage/wishlist";
  if (tab === "selling") return "/mypage/selling";
  if (tab === "settlements") return "/mypage/settlements";
  if (tab === "reviews") return "/mypage/reviews";
  if (tab === "inquiries") return "/mypage/inquiries";
  if (tab === "account") return "/mypage/account";
  if (tab === "withdraw") return "/mypage/withdraw";
  if (tab === "refunds") return "/mypage/refunds";
  return "/mypage";
}

function toList(data) {
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}
function unwrapApiData(data) {
  return data?.data ?? data ?? {};
}

function readTotalPages(data) {
  return Number(data?.totalPages ?? data?.data?.totalPages ?? 0);
}

function readTotalElements(data) {
  return Number(data?.totalElements ?? data?.data?.totalElements ?? 0);
}
function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR");
}

function addDays(value, days) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + days);
  return date;
}

function getNicknameChangeKey(memberId) {
  return `${NICKNAME_CHANGED_KEY}:${memberId || "me"}`;
}

function readLocalNicknameChangedAt(memberId) {
  try {
    return localStorage.getItem(getNicknameChangeKey(memberId));
  } catch {
    return "";
  }
}

function saveLocalNicknameChangedAt(memberId) {
  try {
    localStorage.setItem(getNicknameChangeKey(memberId), new Date().toISOString());
  } catch {
    return;
  }
}

function updateSessionNickname(nickname) {
  try {
    const session = JSON.parse(sessionStorage.getItem("nailed_session") || "null");
    if (!session) return;
    sessionStorage.setItem("nailed_session", JSON.stringify({ ...session, nickname }));
    window.dispatchEvent(new Event("storage"));
  } catch {
    return;
  }
}

function getNicknameAvailableDate(seller) {
  const changedAt = seller?.nicknameUpdatedAt || readLocalNicknameChangedAt(seller?.memberId);
  if (!changedAt) return null;

  const availableAt = addDays(changedAt, NICKNAME_CHANGE_INTERVAL_DAYS);
  if (!availableAt || availableAt <= new Date()) return null;
  return availableAt;
}

function formatWon(value) {
  const amount = Number(value ?? 0);
  return `${amount.toLocaleString()}원`;
}

function normalizeProduct(product) {
  const isSold = Boolean(product?.isSold);
  return {
    ...product,
    productId: product?.productId,
    title: product?.title || product?.productTitle || "상품명 없음",
    price: Number(product?.price ?? product?.finalPrice ?? 0),
    productStatus: product?.productStatus || "",
    orderStatus: product?.orderStatus || "",
    isSold,
    conditionLabel: product?.conditionLabel || product?.conditionCode || "",
    brandName: product?.brandName || "",
    size: product?.size || "",
    categoryCode: product?.categoryCode || "",
    categoryName: product?.categoryName || "",
    categoryPath: product?.categoryPath || "",
    wishlistCount: product?.wishlistCount ?? 0,
  };
}
function getProfileImageUrl(profile) {
  return toAssetUrl(profile?.profileImageUrl || DEFAULT_PROFILE_IMAGE_URL);
}

function normalizeOrder(order) {
  return {
    ...order,
    orderId:      order?.orderId || "",
    productId:    order?.productId,
    productTitle: order?.productTitle || order?.title || "상품명 없음",
    orderStatus:  order.order_status ?? order.orderStatus ?? "",
    previousStatus: order.previous_status ?? order.previousStatus ?? "",
    finalPrice:   Number(order?.finalPrice ?? order?.price ?? 0),
    createdAt:    order?.createdAt || "",
  };
}

function normalizeSettlement(settlement) {
  return {
    ...settlement,
    orderId: settlement?.orderId || "",
    productId: settlement?.productId,
    productTitle: settlement?.productTitle || settlement?.title || "상품명 없음",
    thumbnailUrl: settlement?.thumbnailUrl || settlement?.imageUrl || "",
    commission: Number(settlement?.commission ?? 0),
    finalPrice: Number(settlement?.finalPrice ?? settlement?.price ?? 0),
    sellerSettlementAmount: Number(settlement?.sellerSettlementAmount ?? 0),
    orderStatus: settlement?.orderStatus || "",
    createdAt: settlement?.createdAt || "",
    bankCode: settlement?.bankCode || "",
    depositorName: settlement?.depositorName || "",
  };
}

function normalizeInquiry(inquiry) {
  return {
    ...inquiry,
    inquiryId: inquiry?.inquiryId || "",
    memberId: inquiry?.memberId || "",
    category: inquiry?.category || "",
    title: inquiry?.title || "제목 없음",
    content: inquiry?.content || "",
    inquiryStatus: inquiry?.inquiryStatus || "",
    answerContent: inquiry?.answerContent || "",
    createdAt: inquiry?.createdAt || "",
    answeredAt: inquiry?.answeredAt || "",
  };
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const INQUIRY_CATEGORY_LABELS = {
  ORDER: "주문 문의",
  PAYMENT: "결제 문의",
  PRODUCT: "상품 문의",
  DELIVERY: "배송 문의",
  ACCOUNT: "회원/계정 문의",
  ETC: "기타 문의",
};

const INQUIRY_STATUS_LABELS = {
  PENDING: "답변 대기",
  ANSWERED: "답변 완료",
};

function getInquiryCategoryLabel(category) {
  return INQUIRY_CATEGORY_LABELS[category] || category || "-";
}

function getInquiryStatusLabel(status) {
  return INQUIRY_STATUS_LABELS[status] || status || "-";
}
function createSettlementFromSoldProduct(product) {
  const normalized = normalizeProduct(product);
  const commissionPercent = DEFAULT_COMMISSION_RATE * 100;
  const settlementAmount = Math.floor(normalized.price * (1 - DEFAULT_COMMISSION_RATE));

  return normalizeSettlement({
    ...normalized,
    productTitle: normalized.title,
    thumbnailUrl: getProductImageUrl(normalized),
    finalPrice: normalized.price,
    sellerSettlementAmount: normalized.sellerSettlementAmount ?? settlementAmount,
    commission: normalized.commission ?? commissionPercent,
    orderStatus: normalized.orderStatus || normalized.productStatus || "SOLD",
    createdAt: normalized.soldAt || normalized.updatedAt || normalized.createdAt || "",
  });
}

function mergeSettlementsWithSoldProducts(settlements, products) {
  const normalizedSettlements = settlements.map(normalizeSettlement);
  const settlementProductIds = new Set(
    normalizedSettlements
      .map((settlement) => settlement.productId)
      .filter(Boolean)
      .map(String)
  );

  const missingSoldSettlements = products
    .map(normalizeProduct)
    .filter(isSoldProduct)
    .filter((product) => product.productId && !settlementProductIds.has(String(product.productId)))
    .map(createSettlementFromSoldProduct);

  return [...normalizedSettlements, ...missingSoldSettlements];
}

function mapProfileToSeller(profile, fallbackMemberId, counts = {}) {
  const memberId = profile?.memberId || fallbackMemberId || "";
  return {
    memberId,
    userid: profile?.userid || "",
    nickname: profile?.nickname || profile?.userid || memberId || "회원",
    name: profile?.name || "",
    shopInfo: profile?.shopInfo || "",
    profileImageUrl: getProfileImageUrl(profile),
    nicknameUpdatedAt: profile?.nicknameUpdatedAt || profile?.nicknameChangedAt || "",
    sellerGrade: profile?.sellerGrade || "BRONZE",
    completedOrderCount: Number(counts?.soldProductCount ?? counts?.completedOrderCount ?? 0),
    averageRating: null,
  };
}

const PRICE_PRESETS = [
  { label: "5만원 이하",  max: 50000 },
  { label: "10만원 이하", max: 100000 },
  { label: "20만원 이하", max: 200000 },
  { label: "30만원 이하", max: 300000 },
  { label: "50만원 이하", max: 500000 },
];

const PROFILE_TABS = [
  { key: "products",     label: "상품" },
  { key: "wishlist",     label: "위시리스트" },
  { key: "orders",       label: "구매 내역" },
  { key: "selling",     label: "판매 내역" },
  { key: "settlements",  label: "정산 내역" },
  { key: "reviews",      label: "리뷰" },
  { key: "inquiries",    label: "문의 내역" },
  { key: "refunds", label: "환불 내역" },
];

/* ── 사이드바 필터 ── */
function FilterSidebar({ filters, onApplyFilters }) {
  const [genderOpen, setGenderOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [draftExcludeSold, setDraftExcludeSold] = useState(filters.excludeSold);
  const [draftGender, setDraftGender] = useState(filters.gender);
  const [minInput, setMinInput] = useState(filters.priceMin ? String(filters.priceMin) : "");
  const [maxInput, setMaxInput] = useState(filters.priceMax ? String(filters.priceMax) : "");

  function applyPreset(max) {
    setMinInput("0");
    setMaxInput(String(max));
  }

  function handleApply() {
    const min = minInput === "" ? 0 : Number(minInput.replace(/,/g, ""));
    const max = maxInput === "" ? 0 : Number(maxInput.replace(/,/g, ""));
    onApplyFilters({
      excludeSold: draftExcludeSold,
      gender: draftGender,
      priceMin: min,
      priceMax: max,
    });
  }

  return (
    <aside className="up-sidebar">
      <p className="up-sidebar-title">필터</p>

      <div className="up-filter-check">
        <label>
          <input type="checkbox" checked={draftExcludeSold} onChange={(e) => setDraftExcludeSold(e.target.checked)} />
          품절 상품 제외
        </label>
      </div>

      <div className="up-filter-group">
        <button className="up-filter-head" onClick={() => setGenderOpen((o) => !o)}>
          성별 <span className={`up-filter-arrow ${genderOpen ? "open" : ""}`}>›</span>
        </button>
        {genderOpen && (
          <ul className="up-filter-list">
            {[
              { value: "all", label: "전체" },
              { value: "mens", label: "남성" },
              { value: "womens", label: "여성" },
            ].map(({ value, label }) => (
              <li key={value}>
                <label>
                  <input
                    type="radio"
                    name="up-gender-filter"
                    checked={draftGender === value}
                    onChange={() => setDraftGender(value)}
                  />
                  {label}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="up-filter-group">
        <button className="up-filter-head" onClick={() => setPriceOpen((o) => !o)}>
          가격 <span className={`up-filter-arrow ${priceOpen ? "open" : ""}`}>›</span>
        </button>
        {priceOpen && (
          <div className="up-price-body">
            <div className="up-price-range">
              <input
                className="up-price-input"
                type="number"
                placeholder="0"
                value={minInput}
                onChange={(e) => setMinInput(e.target.value)}
                min={0}
              />
              <span className="up-price-dash">-</span>
              <input
                className="up-price-input"
                type="number"
                placeholder="0"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                min={0}
              />
            </div>
            <ul className="up-price-presets">
              {PRICE_PRESETS.map(({ label, max }) => (
                <li key={max}>
                  <button className="up-price-preset-btn" onClick={() => applyPreset(max)}>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
            <button className="up-price-apply" onClick={handleApply}>적용</button>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── 상품 탭 ── */
function ProductsTab({ products, emptyMessage = "조건에 맞는 상품이 없습니다.", showOrderButton = false, orderIdMap = {} }) {
  const [filters, setFilters] = useState({
    excludeSold: false,
    gender: "all",
    priceMin: 0,
    priceMax: 0,
  });
  const [visible, setVisible] = useState(12);

  const filtered = products.map(normalizeProduct)
    .filter((p) => !filters.excludeSold || !p.isSold)
    .filter((p) => filters.gender === "all" || matchesGender(p, filters.gender))
    .filter((p) => filters.priceMin === 0 || p.price >= filters.priceMin)
    .filter((p) => filters.priceMax === 0 || p.price <= filters.priceMax);

  const shown = filtered.slice(0, visible);

  return (
    <div className="up-tab-layout">
      <FilterSidebar
        filters={filters}
        onApplyFilters={(nextFilters) => {
          setFilters(nextFilters);
          setVisible(12);
        }}
      />

      <div className="up-products-main">
        <div className="up-sort-row">
          <span className="up-count">전체 <strong>{filtered.length}</strong>개</span>
        </div>

        {filtered.length === 0 ? (
          <p className="up-empty">{emptyMessage}</p>
        ) : (
          <>
            <div className="up-product-grid">
              {shown.map((p) => (
                <article
                  key={p.productId}
                  className="up-card"
                  onClick={() => navigate(`/product/${p.productId}`)}
                >
                  <div className="up-card-img-wrap">
                    {getProductImageUrl(p) && (
                      <div className="product-visual">
                        <img className="product-image" src={getProductImageUrl(p)} alt={p.title} />
                      </div>
                    )}
                    {p.isSold && <div className="up-card-sold">SOLD</div>}
                    <div className="product-heart-btn" onClick={(e) => e.stopPropagation()}>
       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <span className="product-heart-count">{p.wishlistCount}</span>
</div>
                  </div>
                  <div className="up-card-body">
                    {(p.brandName || p.size) && (
                      <div className="up-card-meta">
                        {p.brandName && <span className="up-card-brand">{p.brandName}</span>}
                        {p.size && <span className="up-card-size">{p.size}</span>}
                      </div>
                    )}
                    <p className="up-card-name">{p.title}</p>
                    <p className="up-card-price">{p.price.toLocaleString()}원</p>
                    {showOrderButton && (
                      <button
                        style={{
                          marginTop: "8px",
                          width: "100%",
                          padding: "7px 0",
                          background: "#168f88",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          letterSpacing: "0.02em",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/order/detail/${orderIdMap[p.productId] ?? p.productId}`);
                        }}
                      >
                        주문 상세
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {visible < filtered.length && (
              <button className="up-load-more" onClick={() => setVisible((v) => v + 12)}>
                더 많은 상품 보기
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function isSoldProduct(product) {
  return Boolean(product?.isSold);
}

function matchesGender(product, gender) {
  const categoryCode = String(product?.categoryCode || "").toUpperCase();
  const categoryText = [
    categoryCode,
    product?.categoryName,
    product?.categoryPath,
  ].filter(Boolean).join(" ").toUpperCase();

  if (gender === "mens") {
    return categoryCode.startsWith("MENS") || categoryText.includes("남성") || categoryText.includes("맨즈");
  }

  if (gender === "womens") {
    return categoryCode.startsWith("WOMENS") || categoryText.includes("여성") || categoryText.includes("우먼");
  }

  return true;
}

/* ── 주문 내역 탭 ── */
function OrdersTab({ orders, onCancelOrder }) {
  const normalizedOrders = orders.map(normalizeOrder)
  .filter((o) => o.orderStatus !== 'CANCELLED');
  if (normalizedOrders.length === 0) return <p className="up-empty">주문 내역 정보가 없습니다.</p>;

  return (
    <div className="up-order-list up-buy-order-list">
      {normalizedOrders.map((order) => {
        const title = order.productTitle;
        const imageUrl = getProductImageUrl(order);

        return (
          <div key={order.orderId || order.productId} className="up-order-item up-buy-order-card">
            {imageUrl && (
              <div className="up-card-img-wrap up-order-img-wrap">
                <div className="product-visual">
                  <img className="product-image" src={imageUrl} alt={title} />
                </div>
              </div>
            )}
            <div className="up-order-info">
              <p className="up-order-title">{title}</p>
              <p className="up-order-meta">주문번호: {order.orderId || "-"}</p>
              <p className="up-order-meta">
              상태: {{ REQUESTED: '주문접수', PAID: '결제완료', SHIPPING: '배송중', DELIVERED: '배송완료', CANCELLED: '취소됨' }[order.orderStatus] || order.orderStatus || '-'}
              </p>
            </div>
            <div className="up-order-right">
              <p className="up-order-price">{formatWon(order.finalPrice)}</p>
              <button
                className="up-order-detail-btn"
                onClick={() => navigate(`/order/detail/${order.orderId}`)}
              >
                주문 상세
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── 내가 판매한 상품 탭 ── */

function SellingTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      fetchOrders(0, 50, 'SELL')
    .then((data) => {
      const filtered = toList(data)
        .map(normalizeOrder)
        .filter((o) => ['PAID', 'REQUESTED', 'SHIPPING', 'DELIVERED'].includes(o.orderStatus));
      setOrders(filtered);
      setLoading(false);
    })
    .catch(() => setLoading(false));
}, []);

  const STATUS_LABEL = {
    REQUESTED: '주문접수',
    PAID: '결제완료',
    SHIPPING: '배송중',
    DELIVERED: '배송완료',
    CANCELLED: '취소됨',
  };

  if (loading) return <p className="up-empty">불러오는 중...</p>;
  if (orders.length === 0) return <p className="up-empty">판매한 상품이 없습니다.</p>;

  return (
        <div className="up-product-grid">
      {orders.map((o) => {
        const imageUrl = getProductImageUrl(o);
        const isPaid = o.orderStatus === 'PAID';

        return (
     <article
  key={o.orderId || o.productId}
  className="up-card"
  onClick={() => navigate(`/product/${o.productId}`)}
>
  <div className="up-card-img-wrap">
    {imageUrl
      ? <div className="product-visual"><img className="product-image" src={imageUrl} alt={o.productTitle} /></div>
      : <div className="product-visual" style={{ background: '#eef2f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '12px' }}>NO IMAGE</div>
    }
    {o.orderStatus === 'DELIVERED' && <div className="up-card-sold">SOLD</div>}
  </div>
  <div className="up-card-body">
    <p className="up-card-name">{o.productTitle}</p>
    <p className="up-card-name" style={{ fontSize: '11px', color: '#69717d', fontWeight: 600 }}>주문번호: {o.orderId || '-'}</p>
    <p className="up-card-name" style={{ fontSize: '11px', color: '#69717d', fontWeight: 600 }}>상태: {STATUS_LABEL[o.orderStatus] || o.orderStatus || '-'}</p>
    <p className="up-card-price">{formatWon(o.finalPrice)}</p>

{o.orderStatus === 'PAID' && (
  <button
    style={{
      marginTop: '8px',
      width: '100%',
      padding: '7px 0',
      background: '#168f88',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 700,
      cursor: 'pointer',
    }}
    onClick={(e) => {
      e.stopPropagation();
      navigate(`/order/detail/${o.orderId}`);
    }}
  >
    주문 상세
  </button>
)}

   {o.orderStatus === 'REQUESTED' && (
  <button
    style={{
      marginTop: '8px',
      width: '100%',
      padding: '7px 0',
      background: '#168f88',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 700,
      cursor: 'pointer',
    }}
    onClick={(e) => {
      e.stopPropagation();
      navigate(`/order/detail/${o.orderId}`);
    }}
  >
    운송장 등록
  </button>
)}
{o.orderStatus === 'SHIPPING' && (
  <button
    style={{
      marginTop: '8px',
      width: '100%',
      padding: '7px 0',
      background: '#fff',
      color: '#168f88',
      border: '1.5px solid #168f88',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 700,
      cursor: 'pointer',
    }}
    onClick={(e) => {
      e.stopPropagation();
      navigate(`/order/detail/${o.orderId}`);
    }}
  >
    운송장 조회하기
  </button>
)}

  </div>
</article>
        );
      })}
    </div>
  );
}

/* ── 정산 내역 탭 ── */
  function SettlementTab({ settlements }) {
  
  const normalizedSettlements = settlements
  .map(normalizeSettlement)
  .filter((settlement) => ["SHIPPING", "DELIVERED"].includes(settlement.orderStatus));

  if (normalizedSettlements.length === 0) return <p className="up-empty">정산 내역 정보가 없습니다.</p>;

  const getSettlementLabel = (status) => {
    if (status === 'DELIVERED') return { text: '정산 완료', color: '#2e7d32', bg: '#e8f5e9' };
       if (status === 'SHIPPING') return { text: '정산 예정', color: '#1565c0', bg: '#e3f2fd' };
    return { text: '-', color: '#666', bg: '#f5f5f5' };
  };

  return (
    <div className="up-settlement-grid">
      {normalizedSettlements.map((s) => {
        const badge = getSettlementLabel(s.orderStatus);
        const imageUrl = getProductImageUrl(s);
        return (
          <article key={s.orderId || s.productId} className="up-settlement-card">
            <div
     className="up-settlement-img-wrap"
    onClick={() => s.productId && navigate(`/product/${s.productId}`)}
   style={{ cursor: s.productId ? 'pointer' : 'default' }}
  >
  {imageUrl ? (
    <img className="up-settlement-img" src={imageUrl} alt={s.productTitle} />
  ) : (
    <div className="up-settlement-no-img">NO IMAGE</div>
  )}
</div>

            <div className="up-settlement-body">
              <p className="up-settlement-title">{s.productTitle}</p>
              <p className="up-settlement-price">
                {s.orderStatus === 'DELIVERED' ? '정산 완료액' : '정산 예정액'} {formatWon(s.sellerSettlementAmount)}
              </p>
              <p className="up-settlement-meta">{s.createdAt || ""}</p>
              <p className="up-settlement-meta">수수료 {s.commission ?? 0}% · 결제금액 {formatWon(s.finalPrice)}</p>
              <span className="up-settlement-badge" style={{ background: badge.bg, color: badge.color }}>
                {badge.text}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ProfileEditModal({ seller, onClose, onSave }) {
  const fileInputRef = useRef(null);
  const nicknameAvailableDate = getNicknameAvailableDate(seller);
  const nicknameLocked = Boolean(nicknameAvailableDate);
  const [nickname, setNickname] = useState(seller.nickname || "");
  const [shopInfo, setShopInfo] = useState(seller.shopInfo || "");
  const [profilePreview, setProfilePreview] = useState(seller.profileImageUrl || "");
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreviewFailed, setProfilePreviewFailed] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const nicknameChanged = nickname.trim() !== (seller.nickname || "");
}

 function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
      alert("jpg/png 파일만 선택할 수 있습니다.");
      event.target.value = "";
      return;
    }

    if (file.size > PROFILE_IMAGE_MAX_SIZE) {
      alert("파일 크기 초과(최대 5MB)");
      event.target.value = "";
      return;
    }

    setProfilePreview(URL.createObjectURL(file));
    setProfilePreviewFailed(false);
    setProfileFile(file);
  }

  async function handleCheckNickname() {
    const value = nickname.trim();
    if (!value) {
      setNicknameMessage("닉네임을 입력해주세요.");
      setNicknameChecked(false);
      return;
    }

    if (!nicknameChanged) {
      setNicknameMessage("현재 사용 중인 닉네임입니다.");
      setNicknameChecked(true);
      return;
    }

    if (nicknameLocked) {
      setNicknameMessage(`${formatDate(nicknameAvailableDate)} 이후 변경할 수 있습니다.`);
      setNicknameChecked(false);
      return;
    }

    try {
      const result = await checkNickname(value);
      if (!result.available) {
        setNicknameMessage("이미 사용 중인 닉네임입니다.");
        setNicknameChecked(false);
        return;
      }
      setNicknameMessage("사용 가능한 닉네임입니다.");
      setNicknameChecked(true);
    } catch (error) {
      setNicknameMessage(error.message || "닉네임 중복 확인에 실패했습니다.");
      setNicknameChecked(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextNickname = nickname.trim();

    if (!nextNickname) {
      setNicknameMessage("닉네임을 입력해주세요.");
      return;
    }

    if (nicknameChanged && nicknameLocked) {
      setNicknameMessage(`${formatDate(nicknameAvailableDate)} 이후 변경할 수 있습니다.`);
      return;
    }
  }

/* ── 리뷰 탭 ── */
function ProfileSettingsModal({ seller, onClose, onSave }) {
  const fileInputRef = useRef(null);
  const [shopInfo, setShopInfo] = useState(seller.shopInfo || "");
  const [profilePreview, setProfilePreview] = useState(seller.profileImageUrl || "");
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreviewFailed, setProfilePreviewFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
      alert("jpg/png 파일만 선택할 수 있습니다.");
      event.target.value = "";
      return;
    }

    if (file.size > PROFILE_IMAGE_MAX_SIZE) {
      alert("파일 크기는 최대 5MB까지 가능합니다.");
      event.target.value = "";
      return;
    }

    setProfilePreview(URL.createObjectURL(file));
    setProfilePreviewFailed(false);
    setProfileFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      await onSave({
        shopInfo: shopInfo.trim(),
        profileFile,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="up-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="up-profile-modal" onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="up-modal-head">
          <h2>프로필 수정</h2>
          <button type="button" className="up-modal-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <button
          type="button"
          className="up-edit-avatar"
          onClick={() => fileInputRef.current?.click()}
          aria-label="프로필 이미지 선택"
        >
          {profilePreview && !profilePreviewFailed ? (
            <img src={profilePreview} alt="" onError={() => setProfilePreviewFailed(true)} />
          ) : (
            <span>{seller.nickname.charAt(0)}</span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="up-hidden-file"
          accept="image/jpeg,image/png"
          onChange={handleImageChange}
        />

        <label className="up-edit-field">
          <span>상점 정보</span>
          <textarea
            value={shopInfo}
            onChange={(event) => setShopInfo(event.target.value.slice(0, 500))}
            rows={5}
            maxLength={500}
            placeholder="상점 소개를 입력하세요."
          />
        </label>
        <p className="up-edit-help">{shopInfo.length}/500</p>

        <button type="submit" className="up-save-profile" disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </button>
      </form>
    </div>
  );
}

function ReviewsTab({ reviews, totalPages, page, setPage, rvLoading }) {
  return (
    <div className="up-reviews-wrap">
      {reviews.length === 0 && !rvLoading && (
        <p className="up-empty">아직 받은 리뷰가 없습니다.</p>
      )}

      <ul className="rv-list">
        {reviews.map((r) => (
          <li key={r.reviewId} className="rv-item">
            <div className="rv-item-header">
              <div className="rv-avatar">{r.buyerNickname.charAt(0)}</div>
              <div>
                <span className="rv-buyer">{r.buyerNickname}</span>
                <span className="rv-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              </div>
              <span className="rv-date">{new Date(r.createdAt).toLocaleDateString("ko-KR")}</span>
            </div>
            {r.content && <p className="rv-content">{r.content}</p>}
          </li>
        ))}
      </ul>

      {page < totalPages - 1 && (
        <button className="rv-load-more" onClick={() => setPage((p) => p + 1)} disabled={rvLoading}>
          {rvLoading ? "불러오는 중..." : "리뷰 더보기"}
        </button>
      )}
    </div>
  );
}

function InquiriesTab({
  inquiries,
  selectedInquiry,
  detailLoading,
  onSelectInquiry,
}) {
  if (inquiries.length === 0) {
    return <p className="up-empty">등록된 문의 내역이 없습니다.</p>;
  }

  return (
    <div className="up-inquiry-layout">
      <div className="up-inquiry-list" aria-label="1:1 문의 내역">
        {inquiries.map((inquiry) => (
          <button
            type="button"
            className={`up-inquiry-item ${selectedInquiry?.inquiryId === inquiry.inquiryId ? "active" : ""}`}
            key={inquiry.inquiryId}
            onClick={() => onSelectInquiry(inquiry.inquiryId)}
          >
            <span className="up-inquiry-category">{getInquiryCategoryLabel(inquiry.category)}</span>
            <strong>{inquiry.title}</strong>
            <span className={`up-inquiry-status ${inquiry.inquiryStatus === "ANSWERED" ? "answered" : ""}`}>
              {getInquiryStatusLabel(inquiry.inquiryStatus)}
            </span>
            <span className="up-inquiry-date">작성일 {formatDateTime(inquiry.createdAt)}</span>
            <span className="up-inquiry-date">답변일 {formatDateTime(inquiry.answeredAt)}</span>
          </button>
        ))}
      </div>

      <article className="up-inquiry-detail">
        {detailLoading && <p className="up-inquiry-placeholder">문의 상세를 불러오는 중...</p>}

        {!detailLoading && !selectedInquiry && (
          <p className="up-inquiry-placeholder">문의 항목을 선택하면 상세 내용을 확인할 수 있습니다.</p>
        )}

        {!detailLoading && selectedInquiry && (
          <>
            <div className="up-inquiry-detail-head">
              <span className="up-inquiry-category">{getInquiryCategoryLabel(selectedInquiry.category)}</span>
              <h2>{selectedInquiry.title}</h2>
              <span className={`up-inquiry-status ${selectedInquiry.inquiryStatus === "ANSWERED" ? "answered" : ""}`}>
                {getInquiryStatusLabel(selectedInquiry.inquiryStatus)}
              </span>
            </div>

            <dl className="up-inquiry-meta">
              <div>
                <dt>작성일</dt>
                <dd>{formatDateTime(selectedInquiry.createdAt)}</dd>
              </div>
              <div>
                <dt>답변일</dt>
                <dd>{formatDateTime(selectedInquiry.answeredAt)}</dd>
              </div>
            </dl>

            <section className="up-inquiry-section">
              <h3>문의 내용</h3>
              <p>{selectedInquiry.content || "-"}</p>
            </section>

            <section className="up-inquiry-section answer">
              <h3>답변 내용</h3>
              {selectedInquiry.inquiryStatus === "ANSWERED" && selectedInquiry.answerContent ? (
                <p>{selectedInquiry.answerContent}</p>
              ) : (
                <p className="up-inquiry-placeholder">아직 답변이 등록되지 않았습니다.</p>
              )}
            </section>
          </>
        )}
      </article>
    </div>
  );
}
function RefundTab({ refunds }) {
  if (refunds.length === 0)
    return <p className="up-empty">환불 내역이 없습니다.</p>;

  return (
    <div className="up-order-list up-buy-order-list">
      {refunds.map((order) => {
        const imageUrl = getProductImageUrl(order);
        return (
          <div key={order.orderId} className="up-order-item up-buy-order-card">
            {imageUrl && (
              <div className="up-card-img-wrap up-order-img-wrap">
                <div className="product-visual">
                  <img className="product-image" src={imageUrl} alt={order.productTitle} />
                </div>
              </div>
            )}
            <div className="up-order-info">
              <p className="up-order-title">{order.productTitle}</p>
              <p className="up-order-meta">주문번호: {order.orderId || "-"}</p>
              <p className="up-order-meta">결제금액: {formatWon(order.finalPrice)}</p>
              <p className="up-order-meta">취소일: {formatDate(order.cancelledAt)}</p>
            </div>
            <div className="up-order-right">
              <span style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
                background: "#fdecea",
                color: "#c62828",
              }}>
                환불완료
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyProfileTab({ label }) {
  return (
    <p className="up-empty">
      {label} 정보가 없습니다.
    </p>
  );
}

  // 정산 계좌 관리만
  function AccountTab() {
  const BANK_OPTIONS = [
    { value: "", label: "은행 선택" },
    { value: "KB", label: "KB국민" },
    { value: "SHINHAN", label: "신한" },
    { value: "WOORI", label: "우리" },
  ];

  const BANK_LABELS = { KB: "KB국민은행", SHINHAN: "신한은행", WOORI: "우리은행" };

  const [accountForm, setAccountForm] = useState({
    bankCode: "",
    accountNumber: "",
    depositorName: "",
  });
  const [savedAccount, setSavedAccount] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);

  useEffect(() => {
    fetchAccountInfo().then((data) => {
      if (data?.bankCode) {
        setSavedAccount({
          bankCode: data.bankCode,
          accountNumber: data.accountNumber,
          depositorName: data.depositorName,
        });
        setAccountForm({
          bankCode: data.bankCode,
          accountNumber: data.accountNumber || "",
          depositorName: data.depositorName || "",
        });
      } else {
        setIsEditing(true);
      }
    }).catch(() => { setIsEditing(true); });
  }, []);

  async function handleAccountSave() {
    if (!accountForm.bankCode || !accountForm.accountNumber || !accountForm.depositorName) {
      alert("모든 항목을 입력해주세요.");
      return;
    }
    setAccountLoading(true);
    try {
      await updateAccountInfo(accountForm);
      setSavedAccount({ ...accountForm });
      setAccountSaved(true);
      setIsEditing(false);
      setTimeout(() => setAccountSaved(false), 2000);
    } catch {
      alert("저장 실패. 다시 시도해주세요.");
    } finally {
      setAccountLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("계좌 정보를 삭제하시겠습니까?")) return;
    setAccountLoading(true);
    try {
      await updateAccountInfo({ bankCode: null, accountNumber: null, depositorName: null });
      setSavedAccount(null);
      setAccountForm({ bankCode: "", accountNumber: "", depositorName: "" });
      setIsEditing(true);
    } catch {
      alert("삭제 실패. 다시 시도해주세요.");
    } finally {
      setAccountLoading(false);
    }
  }

  return (
    <div className="up-account-tab">
      <section className="up-account-card">
        <h3>계좌 관리</h3>

        {savedAccount && !isEditing ? (
          <div className="up-account-saved">
            <div className="up-account-saved-info">
              <span className="up-account-bank-name">{BANK_LABELS[savedAccount.bankCode] || savedAccount.bankCode}</span>
            </div>
            <p className="up-account-number">{savedAccount.accountNumber} · {savedAccount.depositorName}</p>
            <div className="up-account-actions">
              <button
                className="up-account-edit-btn"
                onClick={() => setIsEditing(true)}
              >
                수정
              </button>
              <span className="up-account-divider">|</span>
              <button
                className="up-account-delete-btn"
                onClick={handleDelete}
                disabled={accountLoading}
              >
                삭제
              </button>
            </div>
          </div>
        ) : (
          <div className="up-account-form">
  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" }}>
    <tbody>
      <tr>
        <td style={{ width: "80px", color: "#555", fontSize: "13px", fontWeight: 600, paddingRight: "12px" }}>은행</td>
        <td>
          <select
            style={{ height: "36px", padding: "0 8px", border: "1px solid #cfd8e3", borderRadius: "6px", fontSize: "13px" }}
            value={accountForm.bankCode}
            onChange={(e) => setAccountForm({ ...accountForm, bankCode: e.target.value })}
          >
            {BANK_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </td>
      </tr>
      <tr>
        <td style={{ color: "#555", fontSize: "13px", fontWeight: 600, paddingRight: "12px" }}>계좌번호</td>
        <td>
          <input
            type="text"
            placeholder="계좌번호 입력"
            style={{ height: "36px", padding: "0 10px", border: "1px solid #cfd8e3", borderRadius: "6px", fontSize: "13px", width: "100%" }}
            value={accountForm.accountNumber}
            onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
          />
        </td>
      </tr>
      <tr>
        <td style={{ color: "#555", fontSize: "13px", fontWeight: 600, paddingRight: "12px" }}>예금주</td>
        <td>
          <input
            type="text"
            placeholder="예금주명 입력"
            style={{ height: "36px", padding: "0 10px", border: "1px solid #cfd8e3", borderRadius: "6px", fontSize: "13px", width: "100%" }}
            value={accountForm.depositorName}
            onChange={(e) => setAccountForm({ ...accountForm, depositorName: e.target.value })}
          />
        </td>
      </tr>
      <tr>
        <td></td>
        <td style={{ paddingTop: "6px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="up-btn-save"
              onClick={handleAccountSave}
              disabled={accountLoading}
              style={{ height: "36px", padding: "0 20px", background: "#168f88", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              {accountSaved ? "저장됨 ✓" : accountLoading ? "저장 중..." : "저장"}
            </button>
            {savedAccount && (
              <button
                className="up-account-cancel-btn"
                onClick={() => {
                  setAccountForm({ ...savedAccount });
                  setIsEditing(false);
                }}
                style={{ height: "36px", padding: "0 16px", border: "1px solid #d4d4d4", borderRadius: "6px", background: "#fff", color: "#333", fontSize: "13px", cursor: "pointer" }}
              >
                취소
              </button>
            )}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
        )}
      </section>
    </div>
  );
}

function WithdrawTab({ onWithdraw }) {
  return (
    <div className="up-account-tab">
      <section className="up-account-card">
        <div className="up-withdraw-box">
          <p className="up-withdraw-title">회원 탈퇴</p>
          <p className="up-withdraw-desc">
            회원 탈퇴 시 계정 상태가 탈퇴 처리되며, 다시 로그인할 수 없습니다.
          </p>
          <button
            type="button"
            className="up-withdraw-btn"
            onClick={onWithdraw}
          >
            회원 탈퇴
          </button>
        </div>
      </section>
    </div>
  );
}

/* ── 메인 페이지 ── */
function UserProfilePage({
  memberId,
  hideFooter = false,
  onNavigate,
  pathname = "/mypage",
}) {
  const [seller, setSeller] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sellOrderMap, setSellOrderMap] = useState({});
  const [tabLoading, setTabLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [rvLoading, setRvLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [toast, setToast] = useState("");
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const timerRef = useRef(null);
  const currentTab = hideFooter ? getTabFromPath(pathname) : activeTab;
  const profileTabs = hideFooter
    ? PROFILE_TABS
    : PROFILE_TABS.filter((tab) => tab.key !== "inquiries");

  function showToast(msg) {
    setToast(msg);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(""), 2400);
  }

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (hideFooter) {
        try {
          const profile = await fetchMyProfile();
          const home = await getUserHome(profile?.memberId || memberId);
          if (!ignore) {
            setSeller(mapProfileToSeller(home?.profile || profile, memberId, home));
          }
          // 리뷰 요약 (헤더용)
          try {
            const rvData = await getSellerReviews(profile?.memberId || memberId, 0, 1);
            const reviewPage = rvData?.reviews ?? rvData?.data?.reviews ?? {};
            if (!ignore) {
              setAvgRating(rvData?.averageRating ?? rvData?.data?.averageRating ?? null);
              setTotalElements(readTotalElements(reviewPage));
            }
        } catch (_) {}
        } catch (error) {
          if (!ignore) {
            showToast(error.message || "프로필 정보를 불러올 수 없습니다.");
            setSeller(mapProfileToSeller(null, memberId));
          }
        }
        return;
      }

      try {
        const [home, products] = await Promise.all([
          getUserHome(memberId),
          getSellerProducts(memberId),
        ]);
        if (!ignore) {
          setSeller(mapProfileToSeller(home?.profile, memberId, home));
          setSellerProducts(toList(products).map(normalizeProduct));
        }
      } catch (error) {
        if (!ignore) {
          showToast(error.message || "판매 상품을 불러올 수 없습니다.");
          setSeller({ memberId, nickname: memberId, sellerGrade: "BRONZE", completedOrderCount: 0, averageRating: null });
          setSellerProducts([]);
        }
      }
    }

    loadProfile();

    return () => {
      ignore = true;
      clearTimeout(timerRef.current);
    };
  }, [hideFooter, memberId]);

  useEffect(() => {
    if (hideFooter) {
      return;
    }

    async function resetReviews() {
      setPage(0);
      setReviews([]);
    }

    resetReviews();
  }, [hideFooter, memberId]);

  useEffect(() => {
    if (!hideFooter) return;

    let ignore = false;

    async function loadTabData() {
      try {
        setTabLoading(true);

        if (currentTab === "products") {
          const data = await fetchMyProducts(0, 15);
          if (!ignore) {
            const list = toList(data).map(normalizeProduct);
            setMyProducts(list);
            setSellerProducts(list);
          }
        }

        if (currentTab === "selling") {
          try {
            const sellData = await fetchOrders(0, 50, "SELL");
            if (!ignore) {
              const map = {};
              toList(sellData).forEach((o) => {
                if (o.productId && o.orderId) map[o.productId] = o.orderId;
              });
              setSellOrderMap(map);
            }
          } catch (_) { /* 맵 생성 실패 시 productId 그대로 사용 */ }
        }

        if (currentTab === "orders") {
          const data = await fetchOrders(0, 15, "BUY");
          if (!ignore) setOrders(toList(data)
          .map(normalizeOrder)
          .filter((o) => o.orderStatus !== 'CANCELLED')
        );
        }

        if (currentTab === "wishlist") {
          const data = await fetchWishlist(0, 15);
          if (!ignore) setWishlist(toList(data).map(normalizeProduct));
        }

        if (currentTab === "settlements") {
          const data = await fetchSettlements(0, 20);
          if (!ignore) setSettlements(toList(data).map(normalizeSettlement));
        }

        if (currentTab === "inquiries") {
          const data = await fetchMyInquiries(0, 10);
          if (!ignore) {
            setInquiries(toList(data).map(normalizeInquiry));
            setSelectedInquiry(null);
          }
        }
        if (currentTab === "refunds") {
          const data = await fetchOrders(0, 50, "BUY");
          if (!ignore) {
            setRefunds(
              toList(data)
              .map(normalizeOrder)
              .filter((o) => o.orderStatus === "CANCELLED" && o.previousStatus === "PAID")
              );
            }
          }
      } catch (error) {
        if (!ignore) {
          showToast(error.message || "목록을 불러올 수 없습니다.");
        }
      } finally {
        if (!ignore) setTabLoading(false);
      }
    }

    loadTabData();

    return () => {
      ignore = true;
    };
  }, [hideFooter, currentTab]);

  async function handleSelectInquiry(inquiryId) {
    if (!inquiryId) return;

    try {
      setDetailLoading(true);
      const data = await fetchMyInquiryDetail(inquiryId);
      setSelectedInquiry(normalizeInquiry(data));
    } catch (error) {
      showToast(error.message || "문의 상세를 불러올 수 없습니다.");
    } finally {
      setDetailLoading(false);
    }
  }
  async function handleCancelOrder(orderId) {
  if (!window.confirm("이 주문을 취소하시겠습니까?")) return;
  const session = JSON.parse(sessionStorage.getItem("nailed_session") || "null");
  const buyerId = session?.member_id ?? session?.memberId ?? null;
  if (!buyerId) { showToast("로그인이 필요합니다."); return; }
  try {
    const result = await cancelOrder(orderId, buyerId);
    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === orderId
          ? { ...o, orderStatus: "CANCELLED", cancelledAt: result.cancelledAt }
          : o
      )
    );
    showToast("주문이 취소되었습니다.");
  } catch (error) {
    showToast(error.message || "주문 취소에 실패했습니다.");
  }
};

  async function handleSaveProfile({ shopInfo, profileFile }) {
    try {
      let profileImageUrl = null;

      if (profileFile) {
        const result = await uploadMyProfileImage(profileFile);
        profileImageUrl = typeof result === "string" ? result : result?.data ?? result;
      }

      await updateMyProfile({
        shopInfo,
        ...(profileImageUrl && { profileImageUrl }),
      });

      alert("프로필이 수정되었습니다.");
      window.location.reload();
    } catch (error) {
      showToast(error.message || "프로필 수정에 실패했습니다.");
      throw error;
    }
  }

  async function handleWithdraw() {
    const firstConfirm = window.confirm(
      "정말 회원 탈퇴하시겠습니까?\n탈퇴 후 계정 복구가 어려울 수 있습니다."
    );
    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "회원 탈퇴를 진행하면 현재 계정으로 다시 로그인할 수 없습니다.\n정말 탈퇴하시겠습니까?"
    );
    if (!secondConfirm) return;

    try {
      await withdrawMe();

      sessionStorage.removeItem("nailed_session");
      sessionStorage.removeItem("accessToken");
      localStorage.removeItem("nailed_session");
      localStorage.removeItem("accessToken");

      alert("회원 탈퇴가 완료되었습니다.");
      window.location.href = "/";
    } catch (error) {
      showToast(error.message || "회원 탈퇴에 실패했습니다.");
    }
  }

  useEffect(() => {
    if (!memberId) return;
    if (hideFooter && currentTab !== "reviews") return;

    let ignore = false;

    async function loadReviews() {
      try {
        setRvLoading(true);
        const data = await getSellerReviews(memberId, page, 10);
        if (!ignore) {
          const reviewPage = data?.reviews ?? data?.data?.reviews ?? {};
          const nextReviews = toList(reviewPage);

          setAvgRating(data?.averageRating ?? data?.data?.averageRating ?? null);
          setReviews((prev) => page === 0 ? nextReviews : [...prev, ...nextReviews]);
          setTotalElements(readTotalElements(reviewPage));
          setTotalPages(readTotalPages(reviewPage));
        }
      } catch (error) {
        if (!ignore) {
          showToast(error.message || "리뷰를 불러올 수 없습니다.");
          setReviews([]);
          setTotalElements(0);
          setTotalPages(0);
          setAvgRating(null);
        }
      } finally {
        if (!ignore) setRvLoading(false);
      }
    }

    loadReviews();

    return () => {
      ignore = true;
    };
  }, [memberId, page, hideFooter, currentTab]);

  if (!seller) return (
    <>
      <Header />
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, border: "2.5px solid #e7e7e7", borderTopColor: "#151515", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      </div>
      <Footer />
    </>
  );

  const gradeClass = seller.sellerGrade.toLowerCase();

  return (
    <div className="up-page">
      <Header />

      {/* 프로필 헤더 */}
      <div className="up-profile-section">
        <div className="up-profile-inner">
          <div className="up-avatar">
            {seller.profileImageUrl ? (
              <img
                src={seller.profileImageUrl}
                alt={`${seller.nickname} 프로필`}
                onError={() => setSeller((prev) => prev ? { ...prev, profileImageUrl: "" } : prev)}
              />
            ) : (
              seller.nickname.charAt(0)
            )}
          </div>
          <div className="up-profile-info">
            <div className="up-name-row">
              <h1 className="up-nickname">{seller.nickname}</h1>
              <span className={`up-grade ${gradeClass}`}>{GRADE[seller.sellerGrade]}</span>
              {hideFooter && (
              <button type="button" className="up-profile-edit-btn"   onClick={() => setProfileEditOpen(true)}>
              프로필 수정
            </button>
              )}
            </div>
            <p className="up-handle">@{seller.memberId}</p>
            {seller.shopInfo && <p className="up-shop-info">{seller.shopInfo}</p>}
            <div className="up-stats">
              
               {seller.completedOrderCount > 0 && (
    <span>판매 완료 <strong>{seller.completedOrderCount}</strong>건</span>
  )}

              {totalElements > 0 && (
                <>
                  <span className="up-stats-dot">·</span>

                  <span>리뷰 <strong>{totalElements}</strong>건</span>
                </>
              )}
              {avgRating != null && (
                <>
                  <span className="up-stats-dot">·</span>
                  <span style={{ color: "#f5b400" }}>★</span>
                  <span><strong>{avgRating.toFixed(1)}</strong></span>
                </>
              )}
            </div>
          </div>
          {hideFooter && (
  <div className="up-profile-actions">
    <button
      type="button"
      className="up-profile-edit-btn"
      onClick={() => { if (onNavigate) onNavigate("/mypage/account"); }}
    >
      정산 계좌
    </button>
    <div style={{ position: "relative" }}>
      <button
        type="button"
        style={{
          background: "none",
          border: "1px solid #3e7261",
          borderRadius: "6px",
          padding: "2px 10px",
          cursor: "pointer",
          fontSize: "13px",
          color: "#555",
        }}
        onClick={(e) => {
          e.stopPropagation();
          const menu = e.currentTarget.nextSibling;
          menu.style.display = menu.style.display === "block" ? "none" : "block";
        }}
      >
        •••
      </button>
      <div
        style={{
          display: "none",
          position: "absolute",
          right: 0,
          top: "110%",
          background: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          zIndex: 100,
          minWidth: "120px",
          padding: "6px 0",
        }}
      >
        <button
          type="button"
          style={{
            display: "block",
            width: "100%",
            padding: "10px 16px",
            background: "none",
            border: "none",
            textAlign: "left",
            fontSize: "13px",
            color: "#e05c5c",
            cursor: "pointer",
            fontWeight: 600,
          }}
          onClick={() => { if (onNavigate) onNavigate("/mypage/withdraw"); }}
        >
          회원 탈퇴
        </button>
      </div>
    </div>
  </div>
)}
        </div>
      </div>

      {/* 탭 바 */}
      <div className="up-tabs-bar">
        <div className="up-tabs-inner">
          {profileTabs.map(({ key, label }) => (
            <button
              key={key}
              className={`up-tab ${currentTab === key ? "active" : ""}`}
              onClick={() => {
                if (hideFooter && onNavigate) {
                  onNavigate(getPathFromTab(key));
                  return;
                }

                setActiveTab(key);
              }}
            >
              {key === "reviews" && totalElements > 0 ? `${label} ${totalElements}` : label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="up-inner">
        {tabLoading && currentTab !== "reviews" && <p className="up-empty">불러오는 중...</p>}

        {!tabLoading && currentTab === "products" && (
          <ProductsTab
            products={hideFooter ? myProducts : sellerProducts}
            emptyMessage="상품 정보가 없습니다."
          />
        )}

        {/* hideFooter(마이페이지) 전용 탭들 */}
       {!tabLoading && hideFooter && currentTab === "orders" && <OrdersTab orders={orders} onCancelOrder={handleCancelOrder} />}
        {!tabLoading && hideFooter && currentTab === "selling" && <SellingTab />}
        {!tabLoading && hideFooter && currentTab === "wishlist" && (
          <ProductsTab
            products={wishlist}
            emptyMessage="찜 목록 정보가 없습니다."
          />
        )}
        {!tabLoading && hideFooter && currentTab === "settlements" && <SettlementTab settlements={settlements} />}
        {!tabLoading && hideFooter && currentTab === "inquiries" && (
          <InquiriesTab
            inquiries={inquiries}
            selectedInquiry={selectedInquiry}
            detailLoading={detailLoading}
            onSelectInquiry={handleSelectInquiry}
          />
        )}
        {!tabLoading && hideFooter && currentTab === "refunds" && (
         <RefundTab refunds={refunds} />
          )}
         {!tabLoading && hideFooter && currentTab === "account" && (
  <AccountTab />
)}
{!tabLoading && hideFooter && currentTab === "withdraw" && (
  <WithdrawTab onWithdraw={handleWithdraw} />
)}

        {currentTab === "reviews" && (
          <ReviewsTab
            reviews={reviews}
            totalPages={totalPages}
            page={page}
            setPage={setPage}
            rvLoading={rvLoading}
          />
        )}

        {/* selling, products, reviews, settlements 이외 탭은 EmptyProfileTab */}
        {!hideFooter &&
          currentTab !== "products" &&
          currentTab !== "reviews" &&
          currentTab !== "settlements" && (
            <EmptyProfileTab label={profileTabs.find((tab) => tab.key === currentTab)?.label ?? "선택한 탭"} />
          )}
      </div>

      {!hideFooter && <Footer />}

      {profileEditOpen && (
        <ProfileSettingsModal
          seller={seller}
          onClose={() => setProfileEditOpen(false)}
          onSave={handleSaveProfile}
        />
      )}

      {toast && <div className="pd-toast">{toast}</div>}
    </div>
  );
}

export default UserProfilePage;
