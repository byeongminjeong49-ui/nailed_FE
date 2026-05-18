function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function ProductCard({ link, product }) {
  const href = product.id ? `/product/${product.id}` : (link ?? "#");

  const handleClick = (e) => {
    e.preventDefault();
    navigate(href);
  };

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
      <a className="product-card-link" href={href} onClick={handleClick}>
        {cardContent}
      </a>
    </article>
  );
}

export default ProductCard;
