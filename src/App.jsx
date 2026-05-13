import { useEffect, useState } from "react";
import AdminLayout from "./components/admin/AdminLayout";
import HomePage from "./pages/HomePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminMembersPage from "./pages/admin/AdminMembersPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
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

  if (activePage) {
    return (
      <AdminLayout activePage={activePage} onNavigate={handleAdminNavigate}>
        {renderAdminPage(activePage)}
      </AdminLayout>
    );
  }

  return <HomePage />;
}

export default App;
