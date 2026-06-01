import { useEffect, useRef, useState } from "react";
import Footer from "../components/common/Footer";
import Header from "../components/common/Header";
import ReportModal from "../components/ReportModal";
import { toBrandNameEn } from "../utils/brandName";
import { addWishlist, getProductDetail, getRandomProducts, getRelatedProducts, getSellerProducts, incrementViewCount, removeWishlist } from "../api/productApi";
import { categoryCodeToUrl } from "../data/categories";
import "../styles/product-detail.css";

const GRADE = { BRONZE: "브론즈", SILVER: "실버", GOLD: "골드", DIAMOND: "다이아" };
const STATUS = { ON_SALE: "판매중", SOLD: "판매완료" };
const CONDITION_SHORT = { S: "새제품", A: "거의 새것", B: "상태 좋음", C: "상태 보통", D: "사용감 많음" };

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

/* ── 갤러리 ── */
function getProductImageUrls(product) {
  if (Array.isArray(product?.imageUrls)) {
    return product.imageUrls.filter(Boolean);
  }

  return product?.imageUrl ? [product.imageUrl] : [];
}

function getProductImageUrl(product) {
  return getProductImageUrls(product)[0] ?? "";
}

function Gallery({ imageUrls, title, brandName, isSold }) {
  const [cur, setCur] = useState(0);
  const hasImages = imageUrls && imageUrls.length > 0;
  if (!hasImages) return null;

  const count = hasImages ? imageUrls.length : 1;
  const prev = () => setCur((c) => (c - 1 + count) % count);
  const next = () => setCur((c) => (c + 1) % count);

  return (
    <div className="pd-gallery">
      <div className="pd-gallery-main">
        <img src={imageUrls[cur]} alt={`${title} ${cur + 1}`} />
        {isSold && (
          <div className="pd-gallery-sold-overlay">
            <span>SOLD</span>
          </div>
        )}
        {hasImages && count > 1 && (
          <>
            <button className="pd-gallery-arrow pd-gallery-arrow-l" onClick={prev} aria-label="이전">‹</button>
            <button className="pd-gallery-arrow pd-gallery-arrow-r" onClick={next} aria-label="다음">›</button>
            <div className="pd-gallery-dots">
              {Array.from({ length: count }).map((_, i) => (
                <button key={i} className={`pd-dot ${i === cur ? "active" : ""}`} onClick={() => setCur(i)} aria-label={`${i + 1}번 이미지`} />
              ))}
            </div>
          </>
        )}
        {hasImages && count > 1 && (
          <span className="pd-gallery-counter">{cur + 1} / {count}</span>
        )}
      </div>
    </div>
  );
}

/* ── 상품 설명 (접기/펼치기) ── */
const DESC_MAX_HEIGHT = 140;

function DescriptionBox({ text }) {
  const [expanded, setExpanded] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) setOverflow(ref.current.scrollHeight > DESC_MAX_HEIGHT + 4);
  }, [text]);

  return (
    <div className="pd-desc-wrap">
      <div ref={ref} className="pd-desc" style={{ maxHeight: expanded ? "none" : DESC_MAX_HEIGHT, overflow: "hidden" }}>
        {text}
      </div>
      {overflow && (
        <button className="pd-desc-toggle" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "접기" : "더 보기"}
          <span className={`pd-desc-toggle-arrow ${expanded ? "up" : ""}`}>›</span>
        </button>
      )}
    </div>
  );
}

/* ── Nailed 인증 안심 거래 (접기/펼치기) ── */
function AccordionItem({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`pd-acc-item ${open ? "open" : ""}`}>
      <button className="pd-acc-head" onClick={() => setOpen((o) => !o)}>
        <span className="pd-acc-title">{title}</span>
        <span className="pd-acc-icon" aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && <div className="pd-acc-body">{children}</div>}
    </div>
  );
}

function SafeSection() {
  return (
    <section className="pd-accordion">
      <AccordionItem title="배송정보">
        <ul className="pd-safe-bullets">
          <li>상품은 판매자 측에서 직접 배송하며 평균적으로 2일 이내 배송이 시작됩니다.</li>
          <li>배송 상태는 Nailed 앱에서 확인 가능하고, 그 외 문의는 판매자에게 연락해 주시기 바랍니다.</li>
          <li>판매자와 연락이 되지 않는 경우, Nailed 고객센터로 문의해 주시면 확인 도와드리겠습니다.</li>
        </ul>
      </AccordionItem>
      <AccordionItem title="반품 및 환불 정책">
        <p className="pd-safe-para">판매자가 통신판매업자인 경우, 구매자의 반품 요청 시 협의를 진행해 주셔야 하니 상호 간 원만한 협의를 부탁드립니다.</p>
        <p className="pd-safe-para">중고거래 특성상, 개인 간 개인 거래는 반품이 원칙적으로 어렵습니다. 단, Nailed 안전결제를 이용하시면 아래 경우에는 반품 및 환불 진행을 도와드립니다.</p>
        <ul className="pd-safe-bullets">
          <li>받은 상품이 설명과 다른 경우</li>
          <li>구매한 상품이 배송되지 않은 경우</li>
        </ul>
        <p className="pd-safe-para pd-safe-warn">외부(계좌) 거래 시, Nailed 고객 지원이 불가능합니다.</p>
      </AccordionItem>
    </section>
  );
}

/* ── localStorage 최근 본 상품 ── */
const RECENTLY_VIEWED_KEY = "nailed_recently_viewed";

function saveRecentlyViewed(id) {
  try {
    const ids = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
    const updated = [String(id), ...ids.filter((x) => String(x) !== String(id))].slice(0, 10);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {}
}

function getRecentlyViewedIds(excludeId) {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]")
      .filter((id) => String(id) !== String(excludeId))
      .slice(0, 5);
  } catch {
    return [];
  }
}

/* ── 상품 미니카드 & 섹션 ── */
function ProductMiniCard({ product }) {
  const imgUrl = product.thumbnailUrl || getProductImageUrl(product);
  const brand = product.brandName ? toBrandNameEn(product.brandName) : null;
  const wishlistCount = product.wishlistCount ?? 0;
  const isSold = product.productStatus === "SOLD";
  return (
    <article className="product-card" onClick={() => navigate(`/product/${product.productId}`)}>
      <div className="product-visual">
        {imgUrl
          ? <img className="product-image" src={imgUrl} alt={product.title} />
          : <div className="product-no-img" />}
        {isSold && (
          <div className="product-card-sold-overlay">
            <span>SOLD</span>
          </div>
        )}
        <div className="product-heart-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span className="product-heart-count">{wishlistCount}</span>
        </div>
      </div>
      <div className="product-info">
        {brand && (
          <div className="product-brand-row">
            <span className="product-brand-name">{brand}</span>
            {product.size && <span className="product-size-tag">{product.size}</span>}
          </div>
        )}
        {!brand && product.size && (
          <div className="product-brand-row">
            <span className="product-size-tag">{product.size}</span>
          </div>
        )}
        <p className="product-card-title">{product.title}</p>
        <p className="product-card-price">{product.price?.toLocaleString()}원</p>
      </div>
    </article>
  );
}

function ProductRowSection({ title, products }) {
  if (!products || products.length === 0) return null;
  return (
    <section className="pd-row-section">
      <h2 className="pd-section-title">{title}</h2>
      <div className="pd-five-grid">
        {products.map((p) => <ProductMiniCard key={p.productId} product={p} />)}
      </div>
    </section>
  );
}

function ProductDetailPage({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishlisted, setWishlisted] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [toast, setToast] = useState("");
  const timerRef = useRef(null);

  const [sellerProducts, setSellerProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [randomProducts, setRandomProducts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const session = (() => { try { return JSON.parse(sessionStorage.getItem("nailed_session") ?? "null"); } catch { return null; } })();
  const currentMemberId = session?.member_id ?? session?.memberId ?? null;

  function showToast(msg) {
    setToast(msg);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(""), 2400);
  }

  useEffect(() => {
    setLoading(true);
    setWishlisted(false);
    setSellerProducts([]);
    setRecentProducts([]);
    setRandomProducts([]);
    setRelatedProducts([]);
    getProductDetail(productId)
      .then((data) => {
        setProduct(data);
        setWishlisted(!!data.isWishlisted);
        saveRecentlyViewed(productId);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    incrementViewCount(productId);
    return () => clearTimeout(timerRef.current);
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    getSellerProducts(product.seller.memberId, productId)
      .then((list) => setSellerProducts(list || []))
      .catch(() => {});
  }, [product?.seller?.memberId, productId]);

  useEffect(() => {
    if (!product) return;
    const ids = getRecentlyViewedIds(productId);
    if (ids.length === 0) return;
    Promise.all(ids.map((id) => getProductDetail(id).catch(() => null)))
      .then((results) => setRecentProducts(results.filter(Boolean)))
      .catch(() => {});
  }, [product, productId]);

  useEffect(() => {
    getRandomProducts(15)
      .then((list) => {
        const filtered = (list || []).filter((p) => String(p.productId) !== String(productId));
        setRandomProducts(filtered.slice(0, 15));
      })
      .catch(() => {});
  }, [productId]);

  useEffect(() => {
    getRelatedProducts(productId, 5)
      .then((list) => setRelatedProducts(list || []))
      .catch(() => {});
  }, [productId]);

  const handleWishlist = async () => {
    if (!currentMemberId) { navigate("/login"); return; }
    setWishLoading(true);
    try {
      if (wishlisted) {
        await removeWishlist(productId);
        setWishlisted(false);
        setProduct((p) => ({ ...p, wishlistCount: p.wishlistCount - 1 }));
      } else {
        try {
          await addWishlist(productId);
          setWishlisted(true);
          setProduct((p) => ({ ...p, wishlistCount: p.wishlistCount + 1 }));
          showToast("위시리스트에 추가했습니다.");
        } catch (e) {
          if (e.message && e.message.includes("이미 찜한 상품")) {
            setWishlisted(true);
            await removeWishlist(productId);
            setWishlisted(false);
            setProduct((p) => ({ ...p, wishlistCount: Math.max(0, p.wishlistCount - 1) }));
          } else {
            throw e;
          }
        }
      }
    } catch (e) { showToast(e.message); }
    finally { setWishLoading(false); }
  };

  if (loading) return (
    <>
      <Header />
      <div className="pd-loading"><div className="pd-spinner" /></div>
      <Footer />
    </>
  );

  if (error || !product) return (
    <>
      <Header />
      <div className="pd-error">
        <p>{error || "상품을 찾을 수 없습니다."}</p>
        <button className="more-button" onClick={() => window.history.back()}>뒤로가기</button>
      </div>
      <Footer />
    </>
  );

  const isMine = currentMemberId && currentMemberId === product.seller.memberId;
  const isSold = product.productStatus === "SOLD";
  const tags = product.hashtags ? product.hashtags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const gradeClass = product.seller.sellerGrade?.toLowerCase() ?? "bronze";
  const productImageUrls = getProductImageUrls(product);

  return (
    <div className="pd-page">
      <Header />
      <div className="pd-inner">


        {/* ── 메인 2단 ── */}
        <div className="pd-body">

          {/* 왼쪽: 갤러리 + 비슷한 상품 + 판매자 카드 */}
          <div className="pd-left-col">
            <Gallery imageUrls={productImageUrls} title={product.title} brandName={product.brandName} isSold={product.productStatus === "SOLD"} />

            {/* 비슷한 상품 (같은 카테고리) — 갤러리와 판매자 카드 사이 */}
            {relatedProducts.length > 0 && (
              <div className="pd-related-strip">
                <h3 className="pd-related-strip-title">비슷한 상품</h3>
                <div className="pd-related-thumbs">
                  {relatedProducts.slice(0, 4).map((p) => (
                    <button
                      key={p.productId}
                      className="pd-related-thumb"
                      onClick={() => navigate(`/product/${p.productId}`)}
                      aria-label={p.title}
                    >
                      {p.thumbnailUrl
                        ? <img src={p.thumbnailUrl} alt={p.title} />
                        : <div className="pd-related-thumb-noimg" />}
                    </button>
                  ))}
                  <button
                    className="pd-related-more-card"
                    onClick={() => navigate(categoryCodeToUrl(product.categoryCode))}
                  >
                    더보기
                  </button>
                </div>
              </div>
            )}

            <div className="pd-seller-card">
              <div className="pd-seller-avatar">
                {product.seller.profileImageUrl ? (
                  <img
                    src={product.seller.profileImageUrl}
                    alt={`${product.seller.nickname} 프로필`}
                  />
                ) : (
                  product.seller.nickname.charAt(0)
                )}
              </div>
              <div className="pd-seller-info">
                <span className="pd-seller-nickname">{product.seller.nickname}</span>
                <div className="pd-seller-sub">
                  <span className={`up-grade ${gradeClass}`}>{GRADE[product.seller.sellerGrade]}</span>
                  {product.seller.averageRating != null && (
                    <span className="pd-seller-rating">★ {product.seller.averageRating.toFixed(1)}</span>
                  )}
                  <span className="pd-seller-orders">거래 {product.seller.completedOrderCount}건</span>
                </div>
              </div>
              <button className="pd-seller-link" onClick={() => navigate(`/user/${product.seller.memberId}`)}>
                프로필 보기
              </button>
            </div>
          </div>

          {/* 오른쪽: 제목/가격/메타/설명/배송정보 */}
          <div className="pd-info">

            {product.brandName && <p className="pd-brand">{toBrandNameEn(product.brandName)}</p>}

            {/* 제목 + 찜/신고 */}
            <div className="pd-info-top">
              <h1 className="pd-title">{product.title}</h1>
              <div className="pd-info-icons">
                <button
                  className={`pd-icon-btn ${wishlisted ? "on" : ""}`}
                  onClick={handleWishlist}
                  disabled={wishLoading}
                  aria-label={wishlisted ? "찜 취소" : "찜하기"}
                >
                  <svg viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  {product.wishlistCount > 0 && <span>{product.wishlistCount}</span>}
                </button>
                {!isMine && (
                  <button
                    className="pd-icon-btn"
                    onClick={() => { if (!currentMemberId) { navigate("/login"); return; } setShowReport(true); }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                      <line x1="4" y1="22" x2="4" y2="15"/>
                    </svg>
                    <span>신고하기</span>
                  </button>
                )}
              </div>
            </div>

            {/* 가격 */}
            <p className="pd-price">{product.price.toLocaleString()}<span className="pd-price-won">원</span></p>

            {/* 사이즈 · 상태 태그 + 시간/찜 수 */}
            <div className="pd-meta-strip">
              <div className="pd-meta-pills">
                {product.size && <span className="pd-strip-pill pd-strip-pill--size">{product.size}</span>}
                {product.conditionCode && (
                  <span className="pd-strip-pill pd-strip-pill--cond">
                    {CONDITION_SHORT[product.conditionCode] || product.conditionDescription}
                  </span>
                )}
              </div>
              <div className="pd-meta-right">
                <span className="pd-meta-time-sm">{timeAgo(product.createdAt)}</span>
                <span className="pd-meta-dot">·</span>
                <span className="pd-meta-time-sm">조회 {product.viewCount}</span>
              </div>
            </div>

            {/* 안전결제 버튼 */}
            <div className="pd-actions">
              {isMine ? (
                <button className="pd-edit-btn" onClick={() => navigate(`/sell?edit=${product.productId}`)}>
                  수정하기
                </button>
              ) : (
                <button
                  className="pd-buy-btn"
                  onClick={() => {
                    if (!currentMemberId) { navigate('/login'); return; }
                    sessionStorage.setItem('pendingOrder', JSON.stringify({
                      productId:      product.productId,
                      sellerId:       product.seller.memberId,
                      buyerId:        currentMemberId,
                      productAmount:  product.price,
                      finalPrice:     product.price,
                      shippingFee:    product.shippingFee || 0,
                      title:          product.title,
                      imageUrl:       productImageUrls[0] ?? '',
                      sellerNickname: product.seller.nickname,
                      sellerBadge:    product.seller.sellerGrade,
                    }));
                    navigate('/order/form');
                  }}
                  disabled={isSold}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  {isSold ? "판매완료" : "Nailed 안전결제"}
                </button>
              )}
            </div>

            <hr className="pd-info-divider" />

            {/* 상품 설명 */}
            <DescriptionBox text={product.description} />

            {/* 카테고리 + 기간 */}
            <div className="pd-cat-breadcrumb-block">
              <span className="pd-cat-label">카테고리</span>
              <a
                href={categoryCodeToUrl(product.categoryCode)}
                className="pd-cat-breadcrumb"
                onClick={(e) => { e.preventDefault(); navigate(categoryCodeToUrl(product.categoryCode)); }}
              >
                {(product.categoryPath || product.categoryName)?.split(">").map((seg, i, arr) => (
                  <span key={i}>
                    <span className="pd-cat-seg">{seg.trim()}</span>
                    {i < arr.length - 1 && <span className="pd-cat-arrow"> &gt; </span>}
                  </span>
                ))}
              </a>
            </div>

            {/* 해시태그 */}
            {tags.length > 0 && (
              <div className="pd-hashtags">
                {tags.map((t) => <span key={t} className="pd-hashtag">#{t}</span>)}
              </div>
            )}

            {/* 배송정보 */}
            <div className="pd-detail-block">
              <h3 className="pd-detail-block-title">배송정보</h3>
              <div className="pd-ship-box">
                <div className="pd-ship-row">
                  <span className="pd-ship-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                  </span>
                  <span className="pd-ship-label">배송방법</span>
                  <span className="pd-ship-value">판매자 직접 배송</span>
                </div>
                <div className="pd-ship-row">
                  <span className="pd-ship-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                  </span>
                  <span className="pd-ship-label">배송비</span>
                  <span className="pd-ship-value">
                    {product.shippingFee > 0 ? `${product.shippingFee.toLocaleString()}원` : "무료"}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── 배송 / 환불 아코디언 ── */}
        <SafeSection />

        {/* ── 판매자의 다른 상품 ── */}
        <ProductRowSection
          title={`${product.seller.nickname}의 다른 상품`}
          products={sellerProducts}
        />

        {/* ── 최근 본 상품 ── */}
        <ProductRowSection title="최근 본 상품" products={recentProducts} />

        {/* ── 랜덤 추천 ── */}
        <ProductRowSection title="이런 상품은 어때요?" products={randomProducts} />

      </div>
      <Footer />

      {toast && <div className="pd-toast">{toast}</div>}
      {showReport && (
        <ReportModal
          targetMemberId={product.seller.memberId}
          targetNickname={product.seller.nickname}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

export default ProductDetailPage;
