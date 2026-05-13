import AdminSidebar from "./AdminSidebar";
import AdminStatusBar from "./AdminStatusBar";
import AdminTopbar from "./AdminTopbar";

function AdminLayout({ activePage, children, onNavigate }) {
  return (
    <div className="admin-shell">
      <AdminSidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="admin-main-shell">
        <AdminTopbar />
        <main className="admin-main">{children}</main>
        <AdminStatusBar />
      </div>
    </div>
  );
}

export default AdminLayout;
