import { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/admin/StatCard";
import { getAdminDashboard } from "../../api/adminApi";

const MEMBER_STATUS_LABELS = {
  ACTIVE: "정상",
  LOCKED: "잠금",
  WITHDRAWN: "탈퇴",
  SUSPEND: "기간정지",
  BANNED: "영구정지",
};

const PRODUCT_STATUS_LABELS = {
  ON_SALE: "판매중",
  SOLD: "판매완료",
  DELETED: "숨김",
};

const ORDER_STATUS_LABELS = {
  PAID: "결제완료",
  REQUESTED: "주문접수",
  SHIPPING: "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "취소",
};

const REPORT_STATUS_LABELS = {
  PENDING: "대기",
  APPROVED: "승인",
  REJECTED: "반려",
  DONE: "완료",
};

const INQUIRY_STATUS_LABELS = {
  PENDING: "답변 대기",
  ANSWERED: "답변 완료",
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

function percent(part, total) {
  const safeTotal = numberValue(total);
  if (safeTotal <= 0) return 0;
  return Math.round((numberValue(part) / safeTotal) * 1000) / 10;
}

function buildRows(keys, labels, counts, total) {
  return keys.map((key) => {
    const count = numberValue(counts[key]);
    return {
      key,
      label: labels[key] || key,
      count,
      percent: percent(count, total),
    };
  });
}

function RatioCard({ title, total, rows }) {
  return (
    <section className="admin-card dashboard-ratio-card">
      <div className="ratio-card-head">
        <h2>{title}</h2>
        <strong>{formatNumber(total)}</strong>
      </div>
      <div className="ratio-row-list">
        {rows.map((row) => (
          <div className="ratio-row" key={row.key}>
            <div className="ratio-row-head">
              <span>{row.label}</span>
              <strong>{formatNumber(row.count)}</strong>
              <em>{row.percent}%</em>
            </div>
            <div className="ratio-bar" aria-hidden="true">
              <span style={{ width: `${row.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SalesBoard({ transactionAmount, commissionRevenue }) {
  return (
    <section className="admin-card dashboard-sales-board">
      <div className="dashboard-section-head">
        <div>
          <h2>매출 현황판</h2>
          <p>REQUESTED·SHIPPING·DELIVERED 기준 금액 현황</p>
        </div>
      </div>
      <div className="sales-card-grid">
        <article className="sales-summary-card">
          <span>사이트 전체 거래액</span>
          <strong>{formatWon(transactionAmount)}</strong>
          <p>REQUESTED·SHIPPING·DELIVERED 기준 최종 결제금액 합계</p>
        </article>
        <article className="sales-summary-card">
          <span>사이트 매출</span>
          <strong>{formatWon(commissionRevenue)}</strong>
          <p>주문별 수수료 10원 단위 반올림 합계</p>
        </article>
      </div>
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
  const reports = dashboard?.reports || {};
  const inquiries = dashboard?.inquiries || {};
  const sales = dashboard?.sales || {};

  const totalMembers = numberValue(members.totalMembers);
  const totalProducts = numberValue(products.totalProducts);
  const totalOrders = numberValue(orders.totalOrders);
  const reportStatusTotal =
    numberValue(reports.pendingReports) +
    numberValue(reports.approvedReports) +
    numberValue(reports.rejectedReports) +
    numberValue(reports.doneReports);
  const totalReports = numberValue(reports.totalReports ?? reportStatusTotal);
  const totalInquiries = numberValue(inquiries.totalInquiries);
  const pendingInquiries = numberValue(inquiries.pendingInquiries);
  const answeredInquiries = numberValue(inquiries.answeredInquiries ?? Math.max(totalInquiries - pendingInquiries, 0));
  const transactionAmount = numberValue(sales.transactionAmount);
  const commissionRevenue = numberValue(sales.commissionRevenue);

  const statCards = useMemo(
    () => [
      {
        label: "전체 회원",
        value: formatNumber(totalMembers),
        caption: `일반 ${formatNumber(members.userMembers)} / 관리자 ${formatNumber(members.adminMembers)}`,
        icon: "userPlus",
      },
      {
        label: "전체 상품",
        value: formatNumber(totalProducts),
        caption: `판매중 ${formatNumber(products.onSaleProducts)} / 판매완료 ${formatNumber(products.soldProducts)}`,
        icon: "tag",
      },
      {
        label: "전체 주문",
        value: formatNumber(totalOrders),
        caption: `배송완료 ${formatNumber(orders.deliveredOrders)} / 취소 ${formatNumber(orders.cancelledOrders)}`,
        icon: "cart",
      },
      {
        label: "전체 신고",
        value: formatNumber(totalReports),
        caption: `대기 ${formatNumber(reports.pendingReports)} / 완료 ${formatNumber(reports.doneReports)}`,
        icon: "alert",
      },
      {
        label: "전체 문의",
        value: formatNumber(totalInquiries),
        caption: `답변 대기 ${formatNumber(pendingInquiries)} / 답변 완료 ${formatNumber(answeredInquiries)}`,
        icon: "document",
      },
    ],
    [
      answeredInquiries,
      inquiries,
      members,
      orders,
      pendingInquiries,
      products,
      reports,
      totalInquiries,
      totalMembers,
      totalOrders,
      totalProducts,
      totalReports,
    ],
  );

  const ratioCards = [
    {
      title: "회원 상태 비율",
      total: totalMembers,
      rows: buildRows(
        ["ACTIVE", "LOCKED", "WITHDRAWN", "SUSPEND", "BANNED"],
        MEMBER_STATUS_LABELS,
        {
          ACTIVE: members.activeMembers,
          LOCKED: members.lockedMembers,
          WITHDRAWN: members.withdrawnMembers,
          SUSPEND: members.suspendMembers ?? members.suspendedMembers,
          BANNED: members.bannedMembers,
        },
        totalMembers,
      ),
    },
    {
      title: "상품 상태 비율",
      total: totalProducts,
      rows: buildRows(
        ["ON_SALE", "SOLD", "DELETED"],
        PRODUCT_STATUS_LABELS,
        {
          ON_SALE: products.onSaleProducts,
          SOLD: products.soldProducts,
          DELETED: products.deletedProducts,
        },
        totalProducts,
      ),
    },
    {
      title: "주문 상태 비율",
      total: totalOrders,
      rows: buildRows(
        ["PAID", "REQUESTED", "SHIPPING", "DELIVERED", "CANCELLED"],
        ORDER_STATUS_LABELS,
        {
          PAID: orders.paidOrders,
          REQUESTED: orders.requestedOrders,
          SHIPPING: orders.shippingOrders,
          DELIVERED: orders.deliveredOrders,
          CANCELLED: orders.cancelledOrders,
        },
        totalOrders,
      ),
    },
    {
      title: "신고 상태 비율",
      total: totalReports,
      rows: buildRows(
        ["PENDING", "APPROVED", "REJECTED", "DONE"],
        REPORT_STATUS_LABELS,
        {
          PENDING: reports.pendingReports,
          APPROVED: reports.approvedReports,
          REJECTED: reports.rejectedReports,
          DONE: reports.doneReports,
        },
        totalReports,
      ),
    },
    {
      title: "문의 상태 비율",
      total: totalInquiries,
      rows: buildRows(
        ["PENDING", "ANSWERED"],
        INQUIRY_STATUS_LABELS,
        {
          PENDING: pendingInquiries,
          ANSWERED: answeredInquiries,
        },
        totalInquiries,
      ),
    },
  ];

  return (
    <div className="admin-page dashboard-page">
      {loading && <p className="admin-inquiry-message">대시보드 통계를 불러오는 중입니다.</p>}
      {errorMessage && <p className="admin-inquiry-message">{errorMessage}</p>}

      <div className="admin-stat-grid dashboard-total-grid">
        {statCards.map((item) => (
          <StatCard item={item} key={item.label} />
        ))}
      </div>

      <div className="dashboard-ratio-grid">
        {ratioCards.map((card) => (
          <RatioCard title={card.title} total={card.total} rows={card.rows} key={card.title} />
        ))}
      </div>

      <SalesBoard transactionAmount={transactionAmount} commissionRevenue={commissionRevenue} />
    </div>
  );
}

export default AdminDashboardPage;
