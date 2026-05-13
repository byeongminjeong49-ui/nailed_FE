import { adminNavItems } from "../../data/adminDummyData";
import AdminIcon from "./AdminIcon";

function AdminSidebar({ activePage, onNavigate }) {
  return (
    <aside className="admin-sidebar">
      <a className="admin-logo" href="/admin/dashboard" onClick={(event) => onNavigate(event, "/admin/dashboard")}>
        Nailed
      </a>
      <nav className="admin-nav" aria-label="관리자 메뉴">
        {adminNavItems.map((item) => (
          <a
            className={`admin-nav-item ${activePage === item.id ? "is-active" : ""}`}
            href={item.path}
            key={item.id}
            onClick={(event) => onNavigate(event, item.path)}
          >
            <AdminIcon name={item.icon} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;
