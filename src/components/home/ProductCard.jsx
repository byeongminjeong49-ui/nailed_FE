function ProductCard({ link, product }) {
  const cardContent = (
    <>
      <div className={`product-visual product-${product.type}`} aria-hidden="true">
        {product.imageUrl ? (
          <img className="product-image" src={product.imageUrl} alt="" />
        ) : (
          <>
            <span />
            <i />
          </>
        )}
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <strong>{product.price}</strong>
        <div className="product-meta">
          <span className="seller-icon" aria-hidden="true" />
          <span>{product.seller}</span>
          <span className="like-count">♡ {product.likes}</span>
        </div>
      </div>
    </>
  );

  return (
    <article className="product-card">
      <button className="wish-button" type="button" aria-label={`${product.name} 찜하기`}>
        ♡
      </button>
      {link ? (
        // TODO: 상품 상세페이지 구현 후 IA 기준 상세 URL로 교체
        <a className="product-card-link" href={link}>
          {cardContent}
        </a>
      ) : (
        cardContent
      )}
    </article>
  );
}

export default ProductCard;
