import AdminIcon from "./AdminIcon";

function AdminTopbar() {
  return (
    <header className="admin-topbar">
      <button className="admin-menu-button" type="button" aria-label="메뉴 열기">
        <AdminIcon name="menu" />
      </button>
      <form className="admin-global-search">
        <label className="sr-only" htmlFor="admin-global-search">
          관리자 검색
        </label>
        <input id="admin-global-search" type="search" placeholder="검색어를 입력하세요" />
        <button type="submit" aria-label="검색">
          <AdminIcon name="search" />
        </button>
      </form>
      <div className="admin-user">
        <span className="admin-avatar" aria-hidden="true" />
        <strong>최고관리자</strong>
        <span aria-hidden="true">⌄</span>
      </div>
      <button className="admin-icon-button" type="button" aria-label="알림">
        <AdminIcon name="bell" />
        <b>3</b>
      </button>
      <button className="admin-icon-button" type="button" aria-label="설정">
        <AdminIcon name="settings" />
      </button>
    </header>
  );
}

export default AdminTopbar;
