function HeroBanner() {
  return (
    <section className="hero-banner" aria-label="메인 프로모션">
      <button className="hero-arrow hero-arrow-left" type="button" aria-label="이전 배너">
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
        <p>STONE ISLAND</p>
        <h1>24FW COLLECTION</h1>
        <span>아이코닉한 디자인, 혁신적인 소재</span>
        <a href="/">컬렉션 보러가기</a>
      </div>
      <div className="hero-dots" aria-label="배너 페이지">
        <button className="active" type="button" aria-label="1번 배너" />
        <button type="button" aria-label="2번 배너" />
        <button type="button" aria-label="3번 배너" />
        <button type="button" aria-label="4번 배너" />
        <button type="button" aria-label="5번 배너" />
      </div>
      <button className="hero-arrow hero-arrow-right" type="button" aria-label="다음 배너">
        ›
      </button>
    </section>
  );
}

export default HeroBanner;
