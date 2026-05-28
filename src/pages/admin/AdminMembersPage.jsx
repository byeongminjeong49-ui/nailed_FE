import { useEffect, useMemo, useState } from "react";
import { fetchAdminMembers } from "../../api/adminApi";

const ROLE_LABELS = {
  ADMIN: "관리자",
  USER: "일반회원",
};

const STATUS_LABELS = {
  ACTIVE: "정상",
  LOCKED: "잠금",
  WITHDRAWN: "탈퇴",
  SUSPEND: "기간정지",
  BANNED: "영구정지",
};

const STATUS_CLASS_NAMES = {
  ACTIVE: "mint",
  LOCKED: "orange",
  WITHDRAWN: "gray",
  SUSPEND: "orange",
  BANNED: "red",
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

function AdminMembersPage() {
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [members, setMembers] = useState([]);
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

    async function loadMembers() {
      setLoading(true);
      setErrorMessage("");

      try {
        const data = await fetchAdminMembers({
          page,
          size,
          keyword: appliedKeyword,
          role,
          status,
        });

        if (ignore) return;

        setMembers(Array.isArray(data?.content) ? data.content : []);
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

        setMembers([]);
        setPageInfo((current) => ({
          ...current,
          pageNumber: 0,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        }));
        setErrorMessage(error.message || "회원 목록을 불러오지 못했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadMembers();

    return () => {
      ignore = true;
    };
  }, [appliedKeyword, page, role, size, status]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    setPage(0);
    setAppliedKeyword(keyword.trim());
  }

  function handleReset() {
    setKeyword("");
    setAppliedKeyword("");
    setRole("");
    setStatus("");
    setPage(0);
  }

  function handleRoleChange(event) {
    setRole(event.target.value);
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
        <h1>회원 관리</h1>
        <p>회원 정보를 조회하고 권한과 상태 기준으로 확인합니다.</p>
      </div>

      <div className="admin-content-main">
        <section className="admin-card search-filter-card">
          <form className="filter-row" onSubmit={handleSearchSubmit}>
            <div className="filter-field search-field">
              <label htmlFor="admin-member-search">회원 검색</label>
              <div className="filter-input">
                <input
                  id="admin-member-search"
                  type="search"
                  placeholder="아이디 또는 닉네임 검색"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </div>
            </div>

            <div className="filter-field">
              <label htmlFor="admin-member-role">권한</label>
              <select id="admin-member-role" value={role} onChange={handleRoleChange}>
                <option value="">전체</option>
                <option value="USER">일반회원</option>
                <option value="ADMIN">관리자</option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="admin-member-status">상태</label>
              <select id="admin-member-status" value={status} onChange={handleStatusChange}>
                <option value="">전체</option>
                <option value="ACTIVE">정상</option>
                <option value="LOCKED">잠금</option>
                <option value="WITHDRAWN">탈퇴</option>
                <option value="SUSPEND">기간정지</option>
                <option value="BANNED">영구정지</option>
              </select>
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
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
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
              회원 목록 <span>(총 {pageInfo.totalElements}건)</span>
            </h2>
          </div>

          {errorMessage && <p className="admin-inquiry-message">{errorMessage}</p>}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>회원ID</th>
                  <th>아이디</th>
                  <th>닉네임</th>
                  <th>권한</th>
                  <th>판매등급</th>
                  <th>상태</th>
                  <th>가입일</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="admin-inquiry-empty">
                      회원 목록을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-inquiry-empty">
                      회원 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.memberId}>
                      <td>{member.memberId || "-"}</td>
                      <td>{member.userid || "-"}</td>
                      <td>{member.nickname || "-"}</td>
                      <td>{ROLE_LABELS[member.role] || member.role || "-"}</td>
                      <td>{member.sellerGrade || "-"}</td>
                      <td>
                        <span className={`status-badge ${STATUS_CLASS_NAMES[member.status] || "gray"}`}>
                          {STATUS_LABELS[member.status] || member.status || "-"}
                        </span>
                      </td>
                      <td>{formatDate(member.createdAt)}</td>
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

export default AdminMembersPage;
