import DonutChart from "../../components/admin/DonutChart";
import QuickPanel from "../../components/admin/QuickPanel";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import { dashboardData } from "../../data/adminDummyData";

function ReportTrendChart({ items }) {
  const maxValue = 60;

  return (
    <section className="admin-card dashboard-chart-card">
      <h2>최근 7일간 신고 접수 현황</h2>
      <div className="chart-legend">
        <span><i className="legend-mint" /> 상품 신고</span>
        <span><i className="legend-gray" /> 회원 신고</span>
      </div>
      <div className="bar-chart">
        {items.map((item) => (
          <div className="bar-group" key={item.date}>
            <div className="bar-stack">
              <span className="member-bar" style={{ height: `${(item.member / maxValue) * 100}%` }} />
              <span className="product-bar" style={{ height: `${(item.product / maxValue) * 100}%` }} />
            </div>
            <i style={{ bottom: `${(item.product / maxValue) * 100}%` }} />
            <small>{item.date}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function UrgentList({ items }) {
  return (
    <section className="admin-card urgent-card">
      <h2>빠른 처리 필요</h2>
      {items.map((item) => (
        <div className="urgent-item" key={item.title}>
          <span>△</span>
          <div>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </div>
          <b className={item.level === "긴급" ? "danger" : ""}>{item.level}</b>
        </div>
      ))}
      <a href="/admin/reports">전체 대기열 확인 →</a>
    </section>
  );
}

function ProductReportTable({ rows }) {
  return (
    <section className="admin-card dashboard-report-table">
      <h2>최근 상품 신고</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>신고번호</th>
              <th>상품명</th>
              <th>판매자</th>
              <th>신고유형</th>
              <th>신고일</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.product}</td>
                <td>{row.seller}</td>
                <td>{row.type}</td>
                <td>{row.date}</td>
                <td><StatusBadge status={row.status} /></td>
                <td className="table-actions"><button type="button">보기</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <a className="table-more-link" href="/admin/reports">전체 신고 내역 보기 →</a>
    </section>
  );
}

function AdminDashboardPage() {
  return (
    <div className="admin-page dashboard-page">
      <div className="admin-page-title">
        <h1>{dashboardData.title}</h1>
        <p>{dashboardData.description}</p>
      </div>

      <div className="admin-stat-grid">
        {dashboardData.stats.map((item) => (
          <StatCard item={item} key={item.label} />
        ))}
      </div>

      <div className="dashboard-upper-grid">
        <ReportTrendChart items={dashboardData.reportTrend} />
        <DonutChart title="회원 상태 비율" center={{ label: "전체 회원", value: "15,842" }} items={dashboardData.memberStatus} />
      </div>

      <div className="dashboard-lower-grid">
        <UrgentList items={dashboardData.urgentItems} />
        <ProductReportTable rows={dashboardData.productReports} />
        <QuickPanel title="빠른 작업" items={dashboardData.quickActions} />
      </div>
    </div>
  );
}

export default AdminDashboardPage;
