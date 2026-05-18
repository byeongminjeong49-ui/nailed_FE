import { useEffect, useState } from "react";
import AdminLayout from "./components/admin/AdminLayout";
import HomePage from "./pages/HomePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminMembersPage from "./pages/admin/AdminMembersPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import { FindPasswordPage, LoginPage, SignupPage } from "./pages/AuthPages";
import MyPage from "./pages/MyPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductListPage from "./pages/ProductListPage";
import ReadyPage from "./pages/ReadyPage";
import ReviewWritePage from "./pages/ReviewWritePage";
import SearchResultPage from "./pages/SearchResultPage";
import UserProfilePage from "./pages/UserProfilePage";
import "./App.css";
import "./styles/global.css";
import "./styles/home.css";
import "./styles/admin.css";

const adminRoutes = {
  "/admin": "dashboard",
  "/admin/dashboard": "dashboard",
  "/admin/members": "members",
  "/admin/products": "products",
  "/admin/orders": "orders",
  "/admin/reports": "reports",
};

const authRoutes = {
  "/login": "login",
  "/signup": "signup",
  "/find-password": "find-password",
  "/password/reset": "find-password",
  "/mypage": "mypage",
};

const readyRoutes = {
  "/sell": "판매",
};

function getProductId(pathname) {
  const m = pathname.match(/^\/product\/([^/]+)$/);
  return m ? m[1] : null;
}

function getUserId(pathname) {
  const m = pathname.match(/^\/user\/([^/]+)$/);
  return m ? m[1] : null;
}

function getReviewOrderId(pathname) {
  const m = pathname.match(/^\/reviews\/write\/([^/]+)$/);
  return m ? m[1] : null;
}

function getCurrentPath() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
  };
}

function renderAdminPage(activePage) {
  if (activePage === "members") return <AdminMembersPage />;
  if (activePage === "products") return <AdminProductsPage />;
  if (activePage === "orders") return <AdminOrdersPage />;
  if (activePage === "reports") return <AdminReportsPage />;
  return <AdminDashboardPage />;
}

function App() {
  const [location, setLocation] = useState(getCurrentPath);
  const path = location.pathname;
  const activePage = adminRoutes[path];
  const activeAuthPage = authRoutes[path];
  const activeReadyPage = readyRoutes[path];
  const productId = getProductId(path);
  const userId = getUserId(path);
  const reviewOrderId = getReviewOrderId(path);

  useEffect(() => {
    const handlePopState = () => setLocation(getCurrentPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleAdminNavigate = (event, nextPath) => {
    event.preventDefault();
    window.history.pushState({}, "", nextPath);
    setLocation(getCurrentPath());
  };

  const handleNavigate = (nextPath) => {
    window.history.pushState({}, "", nextPath);
    setLocation(getCurrentPath());
  };

  if (activePage) {
    return (
      <AdminLayout activePage={activePage} onNavigate={handleAdminNavigate}>
        {renderAdminPage(activePage)}
      </AdminLayout>
    );
  }

  if (activeAuthPage === "login") {
    return <LoginPage onNavigate={handleNavigate} />;
  }

  if (activeAuthPage === "signup") {
    return <SignupPage onNavigate={handleNavigate} />;
  }

  if (activeAuthPage === "find-password") {
    return <FindPasswordPage onNavigate={handleNavigate} />;
  }

  if (activeAuthPage === "mypage") {
    return <MyPage onNavigate={handleNavigate} />;
  }

  if (activeReadyPage) {
    return <ReadyPage title={activeReadyPage} />;
  }

  if (productId) {
    return <ProductDetailPage productId={productId} />;
  }

  if (userId) {
    return <UserProfilePage memberId={userId} />;
  }

  if (reviewOrderId) {
    const params = new URLSearchParams(location.search);
    return <ReviewWritePage orderId={reviewOrderId} sellerId={params.get("sellerId")} />;
  }

  if (path === "/search") {
    return <SearchResultPage search={location.search} />;
  }

  if (path.startsWith("/category/")) {
    return <ProductListPage path={path} search={location.search} />;
  }

  return <HomePage />;
}

export default App;
