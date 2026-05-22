const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function ProductCard({ product }) {
  const productId = product.id || product.productId;
  const title = product.name || product.title || "";
  const price = product.price;
  const rawUrl = product.imageUrl || product.thumbnailUrl || null;
  const imageUrl = rawUrl && !rawUrl.startsWith("http") ? `${API_BASE}${rawUrl}` : rawUrl;
  const brandName = product.brandName || null;
  const size = product.size || null;

  return (
    <article className="product-card" onClick={() => navigate(`/product/${productId}`)}>
      <div className="product-visual">
        {imageUrl
          ? <img className="product-image" src={imageUrl} alt={title} />
          : <div className="product-no-img" />}
      </div>
      <div className="product-info">
        {brandName && (
          <div className="product-brand-row">
            <span className="product-brand-name">{brandName}</span>
            {size && <span className="product-size-tag">{size}</span>}
          </div>
        )}
        {!brandName && size && (
          <div className="product-brand-row">
            <span className="product-size-tag">{size}</span>
          </div>
        )}
        <p className="product-card-title">{title}</p>
        <p className="product-card-price">
          {typeof price === "number" ? price.toLocaleString() : price}원
        </p>
      </div>
    </article>
  );
}

export default ProductCard;
