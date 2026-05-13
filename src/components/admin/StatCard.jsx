import AdminIcon from "./AdminIcon";

function StatCard({ item }) {
  return (
    <article className="admin-stat-card">
      <span className="stat-icon">
        <AdminIcon name={item.icon} />
      </span>
      <div>
        <p>{item.label}</p>
        <strong>{item.value}</strong>
        {item.change ? (
          <span className={`stat-change ${item.trend === "down" ? "is-down" : ""}`}>
            {item.trend === "down" ? "↓" : "↑"} {item.change}
          </span>
        ) : null}
        <small>{item.caption}</small>
      </div>
    </article>
  );
}

export default StatCard;
