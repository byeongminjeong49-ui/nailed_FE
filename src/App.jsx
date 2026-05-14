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

function getCurrentPath() {
  return window.location.pathname;
}

function renderAdminPage(activePage) {
  if (activePage === "members") return <AdminMembersPage />;
  if (activePage === "products") return <AdminProductsPage />;
  if (activePage === "orders") return <AdminOrdersPage />;
  if (activePage === "reports") return <AdminReportsPage />;
  return <AdminDashboardPage />;
}

function App() {
  const [path, setPath] = useState(getCurrentPath);
  const activePage = adminRoutes[path];
  const activeAuthPage = authRoutes[path];

  useEffect(() => {
    const handlePopState = () => setPath(getCurrentPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleAdminNavigate = (event, nextPath) => {
    event.preventDefault();
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  };

  const handleNavigate = (nextPath) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
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

  return <HomePage />;
}

export default App;
