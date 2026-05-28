import { useEffect, useMemo, useState } from "react";
import { getAdminReports } from "../../api/adminApi";

const TARGET_TYPE_LABELS = {
  MEMBER: "회원",
};

const REASON_LABELS = {
  FRAUD: "사기 의심",
  ABUSE: "욕설/비방",
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

function AdminReportsPage() {
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [targetType, setTargetType] = useState("");
  const [reasonCode, setReasonCode] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [reports, setReports] = useState([]);
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
          size,
          keyword: appliedKeyword,
          targetType,
          reasonCode,
          status,
          dateFrom: appliedDateFrom,
          dateTo: appliedDateTo,
        });

        if (ignore) return;

        setReports(Array.isArray(data?.content) ? data.content : []);
        setPageInfo({
          pageNumber: data?.pageNumber ?? page,
          pageSize: data?.pageSize ?? size,
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
  }, [appliedDateFrom, appliedDateTo, appliedKeyword, page, reasonCode, size, status, targetType]);

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
    setTargetType("");
    setReasonCode("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
    setPage(0);
  }

  function handleTargetTypeChange(event) {
    setTargetType(event.target.value);
    setPage(0);
  }

  function handleReasonChange(event) {
    setReasonCode(event.target.value);
    setPage(0);
  }

  function handleStatusChange(event) {
    setStatus(event.target.value);
    setPage(0);
  }

  function handleSizeChange(event) {
    setSize(Number(event.target.value));
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
          <form className="filter-row" onSubmit={handleSearchSubmit}>
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
              <label htmlFor="admin-report-target-type">대상 유형</label>
              <select id="admin-report-target-type" value={targetType} onChange={handleTargetTypeChange}>
                <option value="">전체</option>
                <option value="MEMBER">회원</option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="admin-report-reason">신고 사유</label>
              <select id="admin-report-reason" value={reasonCode} onChange={handleReasonChange}>
                <option value="">전체</option>
                <option value="FRAUD">사기 의심</option>
                <option value="ABUSE">욕설/비방</option>
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
                    <tr key={String(report.reportId)}>
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
            <select value={size} onChange={handleSizeChange} disabled={loading}>
              <option value="10">10개씩 보기</option>
              <option value="20">20개씩 보기</option>
              <option value="50">50개씩 보기</option>
            </select>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminReportsPage;
