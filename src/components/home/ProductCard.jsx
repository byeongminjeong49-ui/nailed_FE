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

function ProductCard({ link, product }) {
  const href = product.id ? `/product/${product.id}` : (link ?? "#");
  const imageUrl = getProductImageUrl(product);

  const handleClick = (e) => {
    e.preventDefault();
    navigate(href);
  };

  const cardContent = (
    <>
      {imageUrl && (
        <div className="product-visual">
          <img className="product-image" src={imageUrl} alt="" />
        </div>
      )}
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
