function ProductCard({ product }) {
  return (
    <article className="product-card">
      <button className="wish-button" type="button" aria-label={`${product.name} 찜하기`}>
        ♡
      </button>
      <div className={`product-visual product-${product.type}`} aria-hidden="true">
        <span />
        <i />
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
    </article>
  );
}

export default ProductCard;
