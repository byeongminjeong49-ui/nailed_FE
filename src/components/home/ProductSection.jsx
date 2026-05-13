import ProductCard from "./ProductCard";

function ProductSection({ title, products }) {
  return (
    <section className="product-section">
      <div className="section-heading">
        <h2>{title}</h2>
        <a href="/">더보기 ›</a>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.name} product={product} />
        ))}
      </div>
    </section>
  );
}

export default ProductSection;
