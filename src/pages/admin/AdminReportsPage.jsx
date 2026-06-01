import { useEffect, useMemo, useState } from "react";
import { getAdminOrders, getAdminProducts, getAdminReports } from "../../api/adminApi";

const TARGET_TYPE_LABELS = {
  MEMBER: "회원",
};

const REASON_LABELS = {
  FRAUD: "사기 의심",
  MISLEADING_INFO: "상품 정보 허위/불일치",
  PROHIBITED_ITEM: "금지 품목",
  ETC: "기타",
};

const REPORT_STATUS_LABELS = {
  PENDING: "대기",
  APPROVED: "승인",
  REJECTED: "반려",
  DONE: "완료",
};

const REPORT_STATUS_CLASS_NAMES = {
  PENDING: "orange",
  APPROVED: "mint",
  REJECTED: "red",
  DONE: "blue",
};

const PAGE_SIZE = 10;
const DETAIL_SUMMARY_SIZE = 5;
const REPORT_TARGET_TYPE = "MEMBER";
const REPORT_SORT = "reportId,asc";
const PRODUCT_SORT = "productId,asc";
const ORDER_SORT = "orderId,asc";

function formatDate(value) {
  if (!value) return "-";
  if (typeof value === "string" && value.length >= 10) return value.slice(0, 10);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toISOString().slice(0, 10);
}

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 0) return [];

  const start = Math.max(0, currentPage - 2);
  const end = Math.min(totalPages - 1, start + 4);
  const adjustedStart = Math.max(0, end - 4);

  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index,
  );
}

function sortByIdAsc(items, field) {
  return [...items].sort((a, b) => Number(a?.[field] ?? 0) - Number(b?.[field] ?? 0));
}

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price)) return "-";
  return `${price.toLocaleString("ko-KR")}원`;
}

function getListContent(data) {
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

function getTargetKeyword(report) {
  return String(
    report?.targetUserid ||
      report?.targetUserId ||
      report?.targetName ||
      report?.targetMemberId ||
      report?.targetId ||
      "",
  ).trim();
}

function DetailItem({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "-"}</dd>
    </div>
  );
}

function ReportDetailPanel({ report, products, orders, loading, message, onClose }) {
  if (!report) return null;

  return (
    <section className="admin-card report-detail-panel">
      <div className="report-detail-head">
        <div>
          <h2>신고 상세 확인</h2>
          <p>관리자 페이지 내부에서 신고 판단에 필요한 정보를 확인합니다.</p>
        </div>
        <button type="button" onClick={onClose}>닫기</button>
      </div>

      <div className="report-detail-grid">
        <section className="report-detail-section">
          <h3>신고 기본 정보</h3>
          <dl className="report-detail-list">
            <DetailItem label="신고번호" value={report.reportId} />
            <DetailItem label="신고자" value={report.reporterNickname || report.reporterUserid} />
            <DetailItem label="신고 대상 회원" value={report.targetName || report.targetUserid || report.targetId} />
            <DetailItem label="신고 사유" value={REASON_LABELS[report.reasonCode] || report.reasonCode} />
            <DetailItem label="신고 상태" value={REPORT_STATUS_LABELS[report.status] || report.status} />
            <DetailItem label="신고일" value={formatDate(report.createdAt)} />
          </dl>
          <div className="report-detail-text">
            <span>신고 내용</span>
            <p>{report.detail || report.description || report.content || "-"}</p>
          </div>
        </section>

        <section className="report-detail-section">
          <h3>신고 대상 회원 정보</h3>
          <dl className="report-detail-list">
            <DetailItem label="member_id" value={report.targetMemberId || report.targetId} />
            <DetailItem label="userid / nickname" value={report.targetUserid || report.targetUserId || report.targetName} />
            <DetailItem label="회원 상태" value={report.targetStatus || report.targetMemberStatus} />
            <DetailItem label="가입일" value={formatDate(report.targetCreatedAt || report.targetJoinedAt)} />
            <DetailItem label="판매자 등급" value={report.targetSellerGrade || report.sellerGrade} />
          </dl>
        </section>
      </div>

      {loading && <p className="admin-inquiry-message">신고 대상 회원의 관련 정보를 불러오는 중입니다.</p>}
      {message && <p className="admin-inquiry-message">{message}</p>}

      <div className="report-summary-grid">
        <section className="report-detail-section">
          <h3>신고 대상 회원 판매글 요약</h3>
          <div className="admin-table-wrap">
            <table className="admin-table report-summary-table">
              <thead>
                <tr>
                  <th>상품ID</th>
                  <th>상품명</th>
                  <th>상태</th>
                  <th>가격</th>
                  <th>등록일</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="admin-inquiry-empty">기존 API 응답에서 표시할 판매글이 없습니다.</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={String(product.productId)}>
                      <td>{product.productId ?? "-"}</td>
                      <td title={product.title || ""}>{product.title || "-"}</td>
                      <td>{product.productStatus || "-"}</td>
                      <td>{formatPrice(product.price)}</td>
                      <td>{formatDate(product.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="report-detail-section">
          <h3>신고 대상 회원 주문 요약</h3>
          <div className="admin-table-wrap">
            <table className="admin-table report-summary-table">
              <thead>
                <tr>
                  <th>주문ID</th>
                  <th>상품명</th>
                  <th>구매자</th>
                  <th>판매자</th>
                  <th>상태</th>
                  <th>주문일</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-inquiry-empty">기존 API 응답에서 표시할 주문이 없습니다.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={String(order.orderId)}>
                      <td>{order.orderId ?? "-"}</td>
                      <td title={order.productTitle || ""}>{order.productTitle || "-"}</td>
                      <td>{order.buyerNickname || order.buyerUserid || "-"}</td>
                      <td>{order.sellerNickname || order.sellerUserid || "-"}</td>
                      <td>{order.orderStatus || "-"}</td>
                      <td>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}

function AdminReportsPage() {
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [reasonCode, setReasonCode] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [targetProducts, setTargetProducts] = useState([]);
  const [targetOrders, setTargetOrders] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailMessage, setDetailMessage] = useState("");
  const [pageInfo, setPageInfo] = useState({
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const pageNumbers = useMemo(
    () => getPageNumbers(pageInfo.pageNumber, pageInfo.totalPages),
    [pageInfo.pageNumber, pageInfo.totalPages],
  );

  useEffect(() => {
    let ignore = false;

    async function loadReports() {
      setLoading(true);
      setErrorMessage("");

      try {
        const data = await getAdminReports({
          page,
          size: PAGE_SIZE,
          keyword: appliedKeyword,
          targetType: REPORT_TARGET_TYPE,
          reasonCode,
          status,
          dateFrom: appliedDateFrom,
          dateTo: appliedDateTo,
          sort: REPORT_SORT,
        });

        if (ignore) return;

        const content = Array.isArray(data?.content) ? data.content : [];
        setReports(sortByIdAsc(content.filter((report) => !report?.targetType || report.targetType === REPORT_TARGET_TYPE), "reportId"));
        setPageInfo({
          pageNumber: data?.pageNumber ?? page,
          pageSize: data?.pageSize ?? PAGE_SIZE,
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0,
          first: data?.first ?? true,
          last: data?.last ?? true,
        });
      } catch (error) {
        if (ignore) return;

        setReports([]);
        setPageInfo((current) => ({
          ...current,
          pageNumber: 0,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        }));
        setErrorMessage(error.message || "신고 목록을 불러오지 못했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadReports();

    return () => {
      ignore = true;
    };
  }, [appliedDateFrom, appliedDateTo, appliedKeyword, page, reasonCode, status]);

  useEffect(() => {
    let ignore = false;

    async function loadReportTargetSummaries() {
      if (!selectedReport) {
        setTargetProducts([]);
        setTargetOrders([]);
        setDetailMessage("");
        return;
      }

      const targetKeyword = getTargetKeyword(selectedReport);
      if (!targetKeyword) {
        setTargetProducts([]);
        setTargetOrders([]);
        setDetailMessage("신고 대상 회원 식별 필드가 부족해 판매글/주문 요약을 조회할 수 없습니다.");
        return;
      }

      setDetailLoading(true);
      setDetailMessage("");

      try {
        const [productsData, ordersData] = await Promise.all([
          getAdminProducts({
            page: 0,
            size: DETAIL_SUMMARY_SIZE,
            sellerKeyword: targetKeyword,
            sort: PRODUCT_SORT,
          }),
          getAdminOrders({
            page: 0,
            size: DETAIL_SUMMARY_SIZE,
            keyword: targetKeyword,
            sort: ORDER_SORT,
          }),
        ]);

        if (ignore) return;

        setTargetProducts(sortByIdAsc(getListContent(productsData), "productId"));
        setTargetOrders(sortByIdAsc(getListContent(ordersData), "orderId"));
      } catch (error) {
        if (ignore) return;
        setTargetProducts([]);
        setTargetOrders([]);
        setDetailMessage(error.message || "신고 대상 회원 관련 정보를 기존 API로 불러오지 못했습니다.");
      } finally {
        if (!ignore) setDetailLoading(false);
      }
    }

    loadReportTargetSummaries();

    return () => {
      ignore = true;
    };
  }, [selectedReport]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    setPage(0);
    setAppliedKeyword(keyword.trim());
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
  }

  function handleReset() {
    setKeyword("");
    setAppliedKeyword("");
    setReasonCode("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
    setPage(0);
    setSelectedReport(null);
  }

  function handleReasonChange(event) {
    setReasonCode(event.target.value);
    setPage(0);
  }

  function handleStatusChange(event) {
    setStatus(event.target.value);
    setPage(0);
  }

  return (
    <div className="admin-page">
      <div className="admin-page-title">
        <h1>신고 관리</h1>
        <p>회원 신고 내역을 조회하고 사유와 처리 상태 기준으로 확인합니다.</p>
      </div>

      <div className="admin-content-main">
        <section className="admin-card search-filter-card">
          <form className="filter-row admin-filter-row-report" onSubmit={handleSearchSubmit}>
            <div className="filter-field search-field">
              <label htmlFor="admin-report-search">신고 검색</label>
              <div className="filter-input">
                <input
                  id="admin-report-search"
                  type="search"
                  placeholder="신고번호, 신고자, 대상 회원, 사유 검색"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </div>
            </div>

            <div className="filter-field">
              <label htmlFor="admin-report-reason">신고 사유</label>
              <select id="admin-report-reason" value={reasonCode} onChange={handleReasonChange}>
                <option value="">전체</option>
                <option value="FRAUD">사기 의심</option>
                <option value="MISLEADING_INFO">상품 정보 허위/불일치</option>
                <option value="PROHIBITED_ITEM">금지 품목</option>
                <option value="ETC">기타</option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="admin-report-status">처리 상태</label>
              <select id="admin-report-status" value={status} onChange={handleStatusChange}>
                <option value="">전체</option>
                <option value="PENDING">대기</option>
                <option value="APPROVED">승인</option>
                <option value="REJECTED">반려</option>
                <option value="DONE">완료</option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="admin-report-date-from">시작일</label>
              <input
                id="admin-report-date-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>

            <div className="filter-field">
              <label htmlFor="admin-report-date-to">종료일</label>
              <input
                id="admin-report-date-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>

            <button className="admin-primary-button" type="submit">
              검색
            </button>
          </form>

          <div className="filter-tabs">
            <button
              className={!status ? "is-active" : ""}
              type="button"
              onClick={() => {
                setStatus("");
                setPage(0);
              }}
            >
              전체
            </button>
            {Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => (
              <button
                className={status === value ? "is-active" : ""}
                type="button"
                key={value}
                onClick={() => {
                  setStatus(value);
                  setPage(0);
                }}
              >
                {label}
              </button>
            ))}
            <button className="reset-button" type="button" onClick={handleReset}>
              초기화
            </button>
          </div>
        </section>

        <section className="admin-card table-card">
          <div className="table-card-header">
            <h2>
              신고 목록 <span>(총 {pageInfo.totalElements}건)</span>
            </h2>
          </div>

          {errorMessage && <p className="admin-inquiry-message">{errorMessage}</p>}

          <div className="admin-table-wrap">
            <table className="admin-table" style={{ minWidth: 1180 }}>
              <thead>
                <tr>
                  <th>신고번호</th>
                  <th>신고자</th>
                  <th>대상 유형</th>
                  <th>대상 회원</th>
                  <th>신고 사유</th>
                  <th>상세 내용</th>
                  <th>처리 상태</th>
                  <th>처리 사유</th>
                  <th>처리일</th>
                  <th>신고일</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="admin-inquiry-empty">
                      신고 목록을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="admin-inquiry-empty">
                      신고 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr
                      className={`report-click-row ${selectedReport?.reportId === report.reportId ? "is-selected" : ""}`}
                      key={String(report.reportId)}
                      onClick={() => setSelectedReport(report)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedReport(report);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <td>{String(report.reportId || "-")}</td>
                      <td title={report.reporterId || ""}>
                        {report.reporterNickname || report.reporterUserid || "-"}
                      </td>
                      <td>{TARGET_TYPE_LABELS[report.targetType] || report.targetType || "-"}</td>
                      <td title={report.targetId || ""}>{report.targetName || "-"}</td>
                      <td>{REASON_LABELS[report.reasonCode] || report.reasonCode || "-"}</td>
                      <td title={report.detail || ""}>{report.detail || "-"}</td>
                      <td>
                        <span className={`status-badge ${REPORT_STATUS_CLASS_NAMES[report.status] || "gray"}`}>
                          {REPORT_STATUS_LABELS[report.status] || report.status || "-"}
                        </span>
                      </td>
                      <td title={report.processedReason || ""}>{report.processedReason || "-"}</td>
                      <td>{formatDate(report.processedAt)}</td>
                      <td>{formatDate(report.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-pagination">
            <button
              type="button"
              disabled={pageInfo.first || loading}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              이전
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                className={pageInfo.pageNumber === pageNumber ? "is-active" : ""}
                type="button"
                key={pageNumber}
                disabled={loading}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={pageInfo.last || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              다음
            </button>
          </div>
        </section>

        <ReportDetailPanel
          report={selectedReport}
          products={targetProducts}
          orders={targetOrders}
          loading={detailLoading}
          message={detailMessage}
          onClose={() => setSelectedReport(null)}
        />
      </div>
    </div>
  );
}

export default AdminReportsPage;
