import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

function ReadyPage({ title }) {
  return (
    <div className="home-page">
      <Header />
      <main className="home-content">
        <section className="product-section">
          <div className="section-heading">
            <h2>{title}</h2>
          </div>
          <p>현재 준비 중인 페이지입니다.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default ReadyPage;
