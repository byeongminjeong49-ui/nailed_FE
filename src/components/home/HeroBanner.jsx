import { useEffect, useState } from "react";
import { banners } from "../../data/bannerData";

const SLIDE_INTERVAL_MS = 5000;

function HeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasBanners = banners.length > 0;
  const activeBanner = hasBanners ? banners[activeIndex] : null;

  const moveSlide = (direction) => {
    if (banners.length <= 1) {
      return;
    }

    setActiveIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;

      if (nextIndex < 0) {
        return banners.length - 1;
      }

      if (nextIndex >= banners.length) {
        return 0;
      }

      return nextIndex;
    });
  };

  useEffect(() => {
    if (banners.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      moveSlide(1);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  if (!activeBanner) {
    return (
      <section className="hero-banner" aria-label="메인 프로모션">
        <div className="hero-copy">
          <p>NAILED</p>
          <h1>COMING SOON</h1>
          <span>배너를 준비 중입니다.</span>
        </div>
      </section>
    );
  }

  return (
    <section className={`hero-banner hero-banner-${activeBanner.theme}`} aria-label="메인 프로모션">
      <button
        className="hero-arrow hero-arrow-left"
        type="button"
        aria-label="이전 배너"
        onClick={() => moveSlide(-1)}
      >
        ‹
      </button>
      <div className="hero-product" aria-hidden="true">
        <span className="hanger" />
        <span className="coat coat-back" />
        <span className="coat coat-front">
          <i />
        </span>
      </div>
      <div className="hero-copy">
        <p>{activeBanner.brand}</p>
        <h1>{activeBanner.title}</h1>
        <span>{activeBanner.description}</span>
        <a href={activeBanner.link}>{activeBanner.cta}</a>
      </div>
      <div className="hero-dots" aria-label="배너 페이지">
        {banners.map((banner, index) => (
          <button
            className={index === activeIndex ? "active" : ""}
            key={banner.id}
            type="button"
            aria-label={`${index + 1}번 배너`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
      <button
        className="hero-arrow hero-arrow-right"
        type="button"
        aria-label="다음 배너"
        onClick={() => moveSlide(1)}
      >
        ›
      </button>
    </section>
  );
}

export default HeroBanner;
