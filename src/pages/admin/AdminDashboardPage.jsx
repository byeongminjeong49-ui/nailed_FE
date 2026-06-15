import { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/admin/StatCard";
import { getAdminDashboard, getDashboardTrends } from "../../api/adminApi";

const TREND_PERIODS = {
  DAILY: { label: "일별", range: 30 },
  MONTHLY: { label: "월별", range: 12 },
};

const TREND_METRICS = [
  { key: "members", title: "신규 회원 수", unit: "명", dailyType: "line" },
  { key: "sales", title: "사이트 매출", unit: "원", dailyType: "line", format: "won" },
  { key: "orders", title: "유효 주문 수", unit: "건", dailyType: "line" },
  { key: "reports", title: "신고 수", unit: "건", dailyType: "bar" },
  { key: "inquiries", title: "문의 수", unit: "건", dailyType: "bar" },
  {
    key: "onSaleProducts",
    title: "판매중 상품 수",
    unit: "개",
    dailyType: "line",
    description: "현재 판매중 · 등록일 기준",
  },
];

const MEMBER_STATUS_LABELS = {
  ACTIVE: "활동중",
  LOCKED: "잠금",
  WITHDRAWN: "탈퇴",
  SUSPEND: "정지",
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

function formatTrendValue(value, metric) {
  return metric.format === "won" ? formatWon(value) : `${formatNumber(value)}${metric.unit}`;
}

function formatTrendAverage(value, metric) {
  const safeValue = numberValue(value);
  if (metric.format === "won") return formatWon(Math.round(safeValue));

  const rounded = Math.round(safeValue * 10) / 10;
  return `${rounded.toLocaleString("ko-KR")}${metric.unit}`;
}

function getTrendSummary(points, metric, period) {
  const values = points.map((point) => numberValue(point?.[metric.key]));
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = values.length ? total / values.length : 0;
  const maxValue = values.length ? Math.max(...values) : 0;
  const maxIndex = values.findIndex((value) => value === maxValue);
  const maxLabel = maxIndex >= 0 ? points[maxIndex]?.label : "";

  return [
    { label: "합계", value: formatTrendValue(total, metric) },
    { label: "평균", value: formatTrendAverage(average, metric) },
    { label: "최고값", value: formatTrendValue(maxValue, metric) },
    { label: period === "DAILY" ? "최고일" : "최고월", value: maxLabel || "-" },
  ];
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

function buildLinePath(values, maxValue, width, height, padding) {
  if (values.length === 1) {
    const x = width / 2;
    const y = height - padding - (values[0] / maxValue) * (height - padding * 2);
    return `M ${x} ${y}`;
  }

  return values
    .map((value, index) => {
      const x = padding + (index / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - (value / maxValue) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function getChartX(index, length, width, padding) {
  if (length === 1) return width / 2;
  return padding + (index / (length - 1)) * (width - padding * 2);
}

function getTooltipPosition(x, y, width, padding) {
  const tooltipWidth = 220;
  const tooltipHeight = 58;
  const tooltipX = Math.min(Math.max(x - tooltipWidth / 2, padding), width - padding - tooltipWidth);
  const tooltipY = Math.max(8, y - tooltipHeight - 12);

  return { tooltipX, tooltipY, tooltipWidth, tooltipHeight };
}

function formatTrendAxisLabel(label, period) {
  if (!label) return "";

  if (period === "MONTHLY") {
    const month = label.match(/^\d{4}-(\d{2})$/);
    return month ? `${month[1]}월` : label;
  }

  const day = label.match(/^\d{4}-(\d{2}-\d{2})$/);
  return day ? day[1] : label;
}

function getVisibleChartLabels(labels, period) {
  if (labels.length <= 12) {
    return labels.map((label, index) => ({ label: formatTrendAxisLabel(label, period), index }));
  }

  const step = Math.ceil(labels.length / 6);
  const visibleLabels = labels
    .map((label, index) => ({ label: formatTrendAxisLabel(label, period), index }))
    .filter((item) => item.index === 0 || item.index === labels.length - 1 || item.index % step === 0);

  return visibleLabels;
}

function TrendTooltip({ label, metric, value, x, y, width, padding }) {
  const { tooltipX, tooltipY, tooltipWidth, tooltipHeight } = getTooltipPosition(x, y, width, padding);

  return (
    <g className="trend-tooltip" transform={`translate(${tooltipX} ${tooltipY})`}>
      <rect width={tooltipWidth} height={tooltipHeight} rx="10" />
      <text x="12" y="22">{label}</text>
      <text x="12" y="43">{metric.title}: {formatTrendValue(value, metric)}</text>
    </g>
  );
}

function MiniTrendChart({ type, points, metric, period }) {
  const values = points.map((point) => numberValue(point?.[metric.key]));
  const maxValue = Math.max(...values, 0);
  const width = 960;
  const height = 260;
  const padding = 34;

  if (!points.length || maxValue <= 0) {
    return (
      <div className="trend-empty-chart">
        표시할 통계 데이터가 없습니다.
      </div>
    );
  }

  const labels = points.map((point) => point?.label || "");
  const visibleLabels = getVisibleChartLabels(labels, period);

  return (
    <div className="trend-chart-wrap">
      <svg className={`trend-chart trend-chart-${type}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${metric.title} ${type === "line" ? "꺾은선 그래프" : "막대 차트"}`}>
        <line className="trend-axis" x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
        <line className="trend-grid-line" x1={padding} y1={padding} x2={width - padding} y2={padding} />
        <line className="trend-grid-line" x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} />
        {type === "line" ? (
          <>
            <path className="trend-line" d={buildLinePath(values, maxValue, width, height, padding)} />
            {values.map((value, index) => {
              const x = getChartX(index, values.length, width, padding);
              const y = height - padding - (value / maxValue) * (height - padding * 2);
              return (
                <g className="trend-point-group" key={`${labels[index]}-${index}`}>
                  <circle className="trend-point-hit" cx={x} cy={y} r="14" />
                  <circle className="trend-line-dot" cx={x} cy={y} r="4" />
                  <TrendTooltip label={labels[index]} metric={metric} value={value} x={x} y={y} width={width} padding={padding} />
                </g>
              );
            })}
          </>
        ) : (
          values.map((value, index) => {
            const chartWidth = width - padding * 2;
            const gap = Math.min(10, chartWidth / values.length / 3);
            const barWidth = Math.max(4, chartWidth / values.length - gap);
            const x = padding + index * (chartWidth / values.length) + gap / 2;
            const barHeight = Math.max(3, (value / maxValue) * (height - padding * 2));
            const y = height - padding - barHeight;
            const tooltipAnchorX = x + barWidth / 2;
            return (
              <g className="trend-bar-group" key={`${labels[index]}-${index}`}>
                <rect
                  className="trend-bar"
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                />
                <rect
                  className="trend-bar-hit"
                  x={x}
                  y={padding}
                  width={barWidth}
                  height={height - padding * 2}
                />
                <TrendTooltip label={labels[index]} metric={metric} value={value} x={tooltipAnchorX} y={y} width={width} padding={padding} />
              </g>
            );
          })
        )}
      </svg>
      <div className="trend-chart-labels" style={{ gridTemplateColumns: `repeat(${visibleLabels.length}, minmax(0, 1fr))` }}>
        {visibleLabels.map((item) => (
          <span key={`${item.label}-${item.index}`}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}

function TrendCard({ metric, period, points }) {
  const chartType = period === "DAILY" ? metric.dailyType : "bar";
  const summaryItems = getTrendSummary(points, metric, period);

  return (
    <article className="admin-card trend-card">
      <div className="trend-card-head">
        <div>
          <h3>{metric.title}</h3>
          <p>{metric.description || (chartType === "line" ? "꺾은선 그래프" : "막대 차트")}</p>
        </div>
      </div>
      <div className="trend-card-body">
        <MiniTrendChart type={chartType} points={points} metric={metric} period={period} />
        <dl className="trend-summary-panel">
          {summaryItems.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

function DashboardTrendSection({
  period,
  points,
  loading,
  errorMessage,
  onPeriodChange,
}) {
  return (
    <section className="dashboard-trend-section">
      <div className="dashboard-section-head trend-section-head">
        <div>
          <h2>일·월별 통계</h2>
          <p>
            {TREND_PERIODS[period].label} 기준 회원, 매출, 주문, 신고, 문의 흐름을 확인합니다.
          </p>
        </div>
        <div className="trend-period-toggle" aria-label="통계 기간 선택">
          {Object.entries(TREND_PERIODS).map(([value, option]) => (
            <button
              type="button"
              className={period === value ? "is-active" : ""}
              key={value}
              onClick={() => onPeriodChange(value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="admin-inquiry-message">통계 데이터를 불러오는 중입니다.</p>}
      {errorMessage && <p className="admin-inquiry-message">{errorMessage}</p>}

      {!loading && !errorMessage && (
        <div className="trend-card-grid">
          {TREND_METRICS.map((metric) => (
            <TrendCard metric={metric} period={period} points={points} key={metric.key} />
          ))}
        </div>
      )}
    </section>
  );
}

function navigateAdmin(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [trendPeriod, setTrendPeriod] = useState("DAILY");
  const [trendPoints, setTrendPoints] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendErrorMessage, setTrendErrorMessage] = useState("");

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

  useEffect(() => {
    let ignore = false;

    async function loadTrends() {
      setTrendLoading(true);
      setTrendErrorMessage("");

      try {
        const data = await getDashboardTrends({
          period: trendPeriod,
          range: TREND_PERIODS[trendPeriod].range,
        });

        if (ignore) return;

        setTrendPoints(Array.isArray(data?.points) ? data.points : []);
      } catch (error) {
        if (!ignore) {
          setTrendPoints([]);
          setTrendErrorMessage(error.message || "통계 데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (!ignore) setTrendLoading(false);
      }
    }

    loadTrends();

    return () => {
      ignore = true;
    };
  }, [trendPeriod]);

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
        onClick: () => navigateAdmin("/admin/members"),
      },
      {
        label: "전체 상품",
        value: formatNumber(totalProducts),
        caption: `판매중 ${formatNumber(products.onSaleProducts)} / 판매완료 ${formatNumber(products.soldProducts)}`,
        icon: "tag",
        onClick: () => navigateAdmin("/admin/products"),
      },
      {
        label: "전체 주문",
        value: formatNumber(totalOrders),
        caption: `배송완료 ${formatNumber(orders.deliveredOrders)} / 취소 ${formatNumber(orders.cancelledOrders)}`,
        icon: "cart",
        onClick: () => navigateAdmin("/admin/orders"),
      },
      {
        label: "전체 신고",
        value: formatNumber(totalReports),
        caption: `승인 ${formatNumber(reports.approvedReports)} / 반려 ${formatNumber(reports.rejectedReports)} / 완료 ${formatNumber(reports.doneReports)}`,
        icon: "alert",
        onClick: () => navigateAdmin("/admin/reports"),
      },
      {
        label: "전체 문의",
        value: formatNumber(totalInquiries),
        caption: `답변 대기 ${formatNumber(pendingInquiries)} / 답변 완료 ${formatNumber(answeredInquiries)}`,
        icon: "document",
        onClick: () => navigateAdmin("/admin/inquiries"),
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
      total: reportStatusTotal,
      rows: buildRows(
        ["APPROVED", "REJECTED", "DONE"],
        REPORT_STATUS_LABELS,
        {
          APPROVED: reports.approvedReports,
          REJECTED: reports.rejectedReports,
          DONE: reports.doneReports,
        },
        reportStatusTotal,
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

      <SalesBoard transactionAmount={transactionAmount} commissionRevenue={commissionRevenue} />

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

      <DashboardTrendSection
        period={trendPeriod}
        points={trendPoints}
        loading={trendLoading}
        errorMessage={trendErrorMessage}
        onPeriodChange={setTrendPeriod}
      />
    </div>
  );
}

export default AdminDashboardPage;
