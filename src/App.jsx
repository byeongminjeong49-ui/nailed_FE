// src/App.jsx

import { useEffect, useState } from "react";
import AdminLayout from "./components/admin/AdminLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import CustomerCenterPage from "./pages/CustomerCenterPage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminMembersPage from "./pages/admin/AdminMembersPage.jsx";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage.jsx";
import AdminProductsPage from "./pages/admin/AdminProductsPage.jsx";
import AdminReportsPage from "./pages/admin/AdminReportsPage.jsx";
import { FindPasswordPage, LoginPage, SignupPage } from "./pages/AuthPages.jsx";
import MyPage from "./pages/MyPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import ProductListPage from "./pages/ProductListPage.jsx";
import ReadyPage from "./pages/ReadyPage.jsx";
import SellPage from "./pages/SellPage.jsx";
import ReviewWritePage from "./pages/ReviewWritePage.jsx";
import SearchResultPage from "./pages/SearchResultPage.jsx";
import ServiceGuidePage from "./pages/ServiceGuidePage.jsx";
import UserProfilePage from "./pages/UserProfilePage.jsx";
import { clearLegacyAuthLocalStorage } from "./api/authApi";

// 공통 레이아웃 컴포넌트 포함
import Header from "./components/common/Header.jsx";
import Footer from "./components/common/Footer.jsx";

// ⭐️ [경로 수정 완료] 스크린샷 파일 위치에 맞게 /order/ 경로를 제거했습니다.
import OrderForm from "./pages/OrderFormPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import OrderDetail from "./pages/OrderDetailPage.jsx";

import "./App.css";
import "./styles/global.css";
import "./styles/home.css";
import "./styles/admin.css";
import "./styles/customer-center.css";
import "./styles/service-guide.css";

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

const guideRoutes = {
  "/guide": "guide",
  "/fees": "fees",
  "/shipping": "shipping",
};

const orderRoutes = {
  "/order/form": "form",
  "/order/payment": "payment",
};

const ACCESS_TOKEN_KEY = "accessToken";
const SESSION_KEY = "nailed_session";

function readSession() {
  try {
    return JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function hasAccessToken() {
  return Boolean(window.sessionStorage.getItem(ACCESS_TOKEN_KEY) && readSession());
}

function getCurrentRole() {
  const session = readSession();
  return session?.role || "";
}

function moveTo(path) {
  window.history.replaceState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function requireAdmin() {
  window.alert("관리자 권한이 필요한 페이지입니다.");
  moveTo("/");
  return null;
}

function LoginRequiredRedirect() {
  useEffect(() => {
    window.alert("로그인이 필요한 페이지입니다.");
    moveTo("/login");
  }, []);

  return (
    <LoginPage
      onNavigate={(nextPath) => {
        window.history.pushState({}, "", nextPath);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }}
    />
  );
}

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

// 동적 하위 결제 상세식별키 정규식 추출기
function getOrderId(pathname) {
  const m = pathname.match(/^\/order\/detail\/([^/]+)$/);
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
  const activeGuidePage = guideRoutes[path];
  const activeOrderPage = orderRoutes[path]; 
  const isMyPageRoute = path === "/mypage" || path.startsWith("/mypage/");
  const productId = getProductId(path);
  const userId = getUserId(path);
  const reviewOrderId = getReviewOrderId(path);
  const orderId = getOrderId(path); 

  useEffect(() => {
    clearLegacyAuthLocalStorage();
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

  // 1. 관리자 전용 라우트 우선 처리
  if (activePage) {
    if (!hasAccessToken()) return <LoginRequiredRedirect />;
    if (getCurrentRole() !== "ADMIN") return requireAdmin();

    return (
      <AdminLayout activePage={activePage} onNavigate={handleAdminNavigate}>
        {renderAdminPage(activePage)}
      </AdminLayout>
    );
  }

  // 2. 인증 및 계정 권한 관련 예외 처리
  if (activeAuthPage === "login") return <LoginPage onNavigate={handleNavigate} />;
  if (activeAuthPage === "signup") return <SignupPage onNavigate={handleNavigate} />;
  if (activeAuthPage === "find-password") return <FindPasswordPage onNavigate={handleNavigate} />;
  if (isMyPageRoute) {
    if (!hasAccessToken()) return <LoginRequiredRedirect />;
    return <MyPage onNavigate={handleNavigate} pathname={path} />;
  }
  if (activeGuidePage) return <ServiceGuidePage type={activeGuidePage} />;
  if (path === "/sell") {
    if (!hasAccessToken()) return <LoginRequiredRedirect />;
    return <SellPage />;
  }
  if (activeReadyPage) {
    if (!hasAccessToken()) return <LoginRequiredRedirect />;
    return <ReadyPage title={activeReadyPage} />;
  }

  // 3. 상품 코어 도메인 상세 정보 분기
  if (productId) {
    return <ProductDetailPage productId={productId} />;
  }

  // 4. 회원 프로필 및 리뷰 작성 허브
  if (userId) return <UserProfilePage memberId={userId} />;
  if (reviewOrderId) {
    if (!hasAccessToken()) return <LoginRequiredRedirect />;
    const params = new URLSearchParams(location.search);
    return <ReviewWritePage orderId={reviewOrderId} sellerId={params.get("sellerId")} />;
  }

  // 5. 주문서 / 결제 / 주문상세 내역 통합 처리 분기점
  if (activeOrderPage === "form") {
    if (!hasAccessToken()) return <LoginRequiredRedirect />;

    return (
      <div className="main-wrapper">
        <Header />
        <main className="main-content"><OrderForm /></main>
        <Footer />
      </div>
    );
  }

  if (activeOrderPage === "payment") {
    if (!hasAccessToken()) return <LoginRequiredRedirect />;

    return (
      <div className="main-wrapper">
        <Header />
        <main className="main-content"><PaymentPage /></main>
        <Footer />
      </div>
    );
  }

  if (orderId) {
    if (!hasAccessToken()) return <LoginRequiredRedirect />;

    return (
      <div className="main-wrapper">
        <Header />
        <main className="main-content"><OrderDetail orderId={orderId} /></main>
        <Footer />
      </div>
    );
  }

  // 6. 검색 및 카테고리 인덱싱
  if (path === "/customer-center") return <CustomerCenterPage />;
  if (path === "/search") return <SearchResultPage search={location.search} />;
  if (path.startsWith("/category/")) {
    return <ProductListPage path={path} search={location.search} />;
  }

  // 7. 폴백 기본 루트 홈화면
  return <HomePage />;
}

export default App;
