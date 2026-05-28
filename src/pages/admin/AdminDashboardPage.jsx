import { useEffect, useMemo, useState } from "react";
import DonutChart from "../../components/admin/DonutChart";
import StatCard from "../../components/admin/StatCard";
import { getAdminDashboard } from "../../api/adminApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const ORDER_STATUS_LABELS = {
  REQUESTED: "주문요청",
  PAID: "결제완료",
  SHIPPING: "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "취소",
};

const PRODUCT_STATUS_LABELS = {
  ON_SALE: "판매중",
  SOLD: "판매완료",
  DELETED: "삭제됨",
};

const REPORT_STATUS_LABELS = {
  PENDING: "대기",
  APPROVED: "승인",
  REJECTED: "반려",
  DONE: "완료",
};

const REASON_LABELS = {
  FRAUD: "사기 의심",
  ABUSE: "욕설/비방",
  PROHIBITED_ITEM: "금지 품목",
  ETC: "기타",
};

const ROLE_LABELS = {
  ADMIN: "관리자",
  USER: "일반회원",
};

const MEMBER_STATUS_LABELS = {
  ACTIVE: "정상",
  LOCKED: "잠금",
  WITHDRAWN: "탈퇴",
  SUSPEND: "기간정지",
  SUSPENDED: "기간정지",
  BANNED: "영구정지",
};

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
  return numberValue(value).toLocaleString("ko-KR");
}

function formatWon(value) {
  return `${formatNumber(value)}원`;
}

function formatDate(value) {
  if (!value) return "-";
  if (typeof value === "string" && value.length >= 10) return value.slice(0, 10);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toISOString().slice(0, 10);
}

function toAssetUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function percent(part, total) {
  const safeTotal = numberValue(total);
  if (safeTotal <= 0) return 0;
  return Math.round((numberValue(part) / safeTotal) * 1000) / 10;
}

function RecentProductsTable({ items }) {
  return (
    <section className="admin-card dashboard-report-table">
      <h2>최근 상품</h2>
      <div className="admin-table-wrap">
        <table className="admin-table" style={{ minWidth: 680 }}>
          <thead>
            <tr>
              <th>이미지</th>
              <th>상품ID</th>
              <th>상품명</th>
              <th>상태</th>
              <th>가격</th>
              <th>등록일</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-inquiry-empty">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((product) => (
                <tr key={String(product.productId)}>
                  <td>
                    {product.thumbnailUrl ? (
                      <img
                        src={toAssetUrl(product.thumbnailUrl)}
                        alt={product.title || "상품 이미지"}
                        style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{product.productId ?? "-"}</td>
                  <td title={product.title || ""}>{product.title || "-"}</td>
                  <td>{PRODUCT_STATUS_LABELS[product.productStatus] || product.productStatus || "-"}</td>
                  <td>{formatWon(product.price)}</td>
                  <td>{formatDate(product.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecentOrdersTable({ items }) {
  return (
    <section className="admin-card dashboard-report-table">
      <h2>최근 주문</h2>
      <div className="admin-table-wrap">
        <table className="admin-table" style={{ minWidth: 760 }}>
          <thead>
            <tr>
              <th>주문번호</th>
              <th>상품명</th>
              <th>구매자</th>
              <th>판매자</th>
              <th>상태</th>
              <th>최종결제금액</th>
              <th>주문일</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="7" className="admin-inquiry-empty">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((order) => (
                <tr key={String(order.orderId)}>
                  <td>{order.orderId || "-"}</td>
                  <td title={order.productTitle || ""}>{order.productTitle || "-"}</td>
                  <td>{order.buyerNickname || "-"}</td>
                  <td>{order.sellerNickname || "-"}</td>
                  <td>{ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus || "-"}</td>
                  <td>{formatWon(order.paymentAmount)}</td>
                  <td>{formatDate(order.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecentReportsTable({ items }) {
  return (
    <section className="admin-card dashboard-report-table">
      <h2>최근 신고</h2>
      <div className="admin-table-wrap">
        <table className="admin-table" style={{ minWidth: 680 }}>
          <thead>
            <tr>
              <th>신고번호</th>
              <th>신고자</th>
              <th>대상 회원</th>
              <th>사유</th>
              <th>상태</th>
              <th>신고일</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-inquiry-empty">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((report) => (
                <tr key={String(report.reportId)}>
                  <td>{report.reportId || "-"}</td>
                  <td>{report.reporterNickname || "-"}</td>
                  <td>{report.targetName || "-"}</td>
                  <td>{REASON_LABELS[report.reasonCode] || report.reasonCode || "-"}</td>
                  <td>{REPORT_STATUS_LABELS[report.status] || report.status || "-"}</td>
                  <td>{formatDate(report.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecentMembersTable({ items }) {
  return (
    <section className="admin-card dashboard-report-table">
      <h2>최근 회원</h2>
      <div className="admin-table-wrap">
        <table className="admin-table" style={{ minWidth: 680 }}>
          <thead>
            <tr>
              <th>회원ID</th>
              <th>아이디</th>
              <th>닉네임</th>
              <th>권한</th>
              <th>상태</th>
              <th>가입일</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-inquiry-empty">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((member) => (
                <tr key={String(member.memberId)}>
                  <td>{member.memberId || "-"}</td>
                  <td>{member.userid || "-"}</td>
                  <td>{member.nickname || "-"}</td>
                  <td>{ROLE_LABELS[member.role] || member.role || "-"}</td>
                  <td>{MEMBER_STATUS_LABELS[member.status] || member.status || "-"}</td>
                  <td>{formatDate(member.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MetricPanel({ title, items }) {
  return (
    <section className="admin-card urgent-card">
      <h2>{title}</h2>
      {items.map((item) => (
        <div className="urgent-item" key={item.label}>
          <span>{item.marker}</span>
          <div>
            <strong>{item.label}</strong>
            <p>{item.description}</p>
          </div>
          <b className={item.danger ? "danger" : ""}>{item.value}</b>
        </div>
      ))}
    </section>
  );
}

function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setLoading(true);
      setErrorMessage("");

      try {
        const data = await getAdminDashboard();
        if (!ignore) setDashboard(data || {});
      } catch (error) {
        if (!ignore) {
          setDashboard(null);
          setErrorMessage(error.message || "대시보드 통계를 불러오지 못했습니다.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  const members = dashboard?.members || {};
  const products = dashboard?.products || {};
  const orders = dashboard?.orders || {};
  const sales = dashboard?.sales || {};
  const reports = dashboard?.reports || {};
  const inquiries = dashboard?.inquiries || {};

  const statCards = useMemo(
    () => [
      {
        label: "전체 회원 수",
        value: formatNumber(members.totalMembers),
        caption: `일반 ${formatNumber(members.userMembers)} / 관리자 ${formatNumber(members.adminMembers)}`,
        icon: "userPlus",
      },
      {
        label: "전체 상품 수",
        value: formatNumber(products.totalProducts),
        caption: `판매중 ${formatNumber(products.onSaleProducts)} / 판매완료 ${formatNumber(products.soldProducts)}`,
        icon: "tag",
      },
      {
        label: "전체 주문 수",
        value: formatNumber(orders.totalOrders),
        caption: `거래완료 ${formatNumber(orders.deliveredOrders)} / 취소 ${formatNumber(orders.cancelledOrders)}`,
        icon: "cart",
      },
      {
        label: "매출",
        value: formatWon(sales.commissionRevenue),
        caption: "DELIVERED 기준 수수료 매출",
        icon: "card",
      },
    ],
    [members, orders, products, sales],
  );

  const memberStatusItems = [
    {
      label: "정상",
      value: `${percent(members.activeMembers, members.totalMembers)}%`,
      count: `${formatNumber(members.activeMembers)}명`,
      color: "mint",
    },
    {
      label: "잠금",
      value: `${percent(members.lockedMembers, members.totalMembers)}%`,
      count: `${formatNumber(members.lockedMembers)}명`,
      color: "orange",
    },
    {
      label: "탈퇴",
      value: `${percent(members.withdrawnMembers, members.totalMembers)}%`,
      count: `${formatNumber(members.withdrawnMembers)}명`,
      color: "gray",
    },
    {
      label: "제재",
      value: `${percent(numberValue(members.suspendedMembers) + numberValue(members.bannedMembers), members.totalMembers)}%`,
      count: `${formatNumber(numberValue(members.suspendedMembers) + numberValue(members.bannedMembers))}명`,
      color: "red",
    },
  ];

  const salesItems = [
    {
      marker: "원",
      label: "전체 거래액",
      description: "DELIVERED 상품금액 기준",
      value: formatWon(sales.transactionAmount),
    },
    {
      marker: "건",
      label: "거래완료 주문",
      description: "DELIVERED 주문 수",
      value: formatNumber(sales.deliveredOrderCount),
    },
    {
      marker: "신",
      label: "대기 신고",
      description: "처리 대기 신고",
      value: formatNumber(reports.pendingReports),
      danger: numberValue(reports.pendingReports) > 0,
    },
    {
      marker: "문",
      label: "대기 문의",
      description: "답변 대기 문의",
      value: formatNumber(inquiries.pendingInquiries),
      danger: numberValue(inquiries.pendingInquiries) > 0,
    },
  ];

  const orderItems = [
    { marker: "요", label: "주문요청", description: "REQUESTED", value: formatNumber(orders.requestedOrders) },
    { marker: "결", label: "결제완료", description: "PAID", value: formatNumber(orders.paidOrders) },
    { marker: "배", label: "배송중", description: "SHIPPING", value: formatNumber(orders.shippingOrders) },
    { marker: "완", label: "배송완료", description: "DELIVERED", value: formatNumber(orders.deliveredOrders) },
  ];

  return (
    <div className="admin-page dashboard-page">
      <div className="admin-page-title">
        <h1>관리자 대시보드</h1>
        <p>실제 DB 기준 주요 통계와 최근 항목을 확인합니다.</p>
      </div>

      {loading && <p className="admin-inquiry-message">대시보드 통계를 불러오는 중입니다.</p>}
      {errorMessage && <p className="admin-inquiry-message">{errorMessage}</p>}

      <div className="admin-stat-grid">
        {statCards.map((item) => (
          <StatCard item={item} key={item.label} />
        ))}
      </div>

      <div className="dashboard-upper-grid">
        <MetricPanel title="매출/처리 현황" items={salesItems} />
        <DonutChart
          title="회원 상태 비율"
          center={{ label: "전체 회원", value: formatNumber(members.totalMembers) }}
          items={memberStatusItems}
        />
      </div>

      <div className="dashboard-lower-grid">
        <MetricPanel title="주문 상태" items={orderItems} />
        <RecentOrdersTable items={Array.isArray(dashboard?.recentOrders) ? dashboard.recentOrders : []} />
        <RecentReportsTable items={Array.isArray(dashboard?.recentReports) ? dashboard.recentReports : []} />
      </div>

      <div className="dashboard-lower-grid">
        <MetricPanel
          title="상품/문의"
          items={[
            { marker: "판", label: "판매중 상품", description: "ON_SALE", value: formatNumber(products.onSaleProducts) },
            { marker: "완", label: "판매완료 상품", description: "SOLD", value: formatNumber(products.soldProducts) },
            { marker: "숨", label: "숨김 상품", description: "DELETED", value: formatNumber(products.deletedProducts) },
            { marker: "문", label: "전체 문의", description: "문의 총계", value: formatNumber(inquiries.totalInquiries) },
          ]}
        />
        <RecentProductsTable items={Array.isArray(dashboard?.recentProducts) ? dashboard.recentProducts : []} />
        <RecentMembersTable items={Array.isArray(dashboard?.recentMembers) ? dashboard.recentMembers : []} />
      </div>
    </div>
  );
}

export default AdminDashboardPage;
