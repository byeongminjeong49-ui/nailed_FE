import { useEffect, useState } from "react";
import { banners } from "../../data/bannerData";

const SLIDE_INTERVAL_MS = 5000;

function getBannerImageUrl(banner) {
  if (banner?.imageUrl) {
    return banner.imageUrl;
  }

  if (Array.isArray(banner?.imageUrls)) {
    return banner.imageUrls.find(Boolean) ?? "";
  }

  return "";
}

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
    return null;
  }

  return (
    <section className="hero-banner" aria-label="硫붿씤 ?꾨줈紐⑥뀡">
      <button
        className="hero-arrow hero-arrow-left"
        type="button"
        aria-label="?댁쟾 諛곕꼫"
        onClick={() => moveSlide(-1)}
      >
        ??
      </button>
      {getBannerImageUrl(activeBanner) && (
        <img className="hero-image" src={getBannerImageUrl(activeBanner)} alt="" />
      )}
      <div className="hero-copy">
        <p>{activeBanner.brand}</p>
        <h1>{activeBanner.title}</h1>
        <span>{activeBanner.description}</span>
        <a href={activeBanner.link}>{activeBanner.cta}</a>
      </div>
      <div className="hero-dots" aria-label="諛곕꼫 ?섏씠吏">
        {banners.map((banner, index) => (
          <button
            className={index === activeIndex ? "active" : ""}
            key={banner.id}
            type="button"
            aria-label={`${index + 1}踰?諛곕꼫`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
      <button
        className="hero-arrow hero-arrow-right"
        type="button"
        aria-label="?ㅼ쓬 諛곕꼫"
        onClick={() => moveSlide(1)}
      >
        ??
      </button>
    </section>
  );
}

export default HeroBanner;


