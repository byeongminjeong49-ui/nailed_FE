import { useState } from "react";
import { categories } from "../../data/categories";

const menuItems = [
  { label: "판매", icon: "＋", href: "/sell" },
];

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    Boolean(window.localStorage.getItem("nailedMember")),
  );
  const [searchKeyword, setSearchKeyword] = useState(() => {
    if (window.location.pathname !== "/search") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("keyword") || "";
  });
  const authMenuItems = isLoggedIn
    ? [
        { label: "마이페이지", icon: "◎", href: "/mypage" },
        { label: "로그아웃", icon: "↪", href: "/" },
      ]
    : [
        { label: "회원가입", icon: "◎", href: "/signup" },
        { label: "로그인", icon: "◎", href: "/login" },
      ];
  const quickMenuItems = [...menuItems, ...authMenuItems];
  const [activeCategory, setActiveCategory] = useState(null);

  const handleMenuClick = (event, item) => {
    if (item.label !== "로그아웃") {
      return;
    }

    event.preventDefault();
    window.localStorage.removeItem("nailedMember");
    setIsLoggedIn(false);
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const executeSearch = () => {
    const keyword = searchKeyword.trim();
    const hasSearchText = /[\p{L}\p{N}]/u.test(keyword);

    if (!keyword || keyword.length < 2 || !hasSearchText) {
      return;
    }

    window.history.pushState(
      {},
      "",
      `/search?keyword=${encodeURIComponent(keyword)}`,
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    executeSearch();
  };

  const handleSearchKeyDown = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    executeSearch();
  };

  const handleCategoryClick = (event, category, subcategory) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (subcategory) {
      params.set("subcategory", subcategory.value);
    }

    const queryString = params.toString();
    const nextPath = `/category/${encodeURIComponent(category.value)}${
      queryString ? `?${queryString}` : ""
    }`;

    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
    setActiveCategory(null);
  };

  return (
    <header className="site-header">
      <div className="header-main">
        <a className="brand" href="/" aria-label="Nailed 홈">
          Nailed
        </a>
        <form className="search-bar" onSubmit={handleSearchSubmit}>
          <label className="sr-only" htmlFor="home-search">
            상품명, 브랜드, 키워드 검색
          </label>
          <input
            id="home-search"
            type="search"
            placeholder="상품명, 브랜드, 키워드 검색"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <button type="submit" aria-label="검색">
            ⌕
          </button>
        </form>
        <nav className="quick-menu" aria-label="사용자 메뉴">
          {quickMenuItems.map((item) => (
            <a
              href={item.href}
              className="quick-menu-item"
              key={item.label}
              onClick={(event) => handleMenuClick(event, item)}
            >
              <span className="quick-icon" aria-hidden="true">
                {item.icon}
                {item.badge && <b>{item.badge}</b>}
              </span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
      <div className="category-menu-area" onMouseLeave={() => setActiveCategory(null)}>
        <nav className="category-nav" aria-label="상품 카테고리">
          {categories.map((category) => (
            <a
              href={`/category/${encodeURIComponent(category.value)}`}
              key={category.value}
              onClick={(event) => handleCategoryClick(event, category)}
              onFocus={() => setActiveCategory(category)}
              onMouseEnter={() => setActiveCategory(category)}
            >
              {category.label}
            </a>
          ))}
        </nav>
        {activeCategory && (
          <div className="mega-menu">
            <div className="mega-menu-inner">
              <div className="mega-menu-title">
                <strong>{activeCategory.label}</strong>
                <a
                  href={`/category/${encodeURIComponent(activeCategory.value)}`}
                  onClick={(event) => handleCategoryClick(event, activeCategory)}
                >
                  전체보기
                </a>
              </div>
              <div className="mega-menu-columns">
                {activeCategory.groups.map((group) => (
                  <div className="mega-menu-column" key={group.title}>
                    <h2>
                      <a
                        href={`/category/${encodeURIComponent(
                          activeCategory.value,
                        )}?subcategory=${encodeURIComponent(group.value)}`}
                        onClick={(event) =>
                          handleCategoryClick(event, activeCategory, {
                            label: group.title,
                            value: group.value,
                          })
                        }
                      >
                        {group.title}
                      </a>
                    </h2>
                    <div className="mega-menu-links">
                      {group.items.map((subcategory) => (
                        <a
                          href={`/category/${encodeURIComponent(
                            activeCategory.value,
                          )}?subcategory=${encodeURIComponent(subcategory.value)}`}
                          key={subcategory.value}
                          onClick={(event) => handleCategoryClick(event, activeCategory, subcategory)}
                        >
                          {subcategory.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
