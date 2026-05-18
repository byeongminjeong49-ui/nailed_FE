import { useEffect, useRef, useState } from "react";
import Footer from "../components/common/Footer";
import Header from "../components/common/Header";
import ReportModal from "../components/ReportModal";
import { addWishlist, getProductDetail, incrementViewCount, removeWishlist } from "../api/productApi";
import { getSellerReviews } from "../api/reviewApi";
import "../styles/product-detail.css";

const GRADE = { BRONZE: "브론즈", SILVER: "실버", GOLD: "골드", DIAMOND: "다이아" };
const STATUS = { ON_SALE: "판매중", SOLD: "판매완료" };

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
function Gallery({ imageUrls, title, brandName }) {
  const [cur, setCur] = useState(0);
  const hasImages = imageUrls && imageUrls.length > 0;
  const count = hasImages ? imageUrls.length : 1;
  const prev = () => setCur((c) => (c - 1 + count) % count);
  const next = () => setCur((c) => (c + 1) % count);

  return (
    <div className="pd-gallery">
      <div className="pd-gallery-main">
        {hasImages ? (
          <img src={imageUrls[cur]} alt={`${title} ${cur + 1}`} />
        ) : (
          <div className="pd-gallery-placeholder">
            <span className="pd-gallery-placeholder-initial">{(brandName || title || "N").charAt(0)}</span>
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
      {hasImages && count > 1 && (
        <div className="pd-gallery-thumbs">
          {imageUrls.map((url, i) => (
            <button key={i} className={`pd-thumb ${i === cur ? "active" : ""}`} onClick={() => setCur(i)}>
              <img src={url} alt={`썸네일 ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
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
      <AccordionItem title="Nailed 인증 안심 거래">
        <div className="pd-safe-box">
          <div className="pd-safe-icons">
            <div className="pd-safe-icon-item">
              <span className="pd-safe-icon-circle">🔍</span>
              <span>전문 검수</span>
            </div>
            <div className="pd-safe-icon-item">
              <span className="pd-safe-icon-circle">🛡️</span>
              <span>200% 보상</span>
            </div>
            <div className="pd-safe-icon-item">
              <span className="pd-safe-icon-circle">↩️</span>
              <span>교환·환불</span>
            </div>
          </div>
          <ul className="pd-safe-bullets">
            <li>Nailed이 꼼꼼하게 검수한 하자 없는 고퀄리티 의류입니다.</li>
            <li>정품이 아닌 경우 Nailed이 200% 보상해 드립니다.</li>
            <li>인증 중고 의류 상품은 교환·환불이 가능합니다.</li>
          </ul>
        </div>
      </AccordionItem>
      <AccordionItem title="배송 정보">
        <ul className="pd-safe-bullets">
          <li>판매자가 결제 확인 후 1~3일 이내에 발송합니다.</li>
          <li>배송은 영업일 기준 평균 2~4일 소요됩니다.</li>
          <li>제주·도서 산간 지역은 추가 배송비가 발생할 수 있습니다.</li>
        </ul>
      </AccordionItem>
      <AccordionItem title="반품 및 환불 정책">
        <ul className="pd-safe-bullets">
          <li>상품 수령 후 7일 이내에 반품 신청이 가능합니다.</li>
          <li>단순 변심에 의한 반품 배송비는 구매자가 부담합니다.</li>
          <li>상품 하자·오배송의 경우 Nailed이 전액 보상합니다.</li>
        </ul>
      </AccordionItem>
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
  const [avgRating, setAvgRating] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [toast, setToast] = useState("");
  const timerRef = useRef(null);

  const session = (() => { try { return JSON.parse(localStorage.getItem("nailed_session") ?? "null"); } catch { return null; } })();
  const currentMemberId = session?.member_id ?? null;

  function showToast(msg) {
    setToast(msg);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(""), 2400);
  }

  useEffect(() => {
    setLoading(true);
    getProductDetail(productId)
      .then((data) => {
        setProduct(data);
        setWishlisted(data.isWishlisted);
        return getSellerReviews(data.seller.memberId, 0, 100);
      })
      .then((rv) => {
        setAvgRating(rv.averageRating);
        setReviewCount(rv.reviews.totalElements);
        setReviews(rv.reviews.content);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    incrementViewCount(productId);
    return () => clearTimeout(timerRef.current);
  }, [productId]);

  const handleWishlist = async () => {
    if (!currentMemberId) { navigate("/login"); return; }
    setWishLoading(true);
    try {
      if (wishlisted) {
        await removeWishlist(productId);
        setWishlisted(false);
        setProduct((p) => ({ ...p, wishlistCount: p.wishlistCount - 1 }));
        showToast("찜 목록에서 제거했습니다.");
      } else {
        await addWishlist(productId);
        setWishlisted(true);
        setProduct((p) => ({ ...p, wishlistCount: p.wishlistCount + 1 }));
        showToast("찜 목록에 추가했습니다.");
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
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star, count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="pd-page">
      <Header />
      <div className="pd-inner">

        {/* 빵가루 */}
        <nav className="pd-breadcrumb" aria-label="경로">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>홈</a>
          <span aria-hidden>›</span>
          <a href={`/category/${product.categoryName}`} onClick={(e) => { e.preventDefault(); navigate(`/category/${product.categoryName}`); }}>{product.categoryName}</a>
          <span aria-hidden>›</span>
          <span>{product.title}</span>
        </nav>

        {/* ── 메인 2단 ── */}
        <div className="pd-body">

          {/* 왼쪽: 갤러리 + 판매자 카드 */}
          <div className="pd-left-col">
            <Gallery imageUrls={product.imageUrls} title={product.title} brandName={product.brandName} />

            <div className="pd-seller-card">
              <div className="pd-seller-avatar">{product.seller.nickname.charAt(0)}</div>
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

          {/* 오른쪽: 브랜드/제목/가격/메타/설명/해시태그/CTA */}
          <div className="pd-info">

            {/* 브랜드 + 액션 (찜/공유/신고) */}
            <div className="pd-info-top">
              <span className="pd-brand">{product.brandName}</span>
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

            <h1 className="pd-title">{product.title}</h1>
            <p className="pd-price">{product.price.toLocaleString()}<span className="pd-price-won">원</span></p>

            {/* 상태 배지 + 메타 */}
            <div className="pd-meta-row">
              {product.productStatus !== "ON_SALE" && (
                <span className={`pd-status-badge ${product.productStatus === "SOLD" ? "sold" : "reserved"}`}>
                  {STATUS[product.productStatus]}
                </span>
              )}
              <span className="pd-meta-item">{timeAgo(product.createdAt)}</span>
              <span className="pd-meta-dot">·</span>
              <span className="pd-meta-item">조회 {product.viewCount}</span>
            </div>

            <hr className="pd-info-divider" />

            {/* 상품 설명 */}
            <DescriptionBox text={product.description} />

            {/* 해시태그 */}
            {tags.length > 0 && (
              <div className="pd-hashtags">
                {tags.map((t) => <span key={t} className="pd-hashtag">#{t}</span>)}
              </div>
            )}

            {/* 카테고리 링크 + 시간 (레퍼런스 스타일) */}
            <div className="pd-info-footer">
              <a
                href={`/category/${product.categoryName}`}
                className="pd-cat-link"
                onClick={(e) => { e.preventDefault(); navigate(`/category/${product.categoryName}`); }}
              >
                {product.categoryName}
                {product.size && <> &gt; {product.size}</>}
              </a>
              <span className="pd-info-time">{timeAgo(product.createdAt)}</span>
            </div>

            {/* 하단 CTA */}
<div className="pd-actions">
  {isMine ? (
    <button className="pd-edit-btn" onClick={() => showToast("상품 수정 기능은 준비 중입니다.")}>
      수정하기
    </button>
  ) : (
    <button
      className="pd-buy-btn"
      onClick={() => {
        if (!currentMemberId) { navigate('/login'); return; }
        sessionStorage.setItem('pendingOrder', JSON.stringify({
          productId:     product.productId,
          sellerId:      product.seller.memberId,
          buyerId:       currentMemberId,
          productAmount: product.price,
          finalPrice:    product.price,
          shippingFee:   0,
          title:         product.title,
        }));
        navigate('/order/form');
      }}
      disabled={isSold}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      {isSold ? "판매완료" : "Nailed 안전결제"}
    </button>
  )}
</div>
          </div>
        </div>

        {/* ── 상품 정보 테이블 ── */}
        <hr className="pd-divider" />
        <section className="pd-section">
          <h2 className="pd-section-title">상품 정보</h2>
          <table className="pd-meta-table">
            <tbody>
              <tr><td>상태</td><td>{product.conditionDescription}</td></tr>
              {product.brandName && <tr><td>브랜드</td><td>{product.brandName}</td></tr>}
              <tr><td>카테고리</td><td>{product.categoryName}</td></tr>
              {product.size && <tr><td>사이즈</td><td>{product.size}</td></tr>}
              <tr><td>배송</td><td>{product.shippingMethod === "DELIVERY" ? "택배" : product.shippingMethod}</td></tr>
              <tr><td>조회수</td><td>{product.viewCount.toLocaleString()}</td></tr>
            </tbody>
          </table>
        </section>

        {/* ── 안심 거래 / 배송 / 환불 아코디언 ── */}
        {!isMine && !isSold && (
          <>
            <hr className="pd-divider" />
            <SafeSection />
          </>
        )}

        {/* ── 판매자 리뷰 ── */}
        {reviewCount > 0 && (
          <>
            <hr className="pd-divider" />
            <section className="pd-section">
              <div className="pd-section-title-row">
                <h2 className="pd-section-title">판매자 리뷰</h2>
                <button className="pd-section-link" onClick={() => navigate(`/user/${product.seller.memberId}`)}>
                  전체 보기 ›
                </button>
              </div>

              {avgRating != null && (
                <div className="pd-rv-summary">
                  <div className="pd-rv-avg-block">
                    <span className="pd-rv-avg-num">{avgRating.toFixed(1)}</span>
                    <span className="pd-rv-stars">{"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}</span>
                    <span className="pd-rv-total">리뷰 {reviewCount}건</span>
                  </div>
                  <div className="pd-rv-bars">
                    {ratingDist.map(({ star, count }) => (
                      <div key={star} className="pd-rv-bar-row">
                        <span className="pd-rv-bar-label">{star}점</span>
                        <div className="pd-rv-bar-bg">
                          <div className="pd-rv-bar-fill" style={{ width: reviewCount ? `${(count / reviewCount) * 100}%` : "0%" }} />
                        </div>
                        <span className="pd-rv-bar-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <ul className="pd-rv-list">
                {reviews.slice(0, 3).map((r) => (
                  <li key={r.reviewId} className="pd-rv-item">
                    <div className="pd-rv-header">
                      <div className="pd-rv-avatar">{r.buyerNickname.charAt(0)}</div>
                      <div className="pd-rv-meta">
                        <span className="pd-rv-buyer">{r.buyerNickname}</span>
                        <span className="pd-rv-stars-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                      </div>
                      <span className="pd-rv-date">{new Date(r.createdAt).toLocaleDateString("ko-KR")}</span>
                    </div>
                    {r.content && <p className="pd-rv-content">{r.content}</p>}
                  </li>
                ))}
              </ul>

              {reviewCount > 3 && (
                <button className="pd-rv-more" onClick={() => navigate(`/user/${product.seller.memberId}`)}>
                  리뷰 {reviewCount}개 전체 보기 ›
                </button>
              )}
            </section>
          </>
        )}

        {/* ── 같은 카테고리 상품 ── */}
        {product.related?.length > 0 && (
          <>
            <hr className="pd-divider" />
            <section className="pd-section">
              <h2 className="pd-section-title">비슷한 상품</h2>
              <div className="pd-related-grid">
                {product.related.map((r) => (
                  <button key={r.productId} className="pd-related-card" onClick={() => navigate(`/product/${r.productId}`)}>
                    <div className="pd-related-img">
                      {r.imageUrls?.[0]
                        ? <img src={r.imageUrls[0]} alt={r.title} />
                        : <span className="pd-related-placeholder">{(r.brandName || r.title || "N").charAt(0)}</span>
                      }
                    </div>
                    <div className="pd-related-body">
                      {r.brandName && <p className="pd-related-brand">{r.brandName}</p>}
                      <p className="pd-related-name">{r.title}</p>
                      <p className="pd-related-price">{r.price.toLocaleString()}원</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

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
