import { useEffect, useRef, useState } from "react";
import Footer from "../components/common/Footer";
import Header from "../components/common/Header";
import {
  fetchMyProfile,
  fetchMyProducts,
  fetchOrders,
  fetchSettlements,
  fetchWishlist,
} from "../api/myPageApi";
import { getProducts, getSellerProducts } from "../api/productApi";
import { getSellerReviews } from "../api/reviewApi";
import "../styles/review.css";
import "../styles/product-detail.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const GRADE = { BRONZE: "브론즈", SILVER: "실버", GOLD: "골드", DIAMOND: "다이아" };

const CATEGORIES = [
  { key: "menswear",    label: "Menswear" },
  { key: "womenswear",  label: "Womenswear" },
  { key: "luxury",      label: "Luxury" },
  { key: "accessories", label: "Accessories" },
  { key: "lifestyle",   label: "Lifestyle" },
  { key: "it-tech",     label: "IT/Tech" },
];

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
  return "products";
}

function getPathFromTab(tab) {
  if (tab === "orders") return "/mypage/orders";
  if (tab === "wishlist") return "/mypage/wishlist";
  if (tab === "selling") return "/mypage/selling";
  if (tab === "settlements") return "/mypage/settlements";
  if (tab === "reviews") return "/mypage/reviews";
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

function readTotalPages(data) {
  return Number(data?.totalPages ?? data?.data?.totalPages ?? 0);
}

function readTotalElements(data) {
  return Number(data?.totalElements ?? data?.data?.totalElements ?? 0);
}

function formatWon(value) {
  const amount = Number(value ?? 0);
  return `${amount.toLocaleString()}원`;
}

function normalizeProduct(product) {
  return {
    ...product,
    productId: product?.productId,
    title: product?.title || product?.productTitle || "상품명 없음",
    price: Number(product?.price ?? product?.finalPrice ?? 0),
    productStatus: product?.productStatus || product?.orderStatus || "",
    conditionLabel: product?.conditionLabel || product?.conditionCode || "",
    brandName: product?.brandName || "",
    wishlistCount: product?.wishlistCount ?? 0,
  };
}

function normalizeOrder(order) {
  return {
    ...order,
    orderId: order?.orderId || "",
    productId: order?.productId,
    productTitle: order?.productTitle || order?.title || "상품명 없음",
    finalPrice: Number(order?.finalPrice ?? order?.price ?? 0),
    orderStatus: order?.orderStatus || "",
    createdAt: order?.createdAt || "",
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
  };
}

function mapProfileToSeller(profile, fallbackMemberId) {
  const memberId = profile?.memberId || fallbackMemberId || "";
  return {
    memberId,
    userid: profile?.userid || "",
    nickname: profile?.nickname || profile?.userid || memberId || "회원",
    name: profile?.name || "",
    sellerGrade: profile?.sellerGrade || "BRONZE",
    completedOrderCount: 0,
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
  { key: "orders",       label: "주문 내역" },
  { key: "wishlist",     label: "위시리스트" },
  { key: "selling",      label: "내가 판매한 상품" },
  { key: "settlements",  label: "정산 내역" },
  { key: "reviews",      label: "리뷰" },
];

/* ── 사이드바 필터 ── */
function FilterSidebar({ excludeSold, setExcludeSold, selectedCats, setSelectedCats, onPriceApply }) {
  const [catOpen, setCatOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");

  function toggleCat(key) {
    setSelectedCats((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function applyPreset(max) {
    setMinInput("0");
    setMaxInput(String(max));
    onPriceApply(0, max);
  }

  function handleApply() {
    const min = minInput === "" ? 0 : Number(minInput.replace(/,/g, ""));
    const max = maxInput === "" ? 0 : Number(maxInput.replace(/,/g, ""));
    onPriceApply(min, max);
  }

  return (
    <aside className="up-sidebar">
      <p className="up-sidebar-title">필터</p>

      <div className="up-filter-check">
        <label>
          <input type="checkbox" checked={excludeSold} onChange={(e) => setExcludeSold(e.target.checked)} />
          품절 상품 제외
        </label>
      </div>

      <div className="up-filter-group">
        <button className="up-filter-head" onClick={() => setCatOpen((o) => !o)}>
          카테고리 <span className={`up-filter-arrow ${catOpen ? "open" : ""}`}>›</span>
        </button>
        {catOpen && (
          <ul className="up-filter-list">
            {CATEGORIES.map(({ key, label }) => (
              <li key={key}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedCats.includes(key)}
                    onChange={() => toggleCat(key)}
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
  const [excludeSold, setExcludeSold] = useState(false);
  const [selectedCats, setSelectedCats] = useState([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [visible, setVisible] = useState(12);

  const filtered = products.map(normalizeProduct)
    .filter((p) => !excludeSold || p.productStatus !== "SOLD")
    .filter((p) => selectedCats.length === 0 || selectedCats.some((k) => p.categoryName?.toLowerCase().includes(k)))
    .filter((p) => priceMin === 0 || p.price >= priceMin)
    .filter((p) => priceMax === 0 || p.price <= priceMax);

  const shown = filtered.slice(0, visible);

  return (
    <div className="up-tab-layout">
      <FilterSidebar
        excludeSold={excludeSold}
        setExcludeSold={setExcludeSold}
        selectedCats={selectedCats}
        setSelectedCats={setSelectedCats}
        onPriceApply={(min, max) => { setPriceMin(min); setPriceMax(max); setVisible(12); }}
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
                    {p.productStatus === "SOLD" && <div className="up-card-sold">SOLD</div>}
                    <button className="up-card-wish" aria-label="찜하기" onClick={(e) => e.stopPropagation()}>
                      ♡ {p.wishlistCount}
                    </button>
                  </div>
                  <div className="up-card-body">
                    <p className="up-card-brand">{p.brandName}</p>
                    <p className="up-card-name">{p.title}</p>
                    <p className="up-card-price">{p.price.toLocaleString()}원</p>
                    <div className="up-card-meta">
                      <span className="up-card-cond">{p.conditionLabel}</span>
                      {p.size && <span className="up-card-size">{p.size}</span>}
                    </div>
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
  return String(product?.productStatus || "").toUpperCase() === "SOLD";
}

/* ── 주문 내역 탭 ── */
function OrdersTab({ orders }) {
  const normalizedOrders = orders.map(normalizeOrder);

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
              {order.shippedAt && <p className="up-order-meta">배송중: {order.shippedAt}</p>}
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
        setOrders(toList(data).map(normalizeOrder));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="up-empty">불러오는 중...</p>;
  if (orders.length === 0) return <p className="up-empty">판매한 상품이 없습니다.</p>;

  return (
    <div className="up-order-list">
      {orders.map((o) => (
        <div key={o.orderId || o.productId} className="up-order-item">
          <div className="up-order-info">
            <p className="up-order-title">{o.productTitle}</p>
            <p className="up-order-meta">주문번호: {o.orderId || "-"}</p>
            <p className="up-order-meta">
              {formatWon(o.finalPrice)}
              {o.orderStatus ? ` · ${o.orderStatus}` : ""}
            </p>
            <p className="up-order-meta">{o.createdAt || ""}</p>
          </div>
          <div className="up-order-right">
            {o.orderStatus === 'PAID' && (
              <button
                style={{
                  padding: "8px 16px",
                  background: "#168f88",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/order/detail/${o.orderId}`)}
              >
                운송장 등록
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 정산 내역 탭 ── */
function SettlementTab({ settlements }) {
  const normalizedSettlements = settlements.map(normalizeSettlement);

  if (normalizedSettlements.length === 0) return <p className="up-empty">정산 내역 정보가 없습니다.</p>;

  const getSettlementLabel = (status) => {
    if (status === 'DELIVERED') return { text: '정산 완료', color: '#2e7d32', bg: '#e8f5e9' };
    return { text: '정산 예정', color: '#1565c0', bg: '#e3f2fd' };
  };

  return (
    <div className="up-settlement-grid">
      {normalizedSettlements.map((s) => {
        const badge = getSettlementLabel(s.orderStatus);
        const imageUrl = getProductImageUrl(s);
        return (
          <article key={s.orderId || s.productId} className="up-settlement-card">
            <div className="up-settlement-img-wrap">
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

/* ── 리뷰 탭 ── */
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

function EmptyProfileTab({ label }) {
  return (
    <p className="up-empty">
      {label} 정보가 없습니다.
    </p>
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
  const timerRef = useRef(null);
  const currentTab = hideFooter ? getTabFromPath(pathname) : activeTab;

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
          if (!ignore) {
            setSeller(mapProfileToSeller(profile, memberId));
          }
        } catch (error) {
          if (!ignore) {
            showToast(error.message || "프로필 정보를 불러올 수 없습니다.");
            setSeller(mapProfileToSeller(null, memberId));
          }
        }
        return;
      }

      try {
        const products = await getSellerProducts(memberId);
        if (!ignore) {
          setSeller({ memberId, nickname: memberId, sellerGrade: "BRONZE", completedOrderCount: 0, averageRating: null });
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

        if (currentTab === "products" || currentTab === "selling") {
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
          if (!ignore) setOrders(toList(data).map(normalizeOrder));
        }

        if (currentTab === "wishlist") {
          const data = await fetchWishlist(0, 15);
          if (!ignore) setWishlist(toList(data).map(normalizeProduct));
        }

        if (currentTab === "settlements") {
          const data = await fetchSettlements(0, 20);
          if (!ignore) setSettlements(toList(data).map(normalizeSettlement));
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
          <div className="up-avatar">{seller.nickname.charAt(0)}</div>
          <div className="up-profile-info">
            <div className="up-name-row">
              <h1 className="up-nickname">{seller.nickname}</h1>
              <span className={`up-grade ${gradeClass}`}>{GRADE[seller.sellerGrade]}</span>
            </div>
            <p className="up-handle">@{seller.memberId}</p>
            <div className="up-stats">
              <span>판매 <strong>{sellerProducts.length}</strong>건</span>
              <span className="up-stats-dot">·</span>
              <span>거래완료 <strong>{seller.completedOrderCount}</strong>건</span>
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
        </div>
      </div>

      {/* 탭 바 */}
      <div className="up-tabs-bar">
        <div className="up-tabs-inner">
          {PROFILE_TABS.map(({ key, label }) => (
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
            products={(hideFooter ? myProducts : sellerProducts).filter((product) => !isSoldProduct(product))}
            emptyMessage="상품 정보가 없습니다."
          />
        )}

        {/* hideFooter(마이페이지) 전용 탭들 */}
        {!tabLoading && hideFooter && currentTab === "selling" && (
          <ProductsTab
            products={myProducts.filter(isSoldProduct)}
            emptyMessage="판매 완료 상품 정보가 없습니다."
            showOrderButton
            orderIdMap={sellOrderMap}
          />
        )}
        {!tabLoading && hideFooter && currentTab === "orders" && <OrdersTab orders={orders} />}
        {!tabLoading && hideFooter && currentTab === "wishlist" && (
          <ProductsTab
            products={wishlist}
            emptyMessage="찜 목록 정보가 없습니다."
          />
        )}
        {!tabLoading && hideFooter && currentTab === "settlements" && <SettlementTab settlements={settlements} />}

        {/* 공개 프로필(비마이페이지)에서의 "내가 판매한 상품" 탭 */}
        {!tabLoading && !hideFooter && currentTab === "selling" && (
          <ProductsTab
            products={sellerProducts.filter(isSoldProduct)}
            emptyMessage="판매 완료 상품 정보가 없습니다."
          />
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
          currentTab !== "settlements" &&
          currentTab !== "selling" && (
            <EmptyProfileTab label={PROFILE_TABS.find((tab) => tab.key === currentTab)?.label ?? "선택한 탭"} />
          )}
      </div>

      {!hideFooter && <Footer />}

      {toast && <div className="pd-toast">{toast}</div>}
    </div>
  );
}

export default UserProfilePage;
