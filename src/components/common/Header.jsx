const categories = ["맨즈웨어", "우먼즈웨어", "럭셔리", "악세서리", "라이프", "IT/테크"];

const menuItems = [
  { label: "판매", icon: "▣" },
  { label: "채팅", icon: "○" },
  { label: "알림", icon: "♢", badge: 2 },
  { label: "위시리스트", icon: "♡", badge: 3 },
  { label: "로그인", icon: "♙" },
];

function Header() {
  return (
    <header className="site-header">
      <div className="header-main">
        <a className="brand" href="/" aria-label="Nailed 홈">
          Nailed
        </a>
        <form className="search-bar">
          <label className="sr-only" htmlFor="home-search">
            상품명, 브랜드, 키워드 검색
          </label>
          <input
            id="home-search"
            type="search"
            placeholder="상품명, 브랜드, 키워드 검색"
          />
          <button type="submit" aria-label="검색">
            ⌕
          </button>
        </form>
        <nav className="quick-menu" aria-label="사용자 메뉴">
          {menuItems.map((item) => (
            <a href="/" className="quick-menu-item" key={item.label}>
              <span className="quick-icon" aria-hidden="true">
                {item.icon}
                {item.badge && <b>{item.badge}</b>}
              </span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
      <nav className="category-nav" aria-label="상품 카테고리">
        {categories.map((category) => (
          <a href="/" key={category}>
            {category}
          </a>
        ))}
      </nav>
    </header>
  );
}

export default Header;
