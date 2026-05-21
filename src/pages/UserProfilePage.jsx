import { useEffect, useRef, useState } from "react";
import Footer from "../components/common/Footer";
import Header from "../components/common/Header";
import { fetchMyProfile, fetchSettlements } from "../api/myPageApi";
import { getProducts } from "../api/productApi";
import { getSellerReviews } from "../api/reviewApi";
import "../styles/review.css";
import "../styles/product-detail.css";

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

function getProductImageUrl(product) {
  if (product?.imageUrl) {
    return product.imageUrl;
  }

  if (Array.isArray(product?.imageUrls)) {
    return product.imageUrls.find(Boolean) ?? "";
  }

  return "";
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
  { key: "products", label: "상품" },
  { key: "orders", label: "주문 내역" },
  { key: "wishlist", label: "찜 목록" },
  { key: "selling", label: "내가 판매한 상품" },
  { key: "settlements", label: "정산 내역" },
  { key: "reviews", label: "리뷰" },
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
function ProductsTab({ products }) {
  const [excludeSold, setExcludeSold] = useState(false);
  const [selectedCats, setSelectedCats] = useState([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [visible, setVisible] = useState(12);

  const filtered = products
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
          <span className="up-sort-label">최신순</span>
        </div>

        {filtered.length === 0 ? (
          <p className="up-empty">조건에 맞는 상품이 없습니다.</p>
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

/* ── 정산 내역 탭 ── */
function SettlementTab() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettlements()
      .then((data) => {
        setSettlements(data.content ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="up-empty">불러오는 중...</p>;
  if (settlements.length === 0) return <p className="up-empty">정산 내역 정보가 없습니다.</p>;

  return (
    <div className="up-order-list">
      {settlements.map((s) => (
        <div key={s.orderId} className="up-order-item">
          <div className="up-order-info">
            <p className="up-order-title">{s.title}</p>
            <p className="up-order-meta">주문번호: {s.orderId}</p>
          </div>
          <div className="up-order-right">
            <p className="up-order-price">정산 예정액 {s.sellerSettlementAmount?.toLocaleString()}원</p>
            <p className="up-order-meta">수수료 {s.commission}% · 결제금액 {s.finalPrice?.toLocaleString()}원</p>
            <p className="up-order-status">{s.orderStatus}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 리뷰 탭 ── */
function ReviewsTab({ reviews, avgRating, totalElements, totalPages, page, setPage, rvLoading }) {
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star, count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="up-reviews-wrap">
      {avgRating != null && totalElements > 0 && (
        <div className="rv-summary">
          <div className="rv-avg-block">
            <span className="rv-avg-num">{avgRating.toFixed(1)}</span>
            <span className="rv-avg-stars">{"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}</span>
            <span className="rv-total">리뷰 {totalElements}건</span>
          </div>
          <div className="rv-bars">
            {ratingDist.map(({ star, count }) => (
              <div key={star} className="rv-bar-row">
                <span className="rv-bar-label">{star}점</span>
                <div className="rv-bar-bg">
                  <div className="rv-bar-fill" style={{ width: totalElements ? `${(count / totalElements) * 100}%` : "0%" }} />
                </div>
                <span className="rv-bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
function UserProfilePage({ memberId, hideFooter = false }) {
  const [seller, setSeller] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [rvLoading, setRvLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [toast, setToast] = useState("");
  const timerRef = useRef(null);

  function showToast(msg) {
    setToast(msg);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(""), 2400);
  }

  useEffect(() => {
    if (hideFooter) {
      let ignore = false;
      setSeller(null);
      setSellerProducts([]);
      fetchMyProfile()
        .then((profile) => {
          if (ignore) return;
          setSeller(mapProfileToSeller(profile, memberId));
        })
        .catch((error) => {
          if (ignore) return;
          showToast(error.message || "프로필 정보를 불러올 수 없습니다.");
          setSeller(mapProfileToSeller(null, memberId));
        });

      return () => {
        ignore = true;
        clearTimeout(timerRef.current);
      };
    }

    setSeller({ memberId, nickname: memberId, sellerGrade: "BRONZE", completedOrderCount: 0, averageRating: null });
    setSellerProducts(getProducts().filter((p) => p.seller?.memberId === memberId));
    return () => clearTimeout(timerRef.current);
  }, [hideFooter, memberId]);

  useEffect(() => {
    setRvLoading(true);
    getSellerReviews(memberId, page, 10).then((data) => {
      setAvgRating(data.averageRating);
      setReviews((prev) => page === 0 ? data.reviews.content : [...prev, ...data.reviews.content]);
      setTotalElements(data.reviews.totalElements);
      setTotalPages(data.reviews.totalPages);
    }).finally(() => setRvLoading(false));
  }, [memberId, page]);

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
          <div className="up-profile-actions">
            <button className="up-follow-btn" onClick={() => showToast("팔로우 기능은 준비 중입니다.")}>
              + 팔로우
            </button>
          </div>
        </div>
      </div>

      {/* 탭 바 */}
      <div className="up-tabs-bar">
        <div className="up-tabs-inner">
          {PROFILE_TABS.map(({ key, label }) => (
            <button
              key={key}
              className={`up-tab ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {key === "reviews" && totalElements > 0 ? `${label} ${totalElements}` : label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="up-inner">
        {activeTab === "products" && <ProductsTab products={sellerProducts} />}
        {activeTab === "settlements" && <SettlementTab />}
        {activeTab === "reviews" && (
          <ReviewsTab
            reviews={reviews}
            avgRating={avgRating}
            totalElements={totalElements}
            totalPages={totalPages}
            page={page}
            setPage={setPage}
            rvLoading={rvLoading}
          />
        )}
        {activeTab !== "products" && activeTab !== "reviews" && activeTab !== "settlements" && (
          <EmptyProfileTab label={PROFILE_TABS.find((tab) => tab.key === activeTab)?.label ?? "선택한 탭"} />
        )}
      </div>

      {!hideFooter && <Footer />}

      {toast && <div className="pd-toast">{toast}</div>}
    </div>
  );
}

export default UserProfilePage;
