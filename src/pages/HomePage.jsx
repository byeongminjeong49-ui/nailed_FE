import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import HeroBanner from "../components/home/HeroBanner";

function HomePage() {
  return (
    <div className="home-page">
      <Header />
      <main>
        <HeroBanner />
        <div className="home-content">
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
